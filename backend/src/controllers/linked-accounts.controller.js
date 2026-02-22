const supabase = require('../config/supabase');
const usageService = require('../services/usage.service');
const TelegramService = require('../services/telegram.service');

exports.getLinkedAccounts = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('linked_accounts')
            .eq('id', req.user.id)
            .single();

        if (error) throw error;
        res.json(data.linked_accounts || {});
    } catch (error) {
        console.error('Get linked accounts error:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.linkTelegram = async (req, res) => {
    try {
        const { chat_id, username } = req.body;

        if (!chat_id) {
            return res.status(400).json({ error: 'Chat ID is required' });
        }

        // Check Plan - Telegram is Pro only
        const usage = await usageService.calculateUsage(req.user.id);
        const PLAN_LEVELS = { free: 0, basic: 1, pro: 2, business: 3 };
        const currentLevel = PLAN_LEVELS[usage.plan] || 0;

        if (currentLevel < PLAN_LEVELS.pro) {
            return res.status(403).json({
                error: 'Telegram integration is available on Pro plan and above.',
                required_plan: 'pro'
            });
        }

        // Fetch existing
        const { data: user } = await supabase
            .from('users')
            .select('linked_accounts')
            .eq('id', req.user.id)
            .single();

        const existing = user?.linked_accounts || {};

        const newData = {
            ...existing,
            telegram: {
                chat_id,
                username,
                linked_at: new Date().toISOString()
            }
        };

        const { error } = await supabase
            .from('users')
            .update({ linked_accounts: newData })
            .eq('id', req.user.id);

        if (error) throw error;

        await TelegramService.send(chat_id, 'Welcome to OBS Tracker! Your Telegram account has been successfully linked.');

        res.json({ success: true, linked_accounts: newData });

    } catch (error) {
        console.error('Link Telegram error:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.unlinkAccount = async (req, res) => {
    try {
        const { platform } = req.params; // telegram

        if (!['telegram'].includes(platform)) {
            return res.status(400).json({ error: 'Invalid platform' });
        }

        const { data: user } = await supabase
            .from('users')
            .select('linked_accounts')
            .eq('id', req.user.id)
            .single();

        const existing = user?.linked_accounts || {};

        if (existing[platform]) {
            delete existing[platform];

            const { error } = await supabase
                .from('users')
                .update({ linked_accounts: existing })
                .eq('id', req.user.id);

            if (error) throw error;
        }

        res.json({ success: true, linked_accounts: existing });
    } catch (error) {
        console.error('Unlink account error:', error);
        res.status(500).json({ error: error.message });
    }
};
