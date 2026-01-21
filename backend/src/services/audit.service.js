const supabase = require('../config/supabase');

/**
 * Audit logging service to track critical actions.
 */
const logAction = async (userId, action, metadata = {}) => {
    if (!userId) return; // Don't log if no user

    try {
        const { error } = await supabase
            .from('audit_logs')
            .insert({
                user_id: userId,
                action,
                metadata,
                created_at: new Date().toISOString()
            });

        if (error) {
            // If table is missing, log a more helpful message once
            if (error.code === 'PGRST205' || error.code === '42P01') {
                console.warn('⚠️ Audit logs table is missing. Please run the migration script in backend/database/migrations/');
            } else {
                console.error('Audit log error:', error.message);
            }
        } else {
            // console.log(`Audit log created: ${action} for user ${userId}`);
        }
    } catch (err) {
        // Silent fail for audit logs to avoid crashing the main flow
        console.error('Audit log service error:', err.message);
    }
};

module.exports = { logAction };
