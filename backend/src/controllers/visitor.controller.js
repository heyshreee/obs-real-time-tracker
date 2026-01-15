const supabase = require('../config/supabase');
const geoip = require('geoip-lite');
const UAParser = require('ua-parser-js');

exports.trackVisitor = async (req, res) => {
    try {
        const { trackingCode, sessionId, pageUrl, referrer } = req.body;

        // Get user by tracking code
        const { data: user } = await supabase
            .from('users')
            .select('id')
            .eq('tracking_code', trackingCode)
            .single();

        if (!user) {
            return res.status(404).json({ error: 'Invalid tracking code' });
        }

        const ip = req.ip || req.connection.remoteAddress;
        const geo = geoip.lookup(ip);
        const parser = new UAParser(req.headers['user-agent']);
        const uaResult = parser.getResult();

        const visitorData = {
            user_id: user.id,
            session_id: sessionId,
            ip_address: ip,
            user_agent: req.headers['user-agent'],
            country: geo?.country || 'Unknown',
            city: geo?.city || 'Unknown',
            device_type: uaResult.device.type || 'desktop',
            browser: uaResult.browser.name,
            os: uaResult.os.name,
            page_url: pageUrl,
            referrer: referrer,
            is_active: true,
            last_seen: new Date()
        };

        // Upsert visitor
        const { data: visitor, error: visitorError } = await supabase
            .from('visitors')
            .upsert(visitorData, { onConflict: 'session_id' })
            .select()
            .single();

        if (visitorError) throw visitorError;

        // Record page view
        await supabase.from('page_views').insert({
            visitor_id: visitor.id,
            user_id: user.id,
            page_url: pageUrl
        });

        // Emit to socket
        if (global.io) {
            global.io.to(`user_${user.id}`).emit('visitor_update', visitor);
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Track error:', error);
        res.status(500).json({ error: 'Tracking failed' });
    }
};

exports.getLiveVisitors = async (req, res) => {
    try {
        const userId = req.user.id;

        // In a real app, we'd filter by last_seen within 5 mins
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

        const { data: visitors, error } = await supabase
            .from('visitors')
            .select('*')
            .eq('user_id', userId)
            .eq('is_active', true)
            .gte('last_seen', fiveMinutesAgo);

        if (error) throw error;

        res.json(visitors);
    } catch (error) {
        console.error('Get live visitors error:', error);
        res.status(500).json({ error: 'Failed to fetch visitors' });
    }
};

exports.getStats = async (req, res) => {
    try {
        const userId = req.user.id;

        // Simple stats for now
        const { count: totalVisitors } = await supabase
            .from('visitors')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);

        const { count: activeVisitors } = await supabase
            .from('visitors')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('is_active', true);

        res.json({
            totalVisitors,
            activeVisitors
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
};
