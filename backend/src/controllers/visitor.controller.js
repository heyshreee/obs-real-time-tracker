const supabase = require('../config/supabase');
const geoip = require('geoip-lite');
const UAParser = require('ua-parser-js');
const { validate: uuidValidate } = require('uuid');

// Simple in-memory cache for deduplication
const requestCache = new Set();

exports.trackVisitor = async (req, res) => {
    try {
        const { trackingCode, sessionId, pageUrl, referrer, title } = req.body;

        // Deduplication check
        // Use a combination of trackingCode, sessionId (if available), and pageUrl
        // If sessionId is missing, we might rely on IP, but let's assume client sends something or we generate it later.
        // Ideally, we generate sessionId first if missing, but for dedupe we need it now.
        // If sessionId is missing, we can't effectively dedupe without IP.
        // Prioritize X-Forwarded-For for proxies (Vercel, Nginx, etc.)
        const forwarded = req.headers['x-forwarded-for'];
        const ip = forwarded ? forwarded.split(',')[0].trim() : (req.ip || req.connection.remoteAddress);

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
        } else {
            // Try to handle cases where geoip fails but it's not localhost
            // We can leave it as Unknown or try another lookup if available
            // For now, 'Unknown' is better than 'Localhost' for public IPs
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
            project_id: project.id,
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
                user_id: project.user_id,
                project_id: project.id,
                page_url: pageUrl,
                title: title || 'Unknown Page'
            });

            // Emit to socket
            if (global.io) {
                global.io.to(`user_${project.user_id}`).emit('visitor_update', { ...visitor, project_id: project.id });
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

        // 2. Traffic Trends
        const range = req.query.range || '30d';
        let startDate = new Date();
        let groupBy = 'day'; // 'day' or 'hour'

        if (range === '24h') {
            startDate.setHours(startDate.getHours() - 24);
            groupBy = 'hour';
        } else if (range === '7d') {
            startDate.setDate(startDate.getDate() - 6);
            groupBy = 'day';
        } else {
            // 30d default
            startDate.setDate(startDate.getDate() - 29);
            groupBy = 'day';
        }
        const startDateStr = startDate.toISOString();

        const { data: dailyViews } = await supabase
            .from('page_views')
            .select('created_at')
            .eq('user_id', userId)
            .gte('created_at', startDateStr);

        const trafficMap = {};

        if (range === '24h') {
            // Initialize last 24 hours
            for (let i = 23; i >= 0; i--) {
                const d = new Date();
                d.setHours(d.getHours() - i);
                const hourStr = d.toISOString().slice(0, 13) + ':00:00.000Z'; // YYYY-MM-DDTHH:00...
                // Use local time label for map key to match view logic or keep ISO for sorting?
                // Let's use ISO key for sorting, format later
                trafficMap[hourStr] = 0;
            }
        } else {
            // Initialize days
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
                // Round down to hour
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
            return {
                name,
                views: trafficMap[key],
                fullDate: key
            };
        });

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

        // 6. Device Breakdown
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

        // 7. Top Pages
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
        const { sessionId, pageUrl, referrer, title } = req.body;

        const forwarded = req.headers['x-forwarded-for'];
        const ip = forwarded ? forwarded.split(',')[0].trim() : (req.ip || req.connection.remoteAddress);

        // Deduplication check
        const dedupeKey = `${trackingId}-${sessionId || ip}-${pageUrl}`;
        if (requestCache.has(dedupeKey)) {
            return res.json({ success: true, ignored: true });
        }
        requestCache.add(dedupeKey);
        setTimeout(() => requestCache.delete(dedupeKey), 2000); // 2 seconds debounce

        const { data: project } = await supabase
            .from('projects')
            .select('id, user_id, allowed_origins')
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
            project_id: project.id,
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
                user_id: project.user_id,
                project_id: project.id,
                page_url: pageUrl,
                title: title || 'Unknown Page'
            });

            if (global.io) {
                global.io.to(`user_${project.user_id}`).emit('visitor_update', { ...visitor, project_id: project.id });
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
            .select('id, allowed_origins')
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

exports.getProjectDetailedStats = async (req, res) => {
    try {
        const { id } = req.params; // Project ID
        const userId = req.user.id;

        // Verify project ownership
        // Verify project ownership
        let query = supabase
            .from('projects')
            .select('id, tracking_id, allowed_origins')
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

        // 1. Real-time Visitors (Last 5 mins)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        const { count: realTimeVisitors } = await supabase
            .from('visitors')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', project.id)
            .eq('is_active', true)
            .gte('last_seen', fiveMinutesAgo);

        // 2. Traffic Trends
        const range = req.query.range || '7d';
        let timezone = req.query.timezone || 'UTC';

        // Normalize timezone
        const tzMap = {
            '(GMT+05:30) Chennai, Kolkata, Mumbai, New Delhi': 'Asia/Kolkata',
            '(GMT+00:00) UTC': 'UTC',
            '(GMT-05:00) Eastern Time (US & Canada)': 'America/New_York',
            '(GMT-08:00) Pacific Time (US & Canada)': 'America/Los_Angeles'
        };
        if (tzMap[timezone]) {
            timezone = tzMap[timezone];
        }

        // Validate timezone
        try {
            new Intl.DateTimeFormat('en-US', { timeZone: timezone });
        } catch (e) {
            console.warn(`Invalid timezone: ${timezone}, falling back to UTC`);
            timezone = 'UTC';
        }

        let startDate = new Date();

        if (range === '24h') {
            startDate.setHours(startDate.getHours() - 24);
        } else if (range === '30d') {
            startDate.setDate(startDate.getDate() - 29);
        } else {
            // 7d default
            startDate.setDate(startDate.getDate() - 6);
        }
        const startDateStr = startDate.toISOString();

        const { data: dailyViews } = await supabase
            .from('page_views')
            .select('created_at')
            .eq('project_id', project.id)
            .gte('created_at', startDateStr);

        const trafficMap = {};

        // Helper to format date in target timezone
        const formatInTimezone = (date, options) => {
            return new Date(date).toLocaleString('en-US', { ...options, timeZone: timezone });
        };

        if (range === '24h') {
            for (let i = 23; i >= 0; i--) {
                const d = new Date();
                d.setHours(d.getHours() - i);
                // Key format: "YYYY-MM-DD HH:00" in target timezone
                const dateInTz = new Date(d.toLocaleString('en-US', { timeZone: timezone }));
                const key = dateInTz.getFullYear() + '-' +
                    String(dateInTz.getMonth() + 1).padStart(2, '0') + '-' +
                    String(dateInTz.getDate()).padStart(2, '0') + ' ' +
                    String(dateInTz.getHours()).padStart(2, '0') + ':00';
                trafficMap[key] = 0;
            }
        } else {
            const days = range === '30d' ? 29 : 6;
            for (let i = days; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                // Key format: "YYYY-MM-DD" in target timezone
                const dateInTz = new Date(d.toLocaleString('en-US', { timeZone: timezone }));
                const key = dateInTz.getFullYear() + '-' +
                    String(dateInTz.getMonth() + 1).padStart(2, '0') + '-' +
                    String(dateInTz.getDate()).padStart(2, '0');
                trafficMap[key] = 0;
            }
        }

        dailyViews?.forEach(v => {
            let key;
            const dateInTz = new Date(new Date(v.created_at).toLocaleString('en-US', { timeZone: timezone }));

            if (range === '24h') {
                key = dateInTz.getFullYear() + '-' +
                    String(dateInTz.getMonth() + 1).padStart(2, '0') + '-' +
                    String(dateInTz.getDate()).padStart(2, '0') + ' ' +
                    String(dateInTz.getHours()).padStart(2, '0') + ':00';
            } else {
                key = dateInTz.getFullYear() + '-' +
                    String(dateInTz.getMonth() + 1).padStart(2, '0') + '-' +
                    String(dateInTz.getDate()).padStart(2, '0');
            }

            if (trafficMap[key] !== undefined) {
                trafficMap[key]++;
            }
        });

        const trafficData = Object.keys(trafficMap).map(key => {
            let name;
            // Parse the key back to a date object for formatting (assuming key is local time in target timezone)
            // We append a dummy time/offset to make it parseable, but we only need the components
            const [datePart, timePart] = key.split(' ');
            const [year, month, day] = datePart.split('-').map(Number);
            const hour = timePart ? parseInt(timePart.split(':')[0]) : 0;

            // Create a date object representing this local time
            const localDate = new Date(year, month - 1, day, hour);

            if (range === '24h') {
                name = localDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            } else if (range === '30d') {
                name = localDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            } else {
                name = localDate.toLocaleDateString('en-US', { weekday: 'short' });
            }
            return {
                name,
                views: trafficMap[key],
                fullDate: key // This is now the local date string, which sorts correctly alphabetically
            };
        }).sort((a, b) => a.fullDate.localeCompare(b.fullDate));

        // 3. Recent Activity
        const limit = parseInt(req.query.limit) || 5;
        const { data: recentActivity } = await supabase
            .from('page_views')
            .select('*, visitors(ip_address, device_type, city, country)')
            .eq('project_id', project.id)
            .order('created_at', { ascending: false })
            .limit(limit);

        const activityList = recentActivity?.map(v => {
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
                timestamp: v.created_at,
                device: visitor.device_type
            };
        }) || [];

        // 4. Top Referrers
        const { data: sources } = await supabase
            .from('visitors')
            .select('referrer')
            .eq('project_id', project.id)
            .gte('last_seen', startDateStr);

        const sourceMap = {};
        sources?.forEach(s => {
            let ref = 'Direct';
            if (s.referrer) {
                try {
                    ref = new URL(s.referrer).hostname;
                } catch (e) {
                    ref = s.referrer;
                }
            }
            sourceMap[ref] = (sourceMap[ref] || 0) + 1;
        });

        const topReferrers = Object.entries(sourceMap)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5)
            .map((s, i) => ({ ...s, color: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][i] || '#CBD5E1' }));

        // 5. Unique Visitors (Total for range)
        const { count: uniqueVisitors } = await supabase
            .from('visitors')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', project.id)
            .gte('last_seen', startDateStr);

        // 6. Device Breakdown
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

        // 7. Top Pages
        const { data: pages } = await supabase
            .from('page_views')
            .select('page_url, title')
            .eq('project_id', project.id)
            .gte('created_at', startDateStr);

        const pageMap = {};
        pages?.forEach(p => {
            try {
                const url = new URL(p.page_url);
                const path = url.pathname;
                const key = path; // Use path as key for aggregation

                if (!pageMap[key]) {
                    pageMap[key] = { views: 0, title: p.title || path };
                }
                pageMap[key].views++;
                // Update title if we have a better one (not Unknown Page)
                if (p.title && p.title !== 'Unknown Page') {
                    pageMap[key].title = p.title;
                }
            } catch (e) {
                const key = p.page_url;
                if (!pageMap[key]) {
                    pageMap[key] = { views: 0, title: p.title || key };
                }
                pageMap[key].views++;
            }
        });

        const topPages = Object.entries(pageMap)
            .map(([url, data]) => ({ url, views: data.views, title: data.title }))
            .sort((a, b) => b.views - a.views)
            .slice(0, 5);

        // 6. Avg Session Duration (Mocked for now)
        const avgSessionDuration = "2m 45s";

        res.json({
            realTimeVisitors: realTimeVisitors || 0,
            trafficData,
            recentActivity: activityList,
            topReferrers,
            uniqueVisitors: uniqueVisitors || 0,
            deviceStats,
            topPages,
            avgSessionDuration
        });

    } catch (error) {
        console.error('Get project detailed stats error:', error);
        res.status(500).json({ error: 'Failed to fetch project stats' });
    }
};


