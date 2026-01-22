const ActivityLogService = require('../services/activity.service');

const getProjectLogs = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { page, limit, search, type, days } = req.query;
        const userId = req.user.id;

        const result = await ActivityLogService.getLogs(projectId, userId, {
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 20,
            search,
            type,
            days
        });

        res.json(result);
    } catch (error) {
        console.error('Get logs error:', error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getProjectLogs
};
