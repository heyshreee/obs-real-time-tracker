const supabase = require('../config/supabase');
const { v4: uuidv4, validate: uuidValidate } = require('uuid');
const usageService = require('../services/usage.service');
const NotificationService = require('../services/notification.service');
const ActivityLogService = require('../services/activity.service');

exports.createProject = async (req, res) => {
    try {
        const { name, allowedOrigins } = req.body;
        const userId = req.user.id;

        if (!name) {
            return res.status(400).json({ error: 'Project name is required' });
        }

        if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
            return res.status(400).json({ error: 'Project name can only contain letters, numbers, underscores, and hyphens' });
        }

        // Check limits before creating project
        const limitCheck = await usageService.checkLimit(userId, 'create_project');
        if (!limitCheck.canTrack) {
            return res.status(403).json({
                error: 'LIMIT_EXCEEDED',
                message: limitCheck.reason
            });
        }

        // Check if project with same name exists
        const { data: existingProjects } = await supabase
            .from('projects')
            .select('id')
            .eq('user_id', userId)
            .eq('name', name);

        if (existingProjects && existingProjects.length > 0) {
            return res.status(400).json({ error: 'Project with this name already exists' });
        }

        const trackingId = 'trk_' + uuidv4().replace(/-/g, '').substring(0, 12);

        const { data: project, error } = await supabase
            .from('projects')
            .insert({
                name,
                user_id: userId,
                tracking_id: trackingId,
                allowed_origins: allowedOrigins || null
            })
            .select()
            .single();

        if (error) throw error;

        // Initialize counter
        await supabase.from('counters').insert({
            project_id: project.id,
            count: 0
        });

        // Notify user
        await NotificationService.create(
            userId,
            'Project Created',
            `Project "${project.name}" has been successfully created.`,
            'success'
        );

        // Check if limit reached after creation
        const { count } = await supabase
            .from('projects')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);

        const usage = await usageService.calculateUsage(userId);
        if (count >= usage.projectLimit) {
            await NotificationService.create(
                userId,
                'Plan Limit Reached',
                `You have reached the maximum number of projects (${usage.projectLimit}) for your plan. Upgrade to create more.`,
                'warning'
            );
        }

        res.status(201).json(project);
    } catch (error) {
        console.error('Create project error:', error);
        res.status(500).json({ error: 'Failed to create project' });
    }
};

exports.getProjects = async (req, res) => {
    try {
        const userId = req.user.id;

        const { data: projects, error } = await supabase
            .from('projects')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json(projects);
    } catch (error) {
        console.error('Get projects error:', error);
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
};

exports.getProject = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        let query = supabase
            .from('projects')
            .select('*')
            .eq('user_id', userId);

        if (uuidValidate(id)) {
            query = query.eq('id', id);
        } else {
            // Decode URL encoded name if necessary, though express usually handles it
            query = query.eq('name', id);
        }

        const { data: project, error } = await query.single();

        if (error) throw error;
        if (!project) return res.status(404).json({ error: 'Project not found' });

        res.json(project);
    } catch (error) {
        console.error('Get project error:', error);
        res.status(500).json({ error: 'Failed to fetch project' });
    }
};

exports.deleteProject = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        let projectId = id;
        if (!uuidValidate(id)) {
            const { data: project } = await supabase
                .from('projects')
                .select('id')
                .eq('name', id)
                .eq('user_id', userId)
                .single();

            if (!project) return res.status(404).json({ error: 'Project not found' });
            projectId = project.id;
        }

        // Manual Cascade Delete (in case DB constraints are missing)
        // 1. Delete Page Views
        await supabase.from('page_views').delete().eq('project_id', projectId);

        // 2. Delete Visitors
        await supabase.from('visitors').delete().eq('project_id', projectId);

        // 3. Delete Counters
        await supabase.from('counters').delete().eq('project_id', projectId);

        // 4. Delete Usages
        await supabase.from('usages').delete().eq('project_id', projectId);

        // 5. Delete Project
        const { error } = await supabase
            .from('projects')
            .delete()
            .eq('id', projectId)
            .eq('user_id', userId);

        if (error) throw error;

        // Audit Log
        const { logAction } = require('../services/audit.service');
        await logAction(userId, 'PROJECT_DELETE', { projectId });

        // Notify user
        await NotificationService.create(
            userId,
            'Project Deleted',
            `Project has been successfully deleted.`,
            'system'
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Delete project error:', error);
        res.status(500).json({ error: 'Failed to delete project' });
    }
};

exports.updateProject = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, allowedOrigins, targetUrl, isActive, timezone, notifications } = req.body;
        const userId = req.user.id;

        let projectId = id;
        if (!uuidValidate(id)) {
            const { data: project } = await supabase
                .from('projects')
                .select('id')
                .eq('name', id)
                .eq('user_id', userId)
                .single();

            if (!project) return res.status(404).json({ error: 'Project not found' });
            projectId = project.id;
        }

        const updates = {};
        if (name) {
            if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
                return res.status(400).json({ error: 'Project name can only contain letters, numbers, underscores, and hyphens' });
            }
            updates.name = name;
        }
        if (allowedOrigins !== undefined) updates.allowed_origins = allowedOrigins;
        if (targetUrl !== undefined) updates.target_url = targetUrl;
        if (isActive !== undefined) updates.is_active = isActive;
        if (timezone) updates.timezone = timezone;
        if (notifications) updates.notifications = notifications;

        const { data: updatedProject, error } = await supabase
            .from('projects')
            .update(updates)
            .eq('id', projectId)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) throw error;

        // Log Activity
        if (isActive !== undefined) {
            await ActivityLogService.log(
                projectId,
                userId,
                'Project Disabled',
                `Manual suspension by project owner. Reason: User action`,
                isActive ? 'success' : 'warning'
            );
        } else if (Object.keys(updates).length > 0) {
            await ActivityLogService.log(
                projectId,
                userId,
                'Settings Updated',
                'Project settings were updated',
                'success'
            );
        }

        // Notify user
        await NotificationService.create(
            userId,
            'Project Updated',
            `Settings for project "${updatedProject.name}" have been updated.`,
            'success'
        );

        if (allowedOrigins !== undefined) {
            await NotificationService.create(
                userId,
                'Security Update',
                `Allowed origins for project "${updatedProject.name}" have been modified.`,
                'security'
            );
        }

        if (isActive !== undefined) {
            const status = isActive ? 'enabled' : 'disabled';
            await NotificationService.create(
                userId,
                'Project Status Changed',
                `Project "${updatedProject.name}" has been ${status}.`,
                isActive ? 'success' : 'warning'
            );
        }

        res.json(updatedProject);
    } catch (error) {
        console.error('Update project error:', error);
        res.status(500).json({ error: 'Failed to update project' });
    }
};

exports.getShareReport = async (req, res) => {
    try {
        const { shareToken } = req.params;

        const { data: project } = await supabase
            .from('projects')
            .select('id, name, timezone, created_at')
            .eq('share_token', shareToken)
            .single();

        if (!project) {
            return res.status(404).json({ error: 'Report not found or link is invalid' });
        }

        // Default range 30d for report
        const range = '30d';
        let timezone = project.timezone || 'UTC';
        const tzMap = {
            '(GMT+05:30) Chennai, Kolkata, Mumbai, New Delhi': 'Asia/Kolkata',
            '(GMT+00:00) UTC': 'UTC',
            '(GMT-05:00) Eastern Time (US & Canada)': 'America/New_York',
            '(GMT-08:00) Pacific Time (US & Canada)': 'America/Los_Angeles'
        };
        if (tzMap[timezone]) timezone = tzMap[timezone];

        let startDate = new Date();
        startDate.setDate(startDate.getDate() - 29);
        const startDateStr = startDate.toISOString();

        // 1. Traffic Data
        const { data: dailyViews } = await supabase
            .from('page_views')
            .select('created_at')
            .eq('project_id', project.id)
            .gte('created_at', startDateStr);

        const trafficMap = {};
        for (let i = 29; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateInTz = new Date(d.toLocaleString('en-US', { timeZone: timezone }));
            const key = dateInTz.getFullYear() + '-' + String(dateInTz.getMonth() + 1).padStart(2, '0') + '-' + String(dateInTz.getDate()).padStart(2, '0');
            trafficMap[key] = 0;
        }

        dailyViews?.forEach(v => {
            const dateInTz = new Date(new Date(v.created_at).toLocaleString('en-US', { timeZone: timezone }));
            const key = dateInTz.getFullYear() + '-' + String(dateInTz.getMonth() + 1).padStart(2, '0') + '-' + String(dateInTz.getDate()).padStart(2, '0');
            if (trafficMap[key] !== undefined) trafficMap[key]++;
        });

        const trafficData = Object.keys(trafficMap).map(key => {
            const [year, month, day] = key.split('-').map(Number);
            const localDate = new Date(year, month - 1, day);
            return {
                name: localDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                views: trafficMap[key],
                fullDate: key
            };
        }).sort((a, b) => a.fullDate.localeCompare(b.fullDate));

        // 2. Top Referrers
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

        // 3. Device Stats
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

        // 4. Unique Visitors
        const { count: uniqueVisitors } = await supabase
            .from('visitors')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', project.id)
            .gte('last_seen', startDateStr);

        // 5. Total Views & Current Month
        const { data: counter } = await supabase
            .from('counters')
            .select('count')
            .eq('project_id', project.id)
            .single();

        const currentMonth = new Date().toISOString().slice(0, 7);
        const { data: usage } = await supabase
            .from('usages')
            .select('views')
            .eq('project_id', project.id)
            .eq('month', currentMonth)
            .single();

        res.json({
            project: {
                name: project.name,
                timezone: project.timezone,
                created_at: project.created_at
            },
            stats: {
                total_views: counter?.count || 0,
                current_month_views: usage?.views || 0,
                uniqueVisitors: uniqueVisitors || 0,
                trafficData,
                topReferrers,
                deviceStats
            }
        });
    } catch (error) {
        console.error('Get share report error:', error);
        res.status(500).json({ error: 'Failed to fetch report' });
    }
};

exports.regenerateShareToken = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        let projectId = id;
        if (!uuidValidate(id)) {
            // resolve name to id logic if needed, omitted for brevity as usually ID is passed
            const { data: project } = await supabase
                .from('projects')
                .select('id')
                .eq('name', id)
                .eq('user_id', userId)
                .single();
            if (!project) return res.status(404).json({ error: 'Project not found' });
            projectId = project.id;
        }

        const { data: updatedProject, error } = await supabase
            .from('projects')
            .update({ share_token: uuidv4() })
            .eq('id', projectId)
            .eq('user_id', userId)
            .select('share_token')
            .single();

        if (error) throw error;

        // Notify user
        await NotificationService.create(
            userId,
            'Report Generated',
            `A new public report link has been generated for project "${updatedProject.name || 'Unknown'}".`,
            'activity'
        );

        res.json({ share_token: updatedProject.share_token });
    } catch (error) {
        console.error('Regenerate token error:', error);
        res.status(500).json({ error: 'Failed to regenerate token' });
    }
};

exports.getProjectStats = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        let projectId = id;

        // If id is not a UUID, resolve it to an ID first
        if (!uuidValidate(id)) {
            const { data: project } = await supabase
                .from('projects')
                .select('id')
                .eq('name', id)
                .eq('user_id', userId)
                .single();

            if (!project) {
                return res.status(404).json({ error: 'Project not found' });
            }
            projectId = project.id;
        } else {
            // Verify project ownership even if UUID
            const { data: project } = await supabase
                .from('projects')
                .select('id')
                .eq('id', projectId)
                .eq('user_id', userId)
                .single();

            if (!project) {
                return res.status(404).json({ error: 'Project not found' });
            }
        }

        // Get total views from counters
        const { data: counter } = await supabase
            .from('counters')
            .select('count')
            .eq('project_id', projectId)
            .single();

        // Get current month views from usages
        const currentMonth = new Date().toISOString().slice(0, 7);
        const { data: usage } = await supabase
            .from('usages')
            .select('views')
            .eq('project_id', projectId)
            .eq('month', currentMonth)
            .single();

        // Get granular storage and session stats
        const projectUsage = await usageService.calculateProjectUsage(projectId);

        res.json({
            total_views: counter?.count || 0,
            current_month_views: usage?.views || 0,
            ...projectUsage
        });
    } catch (error) {
        console.error('Get project stats error:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
};

exports.togglePin = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        let projectId = id;
        if (!uuidValidate(id)) {
            const { data: project } = await supabase
                .from('projects')
                .select('id')
                .eq('name', id)
                .eq('user_id', userId)
                .single();

            if (!project) return res.status(404).json({ error: 'Project not found' });
            projectId = project.id;
        }

        // First get current status
        const { data: project, error: fetchError } = await supabase
            .from('projects')
            .select('is_pinned')
            .eq('id', projectId)
            .eq('user_id', userId)
            .single();

        if (fetchError || !project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // Log general settings update if not just status change
        if (Object.keys(updates).length > 0 && (isActive === undefined || Object.keys(updates).length > 1)) {
            await ActivityLogService.log(
                project.id,
                req.user.id,
                'Settings Updated',
                'Project settings were updated',
                'success'
            );
        }

        const { data: updatedProject, error: updateError } = await supabase
            .from('projects')
            .update({ is_pinned: !project.is_pinned })
            .eq('id', projectId)
            .eq('user_id', userId)
            .select()
            .single();

        if (updateError) throw updateError;

        res.json(updatedProject);
    } catch (error) {
        console.error('Toggle pin error:', error);
        res.status(500).json({ error: 'Failed to toggle pin status' });
    }
};

exports.getProjectActivity = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const limit = parseInt(req.query.limit) || 50;

        let projectId = id;
        if (!uuidValidate(id)) {
            const { data: project } = await supabase
                .from('projects')
                .select('id')
                .eq('name', id)
                .eq('user_id', userId)
                .single();

            if (!project) return res.status(404).json({ error: 'Project not found' });
            projectId = project.id;
        } else {
            const { data: project } = await supabase
                .from('projects')
                .select('id')
                .eq('id', id)
                .eq('user_id', userId)
                .single();

            if (!project) return res.status(404).json({ error: 'Project not found' });
            projectId = project.id;
        }

        const { data: activity } = await supabase
            .from('visitors')
            .select('*')
            .eq('project_id', projectId)
            .order('last_seen', { ascending: false })
            .limit(limit);

        const activityList = activity?.map(v => {
            const city = v.city === 'Unknown' ? '' : v.city;
            const country = v.country === 'Unknown' ? '' : v.country;
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
                ip: v.ip_address,
                site,
                path,
                timestamp: v.last_seen,
                device: v.device_type
            };
        }) || [];

        res.json(activityList);
    } catch (error) {
        console.error('Get activity error:', error);
        res.status(500).json({ error: 'Failed to fetch activity' });
    }
};

exports.getProjectPages = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const range = req.query.range || '30d';

        let projectId = id;
        if (!uuidValidate(id)) {
            const { data: project } = await supabase
                .from('projects')
                .select('id')
                .eq('name', id)
                .eq('user_id', userId)
                .single();

            if (!project) return res.status(404).json({ error: 'Project not found' });
            projectId = project.id;
        } else {
            const { data: project } = await supabase
                .from('projects')
                .select('id')
                .eq('id', id)
                .eq('user_id', userId)
                .single();

            if (!project) return res.status(404).json({ error: 'Project not found' });
            projectId = project.id;
        }

        let startDate = new Date();
        if (range === '24h') startDate.setHours(startDate.getHours() - 24);
        else if (range === '7d') startDate.setDate(startDate.getDate() - 6);
        else startDate.setDate(startDate.getDate() - 29);
        const startDateStr = startDate.toISOString();

        const { data: pages } = await supabase
            .from('page_views')
            .select('page_url, title')
            .eq('project_id', projectId)
            .gte('created_at', startDateStr);

        const pageMap = {};
        pages?.forEach(p => {
            try {
                const url = new URL(p.page_url);
                const path = url.pathname;
                const key = path;

                if (!pageMap[key]) {
                    pageMap[key] = { views: 0, title: p.title || path };
                }
                pageMap[key].views++;
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
            .sort((a, b) => b.views - a.views);

        res.json(topPages);
    } catch (error) {
        console.error('Get pages error:', error);
        res.status(500).json({ error: 'Failed to fetch pages' });
    }
};
