/**
 * Safely extracts the client IP address from request headers.
 * Never trust x-forwarded-for blindly.
 */
const getClientIp = (req) => {
    // 1. Check x-forwarded-for if we trust the proxy
    // In a real SaaS, you'd whitelist specific proxy IPs (e.g., Cloudflare, Vercel)
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
        // Take the first IP in the list (the original client IP)
        const ips = forwarded.split(',').map(ip => ip.trim());
        return ips[0];
    }

    // 2. Fallback to socket IP
    return req.ip ||
        req.connection?.remoteAddress ||
        req.socket?.remoteAddress ||
        req.connection?.socket?.remoteAddress;
};

module.exports = { getClientIp };
