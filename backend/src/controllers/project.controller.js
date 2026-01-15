const supabase = require('../config/supabase');
const { v4: uuidv4 } = require('uuid');

exports.createProject = async (req, res) => {
    try {
        const { name } = req.body;
        const userId = req.user.id;

        if (!name) {
            return res.status(400).json({ error: 'Project name is required' });
        }

        const trackingId = 'trk_' + uuidv4().replace(/-/g, '').substring(0, 12);

        const { data: project, error } = await supabase
            .from('projects')
            .insert({
                name,
                user_id: userId,
                tracking_id: trackingId
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

exports.getProjectStats = async (req, res) => {
    try {
        // Mock stats for now as we don't have project-level tracking yet
        // In a real implementation, we would query the visitors/page_views table filtered by project_id
        res.json({
            total_views: 0,
            current_month_views: 0
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
};
