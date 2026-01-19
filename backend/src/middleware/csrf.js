/**
 * Simple CSRF protection middleware.
 * Enforces a custom header for all non-GET/HEAD/OPTIONS requests.
 * This is effective because browsers won't add custom headers to cross-origin 
 * requests unless they are pre-flighted and allowed by CORS.
 */
module.exports = (req, res, next) => {
    const safeMethods = ['GET', 'HEAD', 'OPTIONS'];

    if (safeMethods.includes(req.method)) {
        return next();
    }

    // Check for custom header
    const csrfHeader = req.headers['x-requested-with'];

    if (!csrfHeader) {
        return res.status(403).json({
            error: 'CSRF_PROTECTION',
            message: 'Missing required security header (X-Requested-With)'
        });
    }

    next();
};
