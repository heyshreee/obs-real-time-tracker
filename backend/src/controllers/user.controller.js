const usageService = require('../services/usage.service');

exports.getUsageStats = async (req, res) => {
    try {
        const userId = req.user.id;
        const usage = await usageService.calculateUsage(userId);
        res.json(usage);
    } catch (error) {
        console.error('Get usage stats error:', error);
        res.status(500).json({ error: 'Failed to fetch usage stats' });
    }
};
