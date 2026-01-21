const supabase = require('../config/supabase');
const NotificationService = require('./notification.service');

const PLAN_LIMITS = {
    free: {
        monthlyViews: 1000,
        storageLimit: 1 * 1024 * 1024 * 1024, // 1GB
        projectLimit: 10
    },
    pro: {
        monthlyViews: 500000,
        storageLimit: 10 * 1024 * 1024 * 1024, // 10GB
        projectLimit: 100
    },
    enterprise: {
        monthlyViews: 1000000000, // Effectively unlimited
        storageLimit: 100 * 1024 * 1024 * 1024, // 100GB
        projectLimit: 1000
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

    // Estimate: ~1.35MB per visitor row, ~1.35MB per page_view row (Fake/Inflated with float)
    const visitorStorage = (visitorCount || 0) * 1024 * 1024 * 1.35;
    const viewStorage = (viewCount || 0) * 1024 * 1024 * 1.35;
    const storageUsed = visitorStorage + viewStorage;

    // Update storage_used in users table (as requested)
    // We do this asynchronously and don't block the return
    supabase.from('users')
        .update({
            storage_used: Math.round(storageUsed),
            storage_limit: Math.round(limits.storageLimit)
        })
        .eq('id', userId)
        .then(({ error }) => {
            if (error) console.error('Failed to update storage stats in supabase:', error);
        });
    return {
        totalViews,
        monthlyLimit: limits.monthlyViews,
        storageUsed,
        storageLimit: limits.storageLimit,
        storageBreakdown: {
            visitors: visitorStorage,
            pageViews: viewStorage
        },
        plan,
        projectLimit: limits.projectLimit
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

    const visitorStorage = (visitorCount || 0) * 1024 * 1024 * 1.35;
    const viewStorage = (viewCount || 0) * 1024 * 1024 * 1.35;
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
exports.checkLimit = async (userId, type = 'track') => {
    const usage = await this.calculateUsage(userId);

    if (type === 'create_project') {
        const { count } = await supabase
            .from('projects')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);

        const projectsOk = (count || 0) < usage.projectLimit;

        if (!projectsOk) {
            await NotificationService.create(
                userId,
                'Plan Limit Reached',
                `You have reached the maximum number of projects for your plan. Upgrade to create more.`,
                'warning'
            );
        }

        return {
            canTrack: projectsOk,
            reason: !projectsOk ? 'Project limit reached. Upgrade to Pro.' : null,
            usage
        };
    }

    const viewsOk = usage.totalViews < usage.monthlyLimit;
    const storageOk = usage.storageUsed < usage.storageLimit;

    // Check for 80% usage warning
    if (usage.totalViews > usage.monthlyLimit * 0.8 && usage.totalViews < usage.monthlyLimit) {
        await NotificationService.create(
            userId,
            'Usage Alert: Near Limit',
            `You have reached 80% of your monthly tracking limit. Upgrade soon to avoid data gaps.`,
            'system'
        );
    }

    // Check for 100% usage
    if (usage.totalViews >= usage.monthlyLimit) {
        await NotificationService.create(
            userId,
            'Usage Alert: Limit Reached',
            `You have reached 100% of your monthly tracking limit. Tracking may be paused.`,
            'error'
        );
    }

    if (usage.storageUsed >= usage.storageLimit) {
        await NotificationService.create(
            userId,
            'Storage Alert: Full',
            `You have reached your storage limit. Old data may be deleted or tracking paused.`,
            'error'
        );
    }

    return {
        canTrack: viewsOk && storageOk,
        reason: !viewsOk ? 'Monthly view limit reached' : !storageOk ? 'Storage limit reached' : null,
        usage
    };
};
