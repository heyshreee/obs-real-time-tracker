const supabase = require('../config/supabase');

const trackingCors = async (req, res, next) => {
    try {
        const origin = req.headers.origin;
        const { trackingId, id } = req.params;
        const projectId = trackingId || id;

        // Dashboard origins (always allowed)
        const dashboardOrigins = [
            'http://localhost:5173',
            'http://127.0.0.1:5173',
            process.env.FRONTEND_URL
        ].filter(Boolean).map(o => o.replace(/\/$/, ''));

        // Default CORS headers
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Cache-Control, Pragma');
        res.header('Access-Control-Allow-Credentials', 'true');

        // If no origin (server-to-server) or "null" origin, allow
        if (!origin || origin === 'null') {
            return next();
        }

        const requestOrigin = origin.replace(/\/$/, '');

        // 1. Check if it's a dashboard origin
        if (dashboardOrigins.includes(requestOrigin)) {
            res.header('Access-Control-Allow-Origin', origin);
        }
        // 2. Check project-specific origins if a project ID is present
        else if (projectId) {
            // Determine if projectId is a UUID or a tracking_id
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(projectId);

            let query = supabase
                .from('projects')
                .select('allowed_origins');

            if (isUUID) {
                query = query.eq('id', projectId);
            } else {
                query = query.eq('tracking_id', projectId);
            }

            const { data: project, error: dbError } = await query.single();

            if (dbError && dbError.code !== 'PGRST116') {
                console.error('[CORS] Supabase error:', dbError);
            }

            if (project) {
                if (project.allowed_origins) {
                    const allowedOrigins = project.allowed_origins.split(',').map(o => o.trim().replace(/\/$/, ''));

                    if (allowedOrigins.includes(requestOrigin)) {
                        res.header('Access-Control-Allow-Origin', origin);
                    } else {
                        console.log(`[CORS] Blocked: Origin ${origin} not in allowed list for project ${projectId}`);
                        // Explicitly block if origins are set but don't match
                        if (req.method !== 'OPTIONS') {
                            return res.status(403).json({
                                error: 'CORS_BLOCKED',
                                message: 'Origin not allowed in project settings'
                            });
                        }
                    }
                } else {
                    // No specific origins set -> Allow All (SaaS default for tracking)
                    res.header('Access-Control-Allow-Origin', origin);
                }
            } else {
                console.log(`[CORS] Project not found for ID: ${projectId}`);
            }
        }
        // If not dashboard and not a valid project origin, we don't set the header.
        // The browser will block the request automatically.

        // Handle Preflight
        if (req.method === 'OPTIONS') {
            return res.status(204).end();
        }

        next();
    } catch (error) {
        console.error('CORS Middleware Error:', error);
        next();
    }
};

module.exports = trackingCors;
