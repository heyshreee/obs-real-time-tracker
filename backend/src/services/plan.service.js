const supabase = require('../config/supabase');

let plansCache = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch all plans from Supabase
 * @returns {Promise<Array>} List of plans
 */
exports.getAllPlans = async () => {
    const now = Date.now();
    if (plansCache && (now - lastFetchTime < CACHE_DURATION)) {
        return plansCache;
    }

    try {
        const { data, error } = await supabase
            .from('plans')
            .select('*')
            .order('price_usd', { ascending: true }); // Order by price

        if (error) {
            console.error('Error fetching plans:', error);
            throw error;
        }

        plansCache = data;
        lastFetchTime = now;
        return data;
    } catch (error) {
        console.error('Plan fetch service error:', error);
        // Return fallback if cache exists, else throw
        if (plansCache) return plansCache;
        throw error;
    }
};

/**
 * Get limits for a specific plan ID
 * @param {string} planId 
 * @returns {Promise<Object>} Plan limits
 */
exports.getPlanLimits = async (planId) => {
    const plans = await this.getAllPlans();
    const plan = plans.find(p => p.id === planId);

    if (!plan) {
        // Fallback to free plan if not found
        return plans.find(p => p.id === 'free') || {};
    }

    // Map DB columns to internal limit names if necessary, 
    // or rely on usageservice to map them.
    // The DB columns: monthly_events, max_projects, storage_limit, allowed_origins, retention_days, refresh_rate, live_logs, email_integrity, share_report
    // The UsageService expects: monthlyViews, storageLimit, projectLimit, liveLogs, refreshRate, emailIntegrity, allowedOriginsLimit, share_report, retentionDays

    return {
        monthlyViews: plan.monthly_events,
        storageLimit: plan.storage_limit,
        projectLimit: plan.max_projects,
        liveLogs: plan.live_logs,
        deviceStats: plan.features ? plan.features.some(f => f.text === 'Live Device Stats' && f.included) : false, // Inspect JSON features for specific flags if not explicit column
        refreshRate: plan.refresh_rate,
        emailIntegrity: plan.email_integrity,
        allowedOriginsLimit: plan.allowed_origins,
        share_report: plan.share_report,
        retentionDays: plan.retention_days,
        retentionDays: plan.retention_days,
        price_inr: plan.price_inr,
        price_usd: plan.price_usd,
        amount: plan.price_usd // Default to USD for internal compatibility if currency not specified
    };
};
