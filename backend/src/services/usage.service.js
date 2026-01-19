const supabase = require('../config/supabase');

const PLAN_LIMITS = {
    free: {
        monthlyViews: 10000,
        storageLimit: 1 * 1024 * 1024 * 1024 // 1GB
    },
    pro: {
        monthlyViews: 500000,
        storageLimit: 10 * 1024 * 1024 * 1024 // 10GB
    },
    enterprise: {
        monthlyViews: 1000000000, // Effectively unlimited
        storageLimit: 100 * 1024 * 1024 * 1024 // 100GB
    }
};

/**
 * Get limits for a specific plan
 */
exports.getPlanLimits = (plan = 'free') => {
    return PLAN_LIMITS[plan] || PLAN_LIMITS.free;
};

/**
 * Calculate current usage for a user
 */
exports.calculateUsage = async (userId) => {
    const currentMonth = new Date().toISOString().slice(0, 7);

    // 1. Get user plan
    const { data: user } = await supabase
        .from('users')
        .select('plan')
        .eq('id', userId)
        .single();

    const plan = user?.plan || 'free';
    const limits = exports.getPlanLimits(plan);

    // 2. Calculate Views (Current Month)
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

    // 3. Calculate Storage (Estimated)
    const [{ count: visitorCount }, { count: viewCount }] = await Promise.all([
        supabase.from('visitors').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('page_views').select('*', { count: 'exact', head: true }).eq('user_id', userId)
    ]);

    // Estimate: ~0.5KB per visitor row, ~0.5KB per page_view row
    const visitorStorage = (visitorCount || 0) * 512;
    const viewStorage = (viewCount || 0) * 512;
    const storageUsed = visitorStorage + viewStorage;

    return {
        totalViews,
        monthlyLimit: limits.monthlyViews,
        storageUsed,
        storageLimit: limits.storageLimit,
        storageBreakdown: {
            visitors: visitorStorage,
            pageViews: viewStorage
        },
        plan
    };
};

/**
 * Calculate storage and stats for a specific project
 */
exports.calculateProjectUsage = async (projectId) => {
    const [{ count: visitorCount }, { count: viewCount }] = await Promise.all([
        supabase.from('visitors').select('*', { count: 'exact', head: true }).eq('project_id', projectId),
        supabase.from('page_views').select('*', { count: 'exact', head: true }).eq('project_id', projectId)
    ]);

    const visitorStorage = (visitorCount || 0) * 512;
    const viewStorage = (viewCount || 0) * 512;
    const storageUsed = visitorStorage + viewStorage;

    // Calculate sessions per user for this project
    const { data: sessions } = await supabase
        .from('visitors')
        .select('session_id')
        .eq('project_id', projectId);

    const uniqueSessions = new Set(sessions?.map(s => s.session_id)).size;

    return {
        storageUsed,
        storageBreakdown: {
            visitors: visitorStorage,
            pageViews: viewStorage
        },
        visitorCount: visitorCount || 0,
        viewCount: viewCount || 0,
        sessionCount: uniqueSessions
    };
};

/**
 * Check if a user can still track data
 */
exports.checkLimit = async (userId) => {
    const usage = await this.calculateUsage(userId);

    const viewsOk = usage.totalViews < usage.monthlyLimit;
    const storageOk = usage.storageUsed < usage.storageLimit;

    return {
        canTrack: viewsOk && storageOk,
        reason: !viewsOk ? 'Monthly view limit reached' : !storageOk ? 'Storage limit reached' : null,
        usage
    };
};
