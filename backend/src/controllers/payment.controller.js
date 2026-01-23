const razorpay = require('../config/razorpay');
const crypto = require('crypto');
const supabase = require('../config/supabase');
const ActivityLogService = require('../services/activity.service');
const { getPlanLimits } = require('../services/usage.service');

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
            const { error } = await supabase
                .from('users')
                .update({
                    plan: planId
                })
                .eq('id', userId);

            if (error) throw error;

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

            res.json({ success: true, message: 'Payment verified and plan updated' });
        } else {
            res.status(400).json({ error: 'Invalid signature' });
        }
    } catch (error) {
        console.error('Verify payment error:', error);
        res.status(500).json({ error: 'Payment verification failed' });
    }
};
