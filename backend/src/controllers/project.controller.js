const supabase = require('../config/supabase');
const { v4: uuidv4, validate: uuidValidate } = require('uuid');
const usageService = require('../services/usage.service');

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

        const { error } = await supabase
            .from('projects')
            .delete()
            .eq('id', projectId)
            .eq('user_id', userId);

        if (error) throw error;

        res.json({ success: true });
    } catch (error) {
        console.error('Delete project error:', error);
        res.status(500).json({ error: 'Failed to delete project' });
    }
};

exports.updateProject = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, allowedOrigins } = req.body;
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
        if (req.body.timezone) updates.timezone = req.body.timezone;
        if (req.body.notifications) updates.notifications = req.body.notifications;

        const { data: updatedProject, error } = await supabase
            .from('projects')
            .update(updates)
            .eq('id', projectId)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) throw error;

        res.json(updatedProject);
    } catch (error) {
        console.error('Update project error:', error);
        res.status(500).json({ error: 'Failed to update project' });
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
