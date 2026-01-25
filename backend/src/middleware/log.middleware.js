const ActivityLogService = require('../services/activity.service');
const { getClientIp } = require('../utils/ip');

/**
 * Middleware to log requests to the activity log
 * @param {string} action - The action name to log
 */
const autoLog = (action) => {
    return async (req, res, next) => {
        const start = Date.now();
        const ip = getClientIp(req);

        // Capture original end to calculate latency
        const originalEnd = res.end;
        res.end = function (...args) {
            const latency = Date.now() - start;
            const status = res.statusCode >= 400 ? 'failure' : (res.statusCode >= 300 ? 'warning' : 'success');

            // Extract metadata
            const metadata = {
                session_id: req.body?.sessionId || req.query?.sessionId || req.headers['x-session-id'],
                resource: req.originalUrl,
                http_method: req.method,
                http_status: res.statusCode,
                latency_ms: latency,
                user_agent: req.headers['user-agent'],
                request_id: req.headers['x-request-id'],
                // Plan and other fields might need to be populated by other middlewares or controllers
            };

            // Determine project ID
            const projectId = req.params.projectId || req.params.id || req.body?.trackingId || req.body?.projectId;
            const userId = req.user?.id;

            if (projectId) {
                ActivityLogService.log(
                    projectId,
                    userId,
                    action || `${req.method} ${req.baseUrl}`,
                    `${req.method} request to ${req.originalUrl}`,
                    status,
                    ip,
                    metadata
                );
            }

            originalEnd.apply(res, args);
        };

        next();
    };
};

module.exports = { autoLog };
