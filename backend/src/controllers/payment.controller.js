const razorpay = require('../config/razorpay');
const crypto = require('crypto');
const supabase = require('../config/supabase');
const ActivityLogService = require('../services/activity.service');
const { getPlanLimits } = require('../services/usage.service');
const EmailService = require('../services/email.service');
const ReceiptService = require('../services/receipt.service');

exports.createOrder = async (req, res) => {
    try {
        const { planId } = req.body;
        const userId = req.user.id;

        const planLimits = getPlanLimits(planId);
        const amount = planLimits.amount;

        if (amount === 'custom' || amount === undefined) {
            return res.status(400).json({ error: 'Invalid plan or custom pricing required' });
        }

        if (amount === 0) {
            return res.status(400).json({ error: 'Free plan cannot be purchased' });
        }

        console.log('Creating order for:', { userId, planId, amount });

        const options = {
            amount: amount * 100, // Amount in paise
            currency: 'INR',
            receipt: `rcpt_${Date.now().toString().slice(-10)}_${Math.floor(Math.random() * 1000)}`,
            notes: {
                userId,
                planId
            }
        };

        const order = await razorpay.orders.create(options);

        res.json({
            success: true,
            order
        });
    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({ error: 'Failed to create order' });
    }
};

exports.verifyPayment = async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            planId
        } = req.body;
        const userId = req.user.id;

        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        if (expectedSignature === razorpay_signature) {
            // Payment verified - Update user plan
            const { error: updateError } = await supabase
                .from('users')
                .update({
                    plan: planId
                })
                .eq('id', userId);

            if (updateError) throw updateError;

            // Store payment record
            const planLimits = getPlanLimits(planId);
            const amount = planLimits.amount;

            const { error: paymentError } = await supabase
                .from('payments')
                .insert({
                    user_id: userId,
                    amount: amount,
                    currency: 'USD', // Or INR based on Razorpay config
                    status: 'paid',
                    method: 'razorpay',
                    plan_id: planId,
                    provider_payment_id: razorpay_payment_id,
                    provider_order_id: razorpay_order_id,
                    metadata: {
                        plan: planId,
                        order_id: razorpay_order_id
                    }
                });

            if (paymentError) console.error('Failed to store payment record:', paymentError);

            // Log activity
            await ActivityLogService.log(
                null, // No project ID for user-level action
                userId,
                'subscription.upgraded',
                `Upgraded to ${planId} plan`,
                'success',
                req.ip,
                {
                    plan: planId,
                    payment_id: razorpay_payment_id,
                    order_id: razorpay_order_id
                }
            );

            // Send Payment Receipt Email
            if (req.user && req.user.email) {
                const planLimits = getPlanLimits(planId);
                const amount = planLimits.amount;

                await EmailService.sendPaymentSuccessEmail(
                    req.user.email,
                    planId,
                    amount, // Amount is already in currency unit (e.g., 29), not paise
                    razorpay_payment_id,
                    new Date().toLocaleDateString(),
                    req.user.name || 'User'
                );
            }

            res.json({ success: true, message: 'Payment verified and plan updated' });
        } else {
            res.status(400).json({ error: 'Invalid signature' });
        }
    } catch (error) {
        console.error('Verify payment error:', error);
        res.status(500).json({ error: 'Payment verification failed' });
    }
};

exports.getPaymentHistory = async (req, res) => {
    try {
        const userId = req.user.id;

        // Fetch payments from payments table
        const { data: payments, error } = await supabase
            .from('payments')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const history = payments.map(payment => ({
            id: payment.provider_payment_id || payment.id,
            date: payment.created_at,
            amount: payment.amount,
            plan: payment.plan_id,
            status: payment.status,
            description: `Subscription - ${payment.plan_id} Plan`
        }));

        res.json(history);
    } catch (error) {
        console.error('Get payment history error:', error);
        res.status(500).json({ error: 'Failed to fetch payment history' });
    }
};

exports.getReceipt = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Fetch payment details from Razorpay
        const payment = await razorpay.payments.fetch(id);

        if (!payment) {
            return res.status(404).json({ error: 'Payment not found' });
        }

        // Verify ownership via email (Razorpay stores email) or check if it exists in user's activity logs
        // For stricter security, check if this payment_id exists in user's activity logs
        const { data: log } = await supabase
            .from('activity_logs')
            .select('id')
            .eq('user_id', userId)
            .eq('action', 'subscription.upgraded')
            .contains('metadata', { payment_id: id })
            .single();

        if (!log) {
            return res.status(403).json({ error: 'Access denied to this receipt' });
        }

        const user = {
            name: req.user.name,
            email: req.user.email
        };

        // Set headers for PDF download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=receipt_${id}.pdf`);

        ReceiptService.generateReceipt(payment, user, res);

    } catch (error) {
        console.error('Get receipt error:', error);
        res.status(500).json({ error: 'Failed to generate receipt' });
    }
};

exports.downgradePlan = async (req, res) => {
    try {
        const userId = req.user.id;
        const { planId } = req.body; // Should be 'free'

        if (planId !== 'free') {
            return res.status(400).json({ error: 'Invalid plan for downgrade' });
        }

        // Update user plan
        const { error } = await supabase
            .from('users')
            .update({ plan: 'free' })
            .eq('id', userId);

        if (error) throw error;

        // Log activity
        await ActivityLogService.log(
            null,
            userId,
            'subscription.downgraded',
            'Downgraded to Free plan',
            'warning',
            req.ip,
            {
                plan: 'free'
            }
        );

        // Send Email
        if (req.user && req.user.email) {
            EmailService.sendPlanDowngradedEmail(
                req.user.email,
                'Free',
                new Date().toLocaleDateString(),
                req.user.name || 'User'
            ).catch(console.error);
        }

        res.json({ success: true, message: 'Plan downgraded successfully' });
    } catch (error) {
        console.error('Downgrade plan error:', error);
        res.status(500).json({ error: 'Failed to downgrade plan' });
    }
};

exports.emailReceipt = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Fetch payment details from Razorpay
        const payment = await razorpay.payments.fetch(id);

        if (!payment) {
            return res.status(404).json({ error: 'Payment not found' });
        }

        // Verify ownership
        const { data: log } = await supabase
            .from('activity_logs')
            .select('id')
            .eq('user_id', userId)
            .eq('action', 'subscription.upgraded')
            .contains('metadata', { payment_id: id })
            .single();

        if (!log) {
            return res.status(403).json({ error: 'Access denied to this receipt' });
        }

        const user = {
            name: req.user.name,
            email: req.user.email
        };

        // Generate PDF Buffer
        const buffers = [];
        const doc = new require('pdfkit')({ margin: 50 });

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', async () => {
            const pdfBuffer = Buffer.concat(buffers);

            // Send Email
            await EmailService.sendReceiptEmail(
                user.email,
                pdfBuffer,
                id,
                user.name || 'User'
            );

            res.json({ success: true, message: 'Receipt sent to email' });
        });

        // Generate content (Reuse logic or refactor ReceiptService to accept doc)
        // For now, we'll duplicate the generation logic slightly or better, update ReceiptService to return doc or accept stream
        // Let's modify ReceiptService to be more flexible, but for now, let's just use a temporary stream approach or refactor ReceiptService.
        // Actually, ReceiptService.generateReceipt takes a res (stream). We can pass a PassThrough stream or just use the doc events as above.
        // But ReceiptService creates its own doc. Let's refactor ReceiptService slightly to accept a doc or return one.
        // Wait, ReceiptService.generateReceipt creates a NEW doc.
        // Let's just update ReceiptService to allow passing a stream/doc or just copy the logic here for simplicity to avoid breaking existing code, 
        // OR better: Update ReceiptService to accept a stream.

        // Let's try to use ReceiptService.generateReceipt but pass a mock stream that collects data?
        // No, ReceiptService creates the doc. 
        // Let's update ReceiptService first to be more reusable.

        // Actually, I'll just implement the generation here using the same logic for now to avoid breaking the other endpoint, 
        // or I can modify ReceiptService in the next step to be reusable. 
        // Let's modify ReceiptService in the next step. For now, I'll put a placeholder here and then update ReceiptService.

        // Wait, I can't leave broken code.
        // I will update ReceiptService FIRST in the next step, then come back here.
        // But I'm already in this tool call.
        // I will write the controller assuming ReceiptService.generatePDFBuffer exists, and then implement it.

        const pdfBuffer = await ReceiptService.generatePDFBuffer(payment, user);

        await EmailService.sendReceiptEmail(
            user.email,
            pdfBuffer,
            id,
            user.name || 'User'
        );

        res.json({ success: true, message: 'Receipt sent to email' });

    } catch (error) {
        console.error('Email receipt error:', error);
        res.status(500).json({ error: 'Failed to send receipt email' });
    }
};
