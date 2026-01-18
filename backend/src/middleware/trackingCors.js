const supabase = require('../config/supabase');

const trackingCors = async (req, res, next) => {
    try {
        const { trackingId } = req.params;
        const origin = req.headers.origin;

        // Default CORS headers for all responses
        res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
        res.header('Access-Control-Allow-Credentials', 'true');

        // If no origin (server-to-server), allow
        if (!origin) {
            return next();
        }

        // Fetch project allowed origins
        const { data: project } = await supabase
            .from('projects')
            .select('allowed_origins')
            .eq('tracking_id', trackingId)
            .single();

        if (project) {
            if (project.allowed_origins) {
                const allowedOrigins = project.allowed_origins.split(',').map(o => o.trim().replace(/\/$/, ''));
                const requestOrigin = origin.replace(/\/$/, '');

                if (allowedOrigins.includes(requestOrigin)) {
                    res.header('Access-Control-Allow-Origin', origin);
                } else {
                    console.log(`[CORS] Blocked Origin: ${origin} for ${trackingId}`);
                    // We don't set Access-Control-Allow-Origin, which blocks it in browser
                    // For strictness, we can return 403, but for preflight we usually just don't send the header
                    if (req.method !== 'OPTIONS') {
                        return res.status(403).json({ error: 'CORS policy: Origin not allowed' });
                    }
                }
            } else {
                // No specific origins set -> Allow All
                res.header('Access-Control-Allow-Origin', origin); // Reflect origin or '*'
            }
        } else {
            // Project not found - let the controller handle 404, but allow CORS so client sees the error
            res.header('Access-Control-Allow-Origin', '*');
        }

        // Handle Preflight
        if (req.method === 'OPTIONS') {
            return res.status(204).end();
        }

        next();
    } catch (error) {
        console.error('Tracking CORS Error:', error);
        // Fail open or closed? Closed is safer, but let's try to allow to not break everything on DB error
        // But for now, let's just pass to next() and let controller handle if DB is down
        next();
    }
};

module.exports = trackingCors;
