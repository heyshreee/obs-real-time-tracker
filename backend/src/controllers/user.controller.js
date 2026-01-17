const supabase = require('../config/supabase');

exports.getUsageStats = async (req, res) => {
    try {
        const userId = req.user.id;
        const currentMonth = new Date().toISOString().slice(0, 7);

        // Get user plan limits (mocked for now, or fetch from users table if available)
        // In a real app, this would come from the user's subscription data
        const { data: user } = await supabase
            .from('users')
            .select('plan')
            .eq('id', userId)
            .single();

        const planLimits = {
            free: 10000,
            pro: 100000,
            enterprise: 1000000
        };

        const monthlyLimit = planLimits[user?.plan || 'free'] || 10000;

        // Calculate total usage for the current month across all projects
        // We need to join projects to ensure we only count this user's projects
        const { data: projects } = await supabase
            .from('projects')
            .select('id')
            .eq('user_id', userId);

        let totalViews = 0;

        if (projects && projects.length > 0) {
            const projectIds = projects.map(p => p.id);

            const { data: usages } = await supabase
                .from('usages')
                .select('views')
                .in('project_id', projectIds)
                .eq('month', currentMonth);

            if (usages) {
                totalViews = usages.reduce((acc, curr) => acc + curr.views, 0);
            }
        }

        res.json({
            totalViews,
            monthlyLimit,
            plan: user?.plan || 'free'
        });
    } catch (error) {
        console.error('Get usage stats error:', error);
        res.status(500).json({ error: 'Failed to fetch usage stats' });
    }
};
