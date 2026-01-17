const supabase = require('../config/supabase');
const geoip = require('geoip-lite');
const UAParser = require('ua-parser-js');

// Simple in-memory cache for deduplication
const requestCache = new Set();

exports.trackVisitor = async (req, res) => {
    try {
        const { trackingCode, sessionId, pageUrl, referrer } = req.body;

        // Deduplication check
        // Use a combination of trackingCode, sessionId (if available), and pageUrl
        // If sessionId is missing, we might rely on IP, but let's assume client sends something or we generate it later.
        // Ideally, we generate sessionId first if missing, but for dedupe we need it now.
        // If sessionId is missing, we can't effectively dedupe without IP.
        const ip = req.ip || req.connection.remoteAddress;
        const dedupeKey = `${trackingCode}-${sessionId || ip}-${pageUrl}`;

        if (requestCache.has(dedupeKey)) {
            return res.json({ success: true, ignored: true });
        }
        requestCache.add(dedupeKey);
        setTimeout(() => requestCache.delete(dedupeKey), 2000); // 2 seconds debounce

        // 1. Get project by tracking ID (was trackingCode)
        const { data: project } = await supabase
            .from('projects')
            .select('id, user_id')
            .eq('tracking_id', trackingCode)
            .single();

        if (!project) {
            return res.status(404).json({ error: 'Invalid tracking code' });
        }

        const geo = geoip.lookup(ip);
        const parser = new UAParser(req.headers['user-agent']);
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

        // 2. Update Counters (All-time views)
        const { error: counterError } = await supabase.rpc('increment_project_counter', {
            p_id: project.id
        });

        if (counterError) {
            // Fallback to manual update if RPC doesn't exist
            const { data: counter } = await supabase
                .from('counters')
                .select('count')
                .eq('project_id', project.id)
                .single();

            if (counter) {
                await supabase
                    .from('counters')
                    .update({ count: counter.count + 1, updated_at: new Date() })
                    .eq('project_id', project.id);
            }
        }

        // 3. Update Usages (Monthly views)
        const currentMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"
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
                .insert({
                    project_id: project.id,
                    month: currentMonth,
                    views: 1
                });
        }

        // 4. Keep detailed visitor log
        const visitorData = {
            user_id: project.user_id,
            session_id: sessionId,
            ip_address: ip,
            user_agent: req.headers['user-agent'],
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
            // Record page view
            await supabase.from('page_views').insert({
                visitor_id: visitor.id,
                user_id: project.user_id,
                page_url: pageUrl
            });

            // Emit to socket
            if (global.io) {
                global.io.to(`user_${project.user_id}`).emit('visitor_update', visitor);
            }
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

        // 1. Real-time Visitors (Last 5 mins)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        const { count: realTimeVisitors } = await supabase
            .from('visitors')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('is_active', true)
            .gte('last_seen', fiveMinutesAgo);

        // 2. Traffic Trends (Last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
        const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

        const { data: dailyViews } = await supabase
            .from('page_views')
            .select('created_at')
            .eq('user_id', userId)
            .gte('created_at', thirtyDaysAgoStr);

        // Aggregate daily views
        const trafficMap = {};
        // Initialize last 30 days
        for (let i = 29; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            trafficMap[dateStr] = 0;
        }

        dailyViews?.forEach(v => {
            const dateStr = v.created_at.split('T')[0];
            if (trafficMap[dateStr] !== undefined) {
                trafficMap[dateStr]++;
            }
        });

        const trafficData = Object.keys(trafficMap).map(key => ({
            name: new Date(key).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            views: trafficMap[key]
        }));

        // 3. Top Referral Sources
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

        // 4. Live Activity (Last 5 events)
        const { data: recentActivity } = await supabase
            .from('visitors')
            .select('*')
            .eq('user_id', userId)
            .order('last_seen', { ascending: false })
            .limit(5);

        const liveActivity = recentActivity?.map(v => {
            const locationStr = [v.city, v.country].filter(Boolean).join(', ') || 'Unknown Location';
            return {
                id: v.id,
                type: 'view', // or session
                action: `Visitor from ${locationStr}`,
                target: v.page_url,
                time: new Date(v.last_seen).toLocaleTimeString(),
                location: v.ip_address
            };
        }) || [];

        // 5. Sparkline (Visits per minute for last 30 mins)
        const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
        const { data: recentViews } = await supabase
            .from('page_views')
            .select('created_at')
            .eq('user_id', userId)
            .gte('created_at', thirtyMinutesAgo);

        const sparklineMap = {};
        // Initialize last 30 mins
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

        const sparkline = Object.keys(sparklineMap).map(key => ({
            name: key,
            value: sparklineMap[key]
        }));

        res.json({
            realTimeVisitors: realTimeVisitors || 0,
            trafficData,
            sourceData,
            liveActivity,
            sparkline
        });

    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
};

exports.trackVisitorPublic = async (req, res) => {
    try {
        const { trackingId } = req.params;
        const { sessionId, pageUrl, referrer } = req.body;

        const ip = req.ip || req.connection.remoteAddress;

        // Deduplication check
        const dedupeKey = `${trackingId}-${sessionId || ip}-${pageUrl}`;
        if (requestCache.has(dedupeKey)) {
            return res.json({ success: true, ignored: true });
        }
        requestCache.add(dedupeKey);
        setTimeout(() => requestCache.delete(dedupeKey), 2000); // 2 seconds debounce

        const { data: project } = await supabase
            .from('projects')
            .select('id, user_id')
            .eq('tracking_id', trackingId)
            .single();

        if (!project) {
            return res.status(404).json({ error: 'Invalid tracking code' });
        }

        const geo = geoip.lookup(ip);
        const parser = new UAParser(req.headers['user-agent']);
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

        // Update Counters
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
                    .update({ count: counter.count + 1, updated_at: new Date() })
                    .eq('project_id', project.id);
            }
        }

        // Update Usages
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
                .insert({
                    project_id: project.id,
                    month: currentMonth,
                    views: 1
                });
        }

        // Record detailed visitor log
        const visitorData = {
            user_id: project.user_id,
            session_id: sessionId || 'anon_' + Math.random().toString(36).substr(2, 9), // Fallback if no session
            ip_address: ip,
            user_agent: req.headers['user-agent'],
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
                page_url: pageUrl
            });

            if (global.io) {
                global.io.to(`user_${project.user_id}`).emit('visitor_update', visitor);
            }
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Public track error:', error);
        res.status(500).json({ error: 'Tracking failed' });
    }
};

exports.getVisitorCountPublic = async (req, res) => {
    try {
        const { trackingId } = req.params;

        const { data: project } = await supabase
            .from('projects')
            .select('id')
            .eq('tracking_id', trackingId)
            .single();

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const { data: counter } = await supabase
            .from('counters')
            .select('count')
            .eq('project_id', project.id)
            .single();

        res.json({ count: counter?.count || 0 });
    } catch (error) {
        console.error('Get public count error:', error);
        res.status(500).json({ error: 'Failed to fetch count' });
    }
};
