const supabase = require('../config/supabase');
const { v4: uuidv4 } = require('uuid');

exports.createProject = async (req, res) => {
    try {
        const { name, allowedOrigins } = req.body;
        const userId = req.user.id;

        if (!name) {
            return res.status(400).json({ error: 'Project name is required' });
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

        const { data: project, error } = await supabase
            .from('projects')
            .select('*')
            .eq('id', id)
            .eq('user_id', userId)
            .single();

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

        const { error } = await supabase
            .from('projects')
            .delete()
            .eq('id', id)
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

        const updates = {};
        if (name) updates.name = name;
        if (allowedOrigins !== undefined) updates.allowed_origins = allowedOrigins;

        const { data: updatedProject, error } = await supabase
            .from('projects')
            .update(updates)
            .eq('id', id)
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

        // Verify project ownership
        const { data: project } = await supabase
            .from('projects')
            .select('id')
            .eq('id', id)
            .eq('user_id', userId)
            .single();

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // Get total views from counters
        const { data: counter } = await supabase
            .from('counters')
            .select('count')
            .eq('project_id', id)
            .single();

        // Get current month views from usages
        const currentMonth = new Date().toISOString().slice(0, 7);
        const { data: usage } = await supabase
            .from('usages')
            .select('views')
            .eq('project_id', id)
            .eq('month', currentMonth)
            .single();

        res.json({
            total_views: counter?.count || 0,
            current_month_views: usage?.views || 0
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

        // First get current status
        const { data: project, error: fetchError } = await supabase
            .from('projects')
            .select('is_pinned')
            .eq('id', id)
            .eq('user_id', userId)
            .single();

        if (fetchError || !project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const { data: updatedProject, error: updateError } = await supabase
            .from('projects')
            .update({ is_pinned: !project.is_pinned })
            .eq('id', id)
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
