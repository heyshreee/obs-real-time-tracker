const supabase = require('../config/supabase');
const geoip = require('geoip-lite');
const UAParser = require('ua-parser-js');

exports.trackVisitor = async (req, res) => {
    try {
        const { trackingCode, sessionId, pageUrl, referrer } = req.body;

        // 1. Get project by tracking ID (was trackingCode)
        const { data: project } = await supabase
            .from('projects')
            .select('id, user_id')
            .eq('tracking_id', trackingCode)
            .single();

        if (!project) {
            return res.status(404).json({ error: 'Invalid tracking code' });
        }

        const ip = req.ip || req.connection.remoteAddress;
        const geo = geoip.lookup(ip);
        const parser = new UAParser(req.headers['user-agent']);
        const uaResult = parser.getResult();

        // 2. Update Counters (All-time views)
        // We use RPC or direct increment if Supabase supports it, but for now simple update
        // Note: Concurrency might be an issue here without atomic increment, 
        // but assuming low traffic or eventually consistent for MVP.
        // Better: create a stored procedure `increment_counter(project_id)`

        // Using a hypothetical RPC call for atomicity if available, else fetch-update
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

        // Try to insert new usage record, on conflict do nothing (we'll update next)
        // Or better: Upsert with count increment? 
        // Supabase doesn't support atomic increment on upsert easily without RPC.
        // Let's try to find existing usage first.
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

        // 4. Keep detailed visitor log (Optional but good for "Real-time")
        // Assuming 'visitors' table still exists or we want to keep this logic
        // We link it to user_id (owner) and maybe project_id if we added it to visitors table
        const visitorData = {
            user_id: project.user_id, // Keep linking to user for now
            // project_id: project.id, // Add this if visitors table has project_id
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

exports.getStats = async (req, res) => {
    try {
        const userId = req.user.id;

        // Aggregate stats from projects
        const { data: projects } = await supabase
            .from('projects')
            .select('id')
            .eq('user_id', userId);

        if (!projects || projects.length === 0) {
            return res.json({ totalVisitors: 0, activeVisitors: 0 });
        }

        const projectIds = projects.map(p => p.id);

        // Get total counts from counters
        const { data: counters } = await supabase
            .from('counters')
            .select('count')
            .in('project_id', projectIds);

        const totalVisitors = counters?.reduce((sum, c) => sum + (c.count || 0), 0) || 0;

        // Active visitors still from visitors table
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
        console.error('Get stats error:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
};

exports.trackVisitorPublic = async (req, res) => {
    try {
        const { trackingId } = req.params;
        // Merge params with body to reuse logic or just handle here
        // We'll adapt the logic slightly

        const { sessionId, pageUrl, referrer } = req.body;

        const { data: project } = await supabase
            .from('projects')
            .select('id, user_id')
            .eq('tracking_id', trackingId)
            .single();

        if (!project) {
            return res.status(404).json({ error: 'Invalid tracking code' });
        }

        const ip = req.ip || req.connection.remoteAddress;
        const geo = geoip.lookup(ip);
        const parser = new UAParser(req.headers['user-agent']);
        const uaResult = parser.getResult();

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
