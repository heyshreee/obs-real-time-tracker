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
            // Calculate next billing date (Same day next month)
            const nextBillingDate = new Date();
            nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

            const { error: updateError } = await supabase
                .from('users')
                .update({
                    plan: planId,
                    next_billing_date: nextBillingDate
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

            if (paymentError) {
                console.error('Failed to store payment record:', paymentError);
                throw new Error('Database insert failed: ' + paymentError.message);
            }

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

        console.log(`[Receipt] Request for ID: ${id} by User: ${userId}`);

        // Fetch payment details from DB first (Source of Truth)
        // We check both provider_payment_id (e.g. razorpay id) and internal id
        let query = supabase
            .from('payments')
            .select('*')
            .eq('user_id', userId);

        // Check if ID is a valid UUID
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

        if (isUUID) {
            // It's a UUID, so it could be our internal ID or a provider ID (unlikely but possible)
            query = query.or(`provider_payment_id.eq.${id},id.eq.${id}`);
        } else {
            // It's not a UUID (e.g. 'pay_...'), so it MUST be a provider_payment_id
            query = query.eq('provider_payment_id', id);
        }

        const { data: paymentRecord, error } = await query.single();

        if (error) {
            console.error('[Receipt] DB Query Error:', error);
        } else {
            console.log('[Receipt] Record found:', paymentRecord ? 'Yes' : 'No');
        }

        if (error || !paymentRecord) {
            console.error('Payment not found in DB:', id);
            return res.status(404).json({ error: 'Receipt not found' });
        }

        const user = {
            name: req.user.name,
            email: req.user.email
        };

        // Construct payment object compatible with ReceiptService
        // ReceiptService expects: amount in cents/paise, created_at in seconds, notes.planId
        const paymentData = {
            id: paymentRecord.provider_payment_id || paymentRecord.id,
            created_at: new Date(paymentRecord.created_at).getTime() / 1000,
            method: paymentRecord.method,
            amount: paymentRecord.amount * 100, // Convert main unit to sub-unit (e.g. 29 -> 2900)
            notes: {
                planId: paymentRecord.plan_id
            }
        };

        // Set headers for PDF download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=receipt_${id}.pdf`);

        ReceiptService.generateReceipt(paymentData, user, res);

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
            .update({
                plan: 'free',
                next_billing_date: null
            })
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

        // Fetch payment details from DB
        let query = supabase
            .from('payments')
            .select('*')
            .eq('user_id', userId);

        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

        if (isUUID) {
            query = query.or(`provider_payment_id.eq.${id},id.eq.${id}`);
        } else {
            query = query.eq('provider_payment_id', id);
        }

        const { data: paymentRecord, error } = await query.single();

        if (error || !paymentRecord) {
            return res.status(404).json({ error: 'Payment not found' });
        }

        const user = {
            name: req.user.name,
            email: req.user.email
        };

        // Construct payment object
        const paymentData = {
            id: paymentRecord.provider_payment_id || paymentRecord.id,
            created_at: new Date(paymentRecord.created_at).getTime() / 1000,
            method: paymentRecord.method,
            amount: paymentRecord.amount * 100,
            notes: {
                planId: paymentRecord.plan_id
            }
        };

        // Generate PDF Buffer using Service
        const pdfBuffer = await ReceiptService.generatePDFBuffer(paymentData, user);

        await EmailService.sendReceiptEmail(
            user.email,
            pdfBuffer,
            paymentData.id,
            user.name || 'User'
        );

        res.json({ success: true, message: 'Receipt sent to email' });

    } catch (error) {
        console.error('Email receipt error:', error);
        res.status(500).json({ error: 'Failed to send receipt email' });
    }
};
