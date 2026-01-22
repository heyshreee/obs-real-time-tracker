const supabase = require('../config/supabase');
const crypto = require('crypto');

class ActivityLogService {
    /**
     * Log an activity
     * @param {string} projectId - The project ID
     * @param {string} userId - The user ID who performed the action
     * @param {string} action - The action name (e.g., 'Project Disabled')
     * @param {string} details - Additional details
     * @param {string} status - Status of the action ('success', 'warning', 'failure')
     * @param {string} ip - IP address of the user
     * @param {object} metadata - Additional metadata (session_id, resource, http_method, http_status, latency_ms, country, city, user_agent, request_id, plan)
     */
    static async log(projectId, userId, action, details, status = 'success', ip = null, metadata = {}) {
        try {
            const logEntry = {
                project_id: projectId,
                user_id: userId,
                action,
                details,
                status,
                ip_address: ip,
                event_type: metadata.event_type || 'activity',
                session_id: metadata.session_id,
                resource: metadata.resource,
                http_method: metadata.http_method,
                http_status: metadata.http_status,
                latency_ms: metadata.latency_ms,
                country: metadata.country,
                city: metadata.city,
                user_agent: metadata.user_agent,
                request_id: metadata.request_id || `req_${crypto.randomBytes(4).toString('hex')}`,
                plan: metadata.plan,
                created_at: new Date().toISOString()
            };

            // 1. Insert new log
            const { data: insertedLog, error } = await supabase
                .from('activity_logs')
                .insert(logEntry)
                .select()
                .single();

            if (error) {
                // If columns don't exist yet, we might need to handle it or just log the error
                // For now, we assume the DB is updated or we'll handle the error
                console.error('Supabase insert error:', error.message);
                // Fallback: try inserting without new columns if it fails due to missing columns
                if (error.code === 'PGRST204' || error.message.includes('column')) {
                    const { error: fallbackError } = await supabase
                        .from('activity_logs')
                        .insert({
                            project_id: projectId,
                            user_id: userId,
                            action,
                            details,
                            status,
                            ip_address: ip,
                            created_at: new Date().toISOString()
                        });
                    if (fallbackError) throw fallbackError;
                } else {
                    throw error;
                }
            }

            const finalLog = insertedLog || { ...logEntry, id: crypto.randomUUID() };

            // 2. Check and enforce 1000 limit (FIFO)
            this.enforceLimit(projectId);

            // 3. Emit real-time event
            if (global.io) {
                // Emit to project room
                global.io.to(`project_${projectId}`).emit('activity_new', finalLog);

                // Also emit to user room for global view
                this.emitRealTimeUpdate(projectId, finalLog);
            }

            return true;
        } catch (error) {
            console.error('Error logging activity:', error.message);
            return false;
        }
    }

    /**
     * Enforce the 1000 log limit for a project
     */
    static async enforceLimit(projectId) {
        try {
            // Get count
            const { count, error } = await supabase
                .from('activity_logs')
                .select('*', { count: 'exact', head: true })
                .eq('project_id', projectId);

            if (error) throw error;

            if (count > 1000) {
                const logsToDelete = count - 1000;

                // Find the IDs to delete (oldest)
                const { data: oldLogs } = await supabase
                    .from('activity_logs')
                    .select('id')
                    .eq('project_id', projectId)
                    .order('created_at', { ascending: true })
                    .limit(logsToDelete);

                if (oldLogs && oldLogs.length > 0) {
                    const idsToDelete = oldLogs.map(l => l.id);
                    await supabase
                        .from('activity_logs')
                        .delete()
                        .in('id', idsToDelete);
                }
            }
        } catch (error) {
            console.error('Error enforcing log limit:', error.message);
        }
    }

    static async emitRealTimeUpdate(projectId, logData) {
        try {
            // Get project owner
            const { data: project } = await supabase
                .from('projects')
                .select('user_id, name')
                .eq('id', projectId)
                .single();

            if (project && global.io) {
                // Emit to user's private room (for global dashboard)
                global.io.to(`user_${project.user_id}`).emit('activity_new', {
                    ...logData,
                    id: crypto.randomUUID(),
                    project: { name: project.name }
                });
            }
        } catch (error) {
            console.error('Error emitting real-time update:', error);
        }
    }

    /**
     * Get logs for a project or all projects for a user
     */
    static async getLogs(projectId, userId, { page = 1, limit = 20, search = '', type = 'all', days = '30d' }) {
        try {
            // 1. Calculate 30-day window (Strictly enforced)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const thirtyDaysAgoStr = thirtyDaysAgo.toISOString();

            // 2. Build query
            let query = supabase
                .from('activity_logs')
                .select('*', { count: 'exact' })
                .gte('created_at', thirtyDaysAgoStr) // Enforce 30-day window
                .order('created_at', { ascending: false });

            if (projectId) {
                query = query.eq('project_id', projectId);
            } else if (userId) {
                // Fetch logs for all projects owned by the user
                const { data: projects } = await supabase
                    .from('projects')
                    .select('id')
                    .eq('user_id', userId);

                if (projects && projects.length > 0) {
                    const projectIds = projects.map(p => p.id);
                    query = query.in('project_id', projectIds);
                } else {
                    return { logs: [], total: 0, page, totalPages: 0 };
                }
            }

            // Apply filters
            if (search) {
                query = query.or(`action.ilike.%${search}%,details.ilike.%${search}%`);
            }

            if (type && type !== 'all') {
                if (['success', 'warning', 'failure'].includes(type.toLowerCase())) {
                    query = query.eq('status', type.toLowerCase());
                }
            }

            if (days && days !== 'all' && days !== '30d') {
                const now = new Date();
                let pastDate;
                if (days === '24h') pastDate = new Date(now - 24 * 60 * 60 * 1000);
                else if (days === '7d') pastDate = new Date(now - 7 * 24 * 60 * 60 * 1000);

                if (pastDate) {
                    query = query.gte('created_at', pastDate.toISOString());
                }
            }

            // Pagination
            const from = (page - 1) * limit;
            const to = from + limit - 1;
            query = query.range(from, to);

            const { data, count, error } = await query;

            if (error) throw error;

            // Manually fetch project names
            if (data && data.length > 0) {
                const projectIds = [...new Set(data.map(l => l.project_id))];
                const { data: projects } = await supabase
                    .from('projects')
                    .select('id, name')
                    .in('id', projectIds);

                if (projects) {
                    const projectMap = {};
                    projects.forEach(p => projectMap[p.id] = p.name);

                    data.forEach(log => {
                        log.project = { name: projectMap[log.project_id] || 'Unknown' };
                    });
                }
            }

            return {
                logs: data,
                total: count,
                page,
                totalPages: Math.ceil(count / limit)
            };
        } catch (error) {
            console.error('Error fetching activity logs:', error.message);
            throw error;
        }
    }

    /**
     * Manually delete logs older than 30 days
     * Fallback for systems without pg_cron
     */
    static async cleanup() {
        try {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const { error, count } = await supabase
                .from('activity_logs')
                .delete()
                .lt('created_at', thirtyDaysAgo.toISOString());

            if (error) throw error;
            console.log(`[Cleanup] Deleted ${count || 0} old activity logs`);
            return true;
        } catch (error) {
            console.error('Error cleaning up activity logs:', error.message);
            return false;
        }
    }
}

module.exports = ActivityLogService;
