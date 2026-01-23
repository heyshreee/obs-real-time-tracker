const supabase = require('../config/supabase');
const geoip = require('geoip-lite');
const UAParser = require('ua-parser-js');
const { validate: uuidValidate } = require('uuid');
const usageService = require('../services/usage.service');
const { getClientIp } = require('../utils/ip');
const crypto = require('crypto');
const NotificationService = require('../services/notification.service');
const ActivityLogService = require('../services/activity.service');

// Simple in-memory cache for deduplication (rolling TTL)
const requestCache = new Map();

/**
 * Generates a unique hash for a visitor hit to prevent inflation.
 * Hash = SHA256(IP + UserAgent + ProjectId)
 */
const generateHitHash = (ip, ua, projectId) => {
    return crypto.createHash('sha256')
        .update(`${ip}-${ua}-${projectId}`)
        .digest('hex');
};

/**
 * Basic bot heuristics based on User-Agent and patterns.
 */
const isBot = (ua, req) => {
    if (!ua) return true;
    const botPatterns = [
        'bot', 'crawler', 'spider', 'crawling', 'slurp', 'googlebot',
        'bingbot', 'yandexbot', 'baiduspider', 'facebookexternalhit',
        'twitterbot', 'rogerbot', 'linkedinbot', 'embedly', 'quora link preview',
        'showyoubot', 'outbrain', 'pinterest/0.', 'developers.google.com/+/web/snippet',
        'slackbot', 'vkShare', 'W3C_Validator', 'redditbot', 'Applebot',
        'WhatsApp', 'flipboard', 'tumblr', 'bitlybot', 'SkypeShell',
        'Digg', 'bufferbot', 'quora', 'monit', 'Nagios', 'HubSpot',
        'Pingdom', 'Screaming Frog', 'uptimerobot'
    ];

    const uaLower = ua.toLowerCase();
    if (botPatterns.some(pattern => uaLower.includes(pattern.toLowerCase()))) {
        return true;
    }

    // Check for headless browsers or missing common headers
    if (uaLower.includes('headless') || !req.headers['accept-language']) {
        return true;
    }

    return false;
};

exports.trackVisitor = async (req, res) => {
    try {
        const { trackingCode, sessionId, pageUrl, referrer, title } = req.body;
        const userAgent = req.headers['user-agent'] || '';

        // 1. IP Trust Chain
        const ip = getClientIp(req);

        // 2. Bot Filtering
        if (isBot(userAgent, req)) {
            return res.json({ success: true, bot: true });
        }

        // 3. Tracking Abuse Prevention (Hashing + Rolling TTL)
        const hitHash = generateHitHash(ip, userAgent, trackingCode);
        const now = Date.now();

        if (requestCache.has(hitHash)) {
            const lastHit = requestCache.get(hitHash);
            if (now - lastHit < 2000) { // 2 seconds TTL
                return res.json({ success: true, ignored: 'DUPLICATE_HIT' });
            }
        }
        requestCache.set(hitHash, now);

        // Cleanup cache periodically
        if (requestCache.size > 10000) {
            for (const [key, timestamp] of requestCache.entries()) {
                if (now - timestamp > 60000) requestCache.delete(key);
            }
        }

        // 4. Get project by tracking ID
        const { data: project } = await supabase
            .from('projects')
            .select('id, user_id, plan, is_active')
            .eq('tracking_id', trackingCode)
            .single();

        if (project.is_active === false) {
            if (project.user_id) {
                await ActivityLogService.log(
                    project.id,
                    project.user_id,
                    'visitor.blocked',
                    `Tracking attempt blocked: Project is disabled`,
                    'failure',
                    ip,
                    {
                        resource: pageUrl,
                        http_method: req.method,
                        http_status: 403,
                        user_agent: userAgent,
                        event_type: 'visitor.blocked'
                    }
                );
            }
            return res.status(403).json({ error: 'Project is disabled' });
        }

        // Check limits before proceeding
        const limitCheck = await usageService.checkLimit(project.user_id);
        if (!limitCheck.canTrack) {
            return res.status(403).json({
                error: 'LIMIT_EXCEEDED',
                message: limitCheck.reason,
                usage: limitCheck.usage
            });
        }

        const geo = geoip.lookup(ip);
        const parser = new UAParser(userAgent);
        const uaResult = parser.getResult();

        let country = 'Unknown';
        let city = 'Unknown';

        if (geo) {
            country = geo.country || 'Unknown';
            city = geo.city || 'Unknown';
        } else if (ip === '::1' || ip === '127.0.0.1' || ip.includes('127.0.0.1')) {
            country = 'Localhost';
            city = 'Local Machine';
        }

        // 5. Update Counters
        const { error: counterError } = await supabase.rpc('increment_project_counter', {
            p_id: project.id
        });

        if (counterError) {
            const { data: counter } = await supabase
                .from('counters')
                .select('count')
                .eq('project_id', project.id)
                .single();

            if (counter) {
                await supabase
                    .from('counters')
                    .update({ count: (counter.count || 0) + 1, updated_at: new Date() })
                    .eq('project_id', project.id);
            } else {
                await supabase
                    .from('counters')
                    .insert({ project_id: project.id, count: 1 });
            }
        }

        // 6. Update Usages
        const currentMonth = new Date().toISOString().slice(0, 7);
        const { data: usage } = await supabase
            .from('usages')
            .select('views')
            .eq('project_id', project.id)
            .eq('month', currentMonth)
            .single();

        if (usage) {
            await supabase
                .from('usages')
                .update({ views: usage.views + 1, updated_at: new Date() })
                .eq('project_id', project.id)
                .eq('month', currentMonth);
        } else {
            await supabase
                .from('usages')
                .insert({ project_id: project.id, month: currentMonth, views: 1 });
        }

        // 7. Keep detailed visitor log
        const visitorData = {
            user_id: project.user_id,
            project_id: project.id,
            session_id: sessionId || hitHash.substring(0, 20),
            ip_address: ip,
            user_agent: userAgent,
            country: country,
            city: city,
            device_type: uaResult.device.type || 'desktop',
            browser: uaResult.browser.name,
            os: uaResult.os.name,
            page_url: pageUrl,
            referrer: referrer,
            is_active: true,
            last_seen: new Date()
        };

        const { data: visitor, error: visitorError } = await supabase
            .from('visitors')
            .upsert(visitorData, { onConflict: 'session_id' })
            .select()
            .single();

        if (!visitorError) {
            await supabase.from('page_views').insert({
                visitor_id: visitor.id,
                user_id: project.user_id,
                project_id: project.id,
                page_url: pageUrl,
                title: title || 'Unknown Page'
            });

            if (global.io) {
                global.io.to(`user_${project.user_id}`).emit('visitor_update', { ...visitor, project_id: project.id });
                const updatedUsage = await usageService.calculateUsage(project.user_id);
                global.io.to(`user_${project.user_id}`).emit('usage_update', updatedUsage);
            }

            // Log Activity for New Visitor (Internal)
            if (project.user_id) {
                await ActivityLogService.log(
                    project.id,
                    project.user_id,
                    'visitor.new',
                    `Page: ${title || pageUrl}, IP: ${ip}, Country: ${country}`,
                    'success',
                    ip,
                    {
                        session_id: sessionId || hitHash.substring(0, 20),
                        resource: pageUrl,
                        http_method: req.method,
                        http_status: 200,
                        latency_ms: Date.now() - req._startTime || 0,
                        country,
                        city,
                        user_agent: userAgent,
                        event_type: 'visitor.new',
                        plan: project.plan || 'free'
                    }
                );
            }
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Track error:', error);
        res.status(500).json({ error: 'TRACKING_FAILED', message: 'Tracking failed' });
    }
};

exports.getLiveVisitors = async (req, res) => {
    try {
        const userId = req.user.id;
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

exports.getDashboardStats = async (req, res) => {
    try {
        const userId = req.user.id;

        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        const { count: realTimeVisitors } = await supabase
            .from('visitors')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('is_active', true)
            .gte('last_seen', fiveMinutesAgo);

        const range = req.query.range || '30d';
        let startDate = new Date();

        if (range === '24h') {
            startDate.setHours(startDate.getHours() - 24);
        } else if (range === '7d') {
            startDate.setDate(startDate.getDate() - 6);
        } else {
            startDate.setDate(startDate.getDate() - 29);
        }
        const startDateStr = startDate.toISOString();

        const { data: dailyViews } = await supabase
            .from('page_views')
            .select('created_at')
            .eq('user_id', userId)
            .gte('created_at', startDateStr);

        const trafficMap = {};

        if (range === '24h') {
            for (let i = 23; i >= 0; i--) {
                const d = new Date();
                d.setHours(d.getHours() - i);
                const hourStr = d.toISOString().slice(0, 13) + ':00:00.000Z';
                trafficMap[hourStr] = 0;
            }
        } else {
            const days = range === '7d' ? 6 : 29;
            for (let i = days; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const dateStr = d.toISOString().split('T')[0];
                trafficMap[dateStr] = 0;
            }
        }

        dailyViews?.forEach(v => {
            let key;
            if (range === '24h') {
                key = v.created_at.slice(0, 13) + ':00:00.000Z';
            } else {
                key = v.created_at.split('T')[0];
            }
            if (trafficMap[key] !== undefined) {
                trafficMap[key]++;
            }
        });

        const trafficData = Object.keys(trafficMap).map(key => {
            let name;
            if (range === '24h') {
                name = new Date(key).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            } else {
                name = new Date(key).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }
            return { name, views: trafficMap[key], fullDate: key };
        });

        const { data: sources } = await supabase
            .from('visitors')
            .select('referrer')
            .eq('user_id', userId);

        const sourceMap = {};
        sources?.forEach(s => {
            const ref = s.referrer ? new URL(s.referrer).hostname : 'Direct';
            sourceMap[ref] = (sourceMap[ref] || 0) + 1;
        });

        const sourceData = Object.entries(sourceMap)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5)
            .map((s, i) => ({ ...s, color: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][i] || '#CBD5E1' }));

        const { data: recentActivity } = await supabase
            .from('page_views')
            .select('*, visitors(ip_address, device_type, city, country)')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(5);

        const liveActivity = recentActivity?.map(v => {
            const visitor = v.visitors || {};
            const city = visitor.city === 'Unknown' ? '' : visitor.city;
            const country = visitor.country === 'Unknown' ? '' : visitor.country;
            const location = [city, country].filter(Boolean).join(', ') || 'Unknown Location';

            let site = 'Unknown Site';
            let path = '/';
            try {
                const url = new URL(v.page_url);
                site = url.hostname;
                path = url.pathname;
            } catch (e) {
                site = v.page_url || 'Unknown';
            }

            return {
                id: v.id,
                type: 'view',
                location,
                ip: visitor.ip_address,
                site,
                path,
                title: v.title,
                device: visitor.device_type,
                timestamp: v.created_at
            };
        }) || [];

        const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
        const { data: recentViews } = await supabase
            .from('page_views')
            .select('created_at')
            .eq('user_id', userId)
            .gte('created_at', thirtyMinutesAgo);

        const sparklineMap = {};
        for (let i = 29; i >= 0; i--) {
            const d = new Date();
            d.setMinutes(d.getMinutes() - i);
            const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            sparklineMap[timeStr] = 0;
        }

        recentViews?.forEach(v => {
            const timeStr = new Date(v.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            if (sparklineMap[timeStr] !== undefined) {
                sparklineMap[timeStr]++;
            }
        });

        const sparkline = Object.keys(sparklineMap).map(key => ({ name: key, value: sparklineMap[key] }));

        const { data: devices } = await supabase
            .from('visitors')
            .select('device_type')
            .eq('user_id', userId);

        const deviceMap = {};
        devices?.forEach(d => {
            const type = d.device_type || 'desktop';
            deviceMap[type] = (deviceMap[type] || 0) + 1;
        });

        const deviceStats = Object.keys(deviceMap).map(key => ({
            name: key.charAt(0).toUpperCase() + key.slice(1),
            value: deviceMap[key],
            color: key === 'desktop' ? '#3B82F6' : key === 'mobile' ? '#10B981' : '#F59E0B'
        }));

        const { data: pages } = await supabase
            .from('page_views')
            .select('page_url')
            .eq('user_id', userId);

        const pageMap = {};
        pages?.forEach(p => {
            try {
                const url = new URL(p.page_url);
                const path = url.pathname;
                pageMap[path] = (pageMap[path] || 0) + 1;
            } catch (e) {
                pageMap[p.page_url] = (pageMap[p.page_url] || 0) + 1;
            }
        });

        const topPages = Object.entries(pageMap)
            .map(([url, views]) => ({ url, views }))
            .sort((a, b) => b.views - a.views)
            .slice(0, 5);

        res.json({
            realTimeVisitors: realTimeVisitors || 0,
            trafficData,
            sourceData,
            liveActivity,
            sparkline,
            deviceStats,
            topPages
        });

    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
};

exports.trackVisitorPublic = async (req, res) => {
    try {
        const { trackingId } = req.params;
        const { pageUrl, referrer, title } = req.body;
        const userAgent = req.headers['user-agent'] || '';

        // 1. IP Trust Chain
        const ip = getClientIp(req);

        // 2. Bot Filtering
        if (isBot(userAgent, req)) {
            return res.json({ success: true, bot: true });
        }

        // Fetch Project
        const { data: project } = await supabase
            .from('projects')
            .select('id, user_id, allowed_origins, is_active')
            .eq('tracking_id', trackingId)
            .single();

        if (!project) {
            return res.status(404).json({ error: 'INVALID_TRACKING_ID', message: 'Invalid tracking code' });
        }

        if (project.is_active === false) {
            if (project.user_id) {
                await ActivityLogService.log(
                    project.id,
                    project.user_id,
                    'visitor.blocked',
                    `Tracking attempt blocked: Project is disabled`,
                    'failure',
                    ip,
                    {
                        resource: pageUrl,
                        http_method: req.method,
                        http_status: 403,
                        user_agent: userAgent,
                        event_type: 'visitor.blocked'
                    }
                );
            }
            return res.status(403).json({ error: 'Project is disabled' });
        }

        // Check Allowed Origins
        const origin = req.headers['origin'] || req.headers['referer'];
        if (project.allowed_origins && project.allowed_origins.length > 0 && origin) {
            try {
                let originHostname;
                if (origin === 'null') {
                    originHostname = 'null';
                } else {
                    originHostname = new URL(origin).hostname;
                }
                const allowedOriginsArray = project.allowed_origins.split(',').map(o => {
                    try {
                        // If it's a full URL, extract the hostname
                        if (o.trim().startsWith('http')) {
                            return new URL(o.trim()).hostname;
                        }
                        return o.trim();
                    } catch (e) {
                        return o.trim();
                    }
                });
                const isAllowed = allowedOriginsArray.some(allowed =>
                    originHostname === allowed || originHostname.endsWith('.' + allowed)
                );

                if (!isAllowed) {
                    // Notify user about blocked origin
                    await NotificationService.create(
                        project.user_id,
                        'Security Alert: Origin Blocked',
                        `Blocked request from unauthorized origin: ${originHostname} for project "${project.name || 'Unknown'}"`,
                        'security'
                    );

                    // Log security alert as failure
                    if (project.user_id) {
                        await ActivityLogService.log(
                            project.id,
                            project.user_id,
                            'security.alert',
                            `Blocked request from unauthorized origin: ${originHostname}`,
                            'failure',
                            ip,
                            {
                                resource: pageUrl,
                                http_method: req.method,
                                http_status: 403,
                                user_agent: userAgent,
                                event_type: 'security.alert'
                            }
                        );
                    }

                    return res.status(403).json({ error: 'ORIGIN_NOT_ALLOWED' });
                }
            } catch (urlError) {
                console.error('Origin validation error:', urlError);
                return res.status(403).json({ error: 'INVALID_ORIGIN' });
            }
        }

        // Check Limits
        const limitCheck = await usageService.checkLimit(project.user_id);
        if (!limitCheck.canTrack) {
            return res.status(403).json({ error: 'LIMIT_EXCEEDED', message: limitCheck.reason });
        }

        // 3. Tracking Abuse Prevention (Hashing + Rolling TTL)
        const hitHash = generateHitHash(ip, userAgent, trackingId);
        const now = Date.now();

        if (requestCache.has(hitHash)) {
            const lastHit = requestCache.get(hitHash);
            if (now - lastHit < 5000) { // 5 seconds TTL
                return res.json({ success: true, ignored: 'DUPLICATE_HIT' });
            }
        }
        requestCache.set(hitHash, now);

        const geo = geoip.lookup(ip);
        const parser = new UAParser(userAgent);
        const uaResult = parser.getResult();

        let country = 'Unknown';
        let city = 'Unknown';

        if (geo) {
            country = geo.country || 'Unknown';
            city = geo.city || 'Unknown';
        } else if (ip === '::1' || ip === '127.0.0.1' || ip.includes('127.0.0.1')) {
            country = 'Localhost';
            city = 'Local Machine';
        }

        // 5. Update Counters
        const { error: counterError } = await supabase.rpc('increment_project_counter', {
            p_id: project.id
        });

        if (counterError) {
            const { data: counter } = await supabase
                .from('counters')
                .select('count')
                .eq('project_id', project.id)
                .single();

            if (counter) {
                await supabase
                    .from('counters')
                    .update({ count: (counter.count || 0) + 1, updated_at: new Date() })
                    .eq('project_id', project.id);
            } else {
                await supabase
                    .from('counters')
                    .insert({ project_id: project.id, count: 1 });
            }
        }

        const currentMonth = new Date().toISOString().slice(0, 7);
        const { data: usage } = await supabase
            .from('usages')
            .select('views')
            .eq('project_id', project.id)
            .eq('month', currentMonth)
            .single();

        if (usage) {
            await supabase
                .from('usages')
                .update({ views: usage.views + 1, updated_at: new Date() })
                .eq('project_id', project.id)
                .eq('month', currentMonth);
        } else {
            await supabase
                .from('usages')
                .insert({ project_id: project.id, month: currentMonth, views: 1 });
        }

        const sessionId = hitHash.substring(0, 20);

        const visitorData = {
            user_id: project.user_id,
            project_id: project.id,
            session_id: sessionId,
            ip_address: ip,
            user_agent: userAgent,
            country: country,
            city: city,
            device_type: uaResult.device.type || 'desktop',
            browser: uaResult.browser.name,
            os: uaResult.os.name,
            page_url: pageUrl,
            referrer: referrer,
            is_active: true,
            last_seen: new Date()
        };

        const { data: visitor, error: visitorError } = await supabase
            .from('visitors')
            .upsert(visitorData, { onConflict: 'session_id' })
            .select()
            .single();

        if (!visitorError) {
            await supabase.from('page_views').insert({
                visitor_id: visitor.id,
                user_id: project.user_id,
                project_id: project.id,
                page_url: pageUrl,
                title: title || 'Unknown Page'
            });

            if (global.io) {
                global.io.to(`user_${project.user_id}`).emit('visitor_update', { ...visitor, project_id: project.id });
                const updatedUsage = await usageService.calculateUsage(project.user_id);
                global.io.to(`user_${project.user_id}`).emit('usage_update', updatedUsage);
            }

            // Log Activity for New Visitor
            if (project.user_id) {
                await ActivityLogService.log(
                    project.id,
                    project.user_id,
                    'visitor.new',
                    `Page: ${title || pageUrl}, IP: ${ip}, Country: ${country}`,
                    'success',
                    ip,
                    {
                        session_id: sessionId,
                        resource: pageUrl,
                        http_method: req.method,
                        http_status: 200,
                        latency_ms: Date.now() - req._startTime || 0,
                        country,
                        city,
                        user_agent: userAgent,
                        event_type: 'visitor.new',
                        plan: 'free'
                    }
                );
            }

            // Fetch the updated count to return to the frontend
            const { data: counter } = await supabase
                .from('counters')
                .select('count')
                .eq('project_id', project.id)
                .single();

            res.json({
                success: true,
                count: counter?.count || 0
            });
        } else {
            console.error('Visitor upsert error:', visitorError);
            // Still return the count even if visitor log failed
            const { data: counter } = await supabase
                .from('counters')
                .select('count')
                .eq('project_id', project.id)
                .single();
            res.json({ success: true, count: counter?.count || 0 });
        }
    } catch (error) {
        console.error('Public track error:', error);
        res.status(200).json({ success: false, error: 'Internal Error' });
    }
};

exports.getVisitorCountPublic = async (req, res) => {
    try {
        const { trackingId } = req.params;
        const { data: project, error } = await supabase
            .from('projects')
            .select('counters(count)')
            .eq('tracking_id', trackingId)
            .single();

        if (error || !project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // Supabase returns joined tables as arrays by default
        const count = Array.isArray(project.counters)
            ? project.counters[0]?.count
            : project.counters?.count;

        res.json({ count: count || 0 });
    } catch (error) {
        console.error('Get public count error:', error);
        res.status(500).json({ error: 'Failed to fetch count' });
    }
};

exports.getProjectDetailedStats = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        let query = supabase
            .from('projects')
            .select('id, tracking_id')
            .eq('user_id', userId);

        if (uuidValidate(id)) {
            query = query.eq('id', id);
        } else {
            query = query.eq('name', id);
        }

        const { data: project } = await query.single();

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        const { count: realTimeVisitors } = await supabase
            .from('visitors')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', project.id)
            .eq('is_active', true)
            .gte('last_seen', fiveMinutesAgo);

        const range = req.query.range || '7d';
        let timezone = req.query.timezone || 'UTC';
        const tzMap = {
            '(GMT+05:30) Chennai, Kolkata, Mumbai, New Delhi': 'Asia/Kolkata',
            '(GMT+00:00) UTC': 'UTC',
            '(GMT-05:00) Eastern Time (US & Canada)': 'America/New_York',
            '(GMT-08:00) Pacific Time (US & Canada)': 'America/Los_Angeles'
        };
        if (tzMap[timezone]) timezone = tzMap[timezone];

        let startDate = new Date();
        if (range === '24h') startDate.setHours(startDate.getHours() - 24);
        else if (range === '30d') startDate.setDate(startDate.getDate() - 29);
        else startDate.setDate(startDate.getDate() - 6);
        const startDateStr = startDate.toISOString();

        const { data: dailyViews } = await supabase
            .from('page_views')
            .select('created_at')
            .eq('project_id', project.id)
            .gte('created_at', startDateStr);

        const trafficMap = {};
        if (range === '24h') {
            for (let i = 23; i >= 0; i--) {
                const d = new Date();
                d.setHours(d.getHours() - i);
                const dateInTz = new Date(d.toLocaleString('en-US', { timeZone: timezone }));
                const key = dateInTz.getFullYear() + '-' + String(dateInTz.getMonth() + 1).padStart(2, '0') + '-' + String(dateInTz.getDate()).padStart(2, '0') + ' ' + String(dateInTz.getHours()).padStart(2, '0') + ':00';
                trafficMap[key] = 0;
            }
        } else {
            const days = range === '30d' ? 29 : 6;
            for (let i = days; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const dateInTz = new Date(d.toLocaleString('en-US', { timeZone: timezone }));
                const key = dateInTz.getFullYear() + '-' + String(dateInTz.getMonth() + 1).padStart(2, '0') + '-' + String(dateInTz.getDate()).padStart(2, '0');
                trafficMap[key] = 0;
            }
        }

        dailyViews?.forEach(v => {
            const dateInTz = new Date(new Date(v.created_at).toLocaleString('en-US', { timeZone: timezone }));
            let key = range === '24h'
                ? dateInTz.getFullYear() + '-' + String(dateInTz.getMonth() + 1).padStart(2, '0') + '-' + String(dateInTz.getDate()).padStart(2, '0') + ' ' + String(dateInTz.getHours()).padStart(2, '0') + ':00'
                : dateInTz.getFullYear() + '-' + String(dateInTz.getMonth() + 1).padStart(2, '0') + '-' + String(dateInTz.getDate()).padStart(2, '0');
            if (trafficMap[key] !== undefined) trafficMap[key]++;
        });

        const trafficData = Object.keys(trafficMap).map(key => {
            const [datePart, timePart] = key.split(' ');
            const [year, month, day] = datePart.split('-').map(Number);
            const hour = timePart ? parseInt(timePart.split(':')[0]) : 0;
            const localDate = new Date(year, month - 1, day, hour);
            let name = range === '24h' ? localDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : range === '30d' ? localDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : localDate.toLocaleDateString('en-US', { weekday: 'short' });
            return { name, views: trafficMap[key], fullDate: key };
        }).sort((a, b) => a.fullDate.localeCompare(b.fullDate));

        const { data: recentActivity } = await supabase
            .from('page_views')
            .select('*, visitors(ip_address, device_type, city, country)')
            .eq('project_id', project.id)
            .order('created_at', { ascending: false })
            .limit(parseInt(req.query.limit) || 5);

        const activityList = recentActivity?.map(v => {
            const visitor = v.visitors || {};
            const location = [visitor.city, visitor.country].filter(c => c && c !== 'Unknown').join(', ') || 'Unknown Location';
            let path = '/';
            try { path = new URL(v.page_url).pathname; } catch (e) { path = v.page_url || '/'; }
            return { id: v.id, type: 'view', location, ip: visitor.ip_address, path, title: v.title, timestamp: v.created_at, device: visitor.device_type };
        }) || [];

        const { data: sources } = await supabase
            .from('visitors')
            .select('referrer')
            .eq('project_id', project.id)
            .gte('last_seen', startDateStr);

        const sourceMap = {};
        sources?.forEach(s => {
            let ref = 'Direct';
            if (s.referrer) try { ref = new URL(s.referrer).hostname; } catch (e) { ref = s.referrer; }
            sourceMap[ref] = (sourceMap[ref] || 0) + 1;
        });

        const topReferrers = Object.entries(sourceMap)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5)
            .map((s, i) => ({ ...s, color: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][i] || '#CBD5E1' }));

        const { count: uniqueVisitors } = await supabase
            .from('visitors')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', project.id)
            .gte('last_seen', startDateStr);

        const { data: devices } = await supabase
            .from('visitors')
            .select('device_type')
            .eq('project_id', project.id)
            .gte('last_seen', startDateStr);

        const deviceMap = {};
        devices?.forEach(d => {
            const type = d.device_type || 'desktop';
            deviceMap[type] = (deviceMap[type] || 0) + 1;
        });

        const deviceStats = Object.keys(deviceMap).map(key => ({
            name: key.charAt(0).toUpperCase() + key.slice(1),
            value: deviceMap[key],
            color: key === 'desktop' ? '#3B82F6' : key === 'mobile' ? '#10B981' : '#F59E0B'
        }));

        const { data: pages } = await supabase
            .from('page_views')
            .select('page_url, title')
            .eq('project_id', project.id)
            .gte('created_at', startDateStr);

        const pageMap = {};
        pages?.forEach(p => {
            try {
                const path = new URL(p.page_url).pathname;
                if (!pageMap[path]) pageMap[path] = { views: 0, title: p.title || path };
                pageMap[path].views++;
                if (p.title && p.title !== 'Unknown Page') pageMap[path].title = p.title;
            } catch (e) {
                if (!pageMap[p.page_url]) pageMap[p.page_url] = { views: 0, title: p.title || p.page_url };
                pageMap[p.page_url].views++;
            }
        });

        const topPages = Object.entries(pageMap)
            .map(([url, data]) => ({ url, views: data.views, title: data.title }))
            .sort((a, b) => b.views - a.views)
            .slice(0, 5);

        res.json({
            realTimeVisitors: realTimeVisitors || 0,
            trafficData,
            activityList,
            topReferrers,
            uniqueVisitors: uniqueVisitors || 0,
            deviceStats,
            topPages
        });

    } catch (error) {
        console.error('Project detailed stats error:', error);
        res.status(500).json({ error: 'Failed to fetch project stats' });
    }
};
