const rateLimit = require('express-rate-limit');
const ActivityLogService = require('../services/activity.service');
const { getClientIp } = require('../utils/ip');

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later',
    handler: async (req, res, next, options) => {
        const ip = getClientIp(req);
        const projectId = req.params.projectId || req.params.id || req.body?.trackingId || req.body?.projectId;
        const userId = req.user?.id;

        if (projectId) {
            await ActivityLogService.log(
                projectId,
                userId,
                'rate_limit.hit',
                'Rate limit exceeded',
                'blocked',
                ip,
                {
                    resource: req.originalUrl,
                    http_method: req.method,
                    http_status: 429,
                    user_agent: req.headers['user-agent']
                }
            );
        }

        res.status(options.statusCode).send(options.message);
    }
});

module.exports = limiter;
