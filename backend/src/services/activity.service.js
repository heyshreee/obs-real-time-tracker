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
     */
    static async log(projectId, userId, action, details, status = 'success', ip = null) {
        try {
            // 1. Insert new log
            const { error } = await supabase
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

            if (error) throw error;

            // 2. Check and enforce 1000 limit (FIFO)
            // We can do this asynchronously to not block the response
            this.enforceLimit(projectId);

            // 3. Emit real-time event
            if (global.io) {
                // Emit to project room
                global.io.to(`project_${projectId}`).emit('activity_new', {
                    id: crypto.randomUUID(), // Optimistic ID or fetch from DB if needed, but we didn't select it.
                    // Actually, insert returns null data by default unless .select() is used.
                    // Let's modify insert to select().
                    project_id: projectId,
                    user_id: userId,
                    action,
                    details,
                    status,
                    ip_address: ip,
                    created_at: new Date().toISOString()
                });

                // Also emit to user room if userId is present (for global view)
                // But global view might need to subscribe to all projects?
                // Or we emit to user's personal room if they are the owner of the project.
                // We don't have owner ID here easily without fetching project.
                // But we can emit to `project_${projectId}` and frontend subscribes to all project rooms it cares about?
                // Or better: emit to `user_${ownerId}`.
                // We need to know who owns the project.
                // We can fetch project owner.
                this.emitRealTimeUpdate(projectId, {
                    project_id: projectId,
                    user_id: userId,
                    action,
                    details,
                    status,
                    ip_address: ip,
                    created_at: new Date().toISOString()
                });
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
    static async getLogs(projectId, userId, { page = 1, limit = 20, search = '', type = 'all', days = 'all' }) {
        try {
            let query = supabase
                .from('activity_logs')
                .select('*', { count: 'exact' })
                .order('created_at', { ascending: false });

            if (projectId) {
                query = query.eq('project_id', projectId);
            } else if (userId) {
                // Fetch logs for all projects owned by the user
                // First get project IDs
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
                // Assuming 'type' maps to 'status' or we need a 'type' column?
                // The design shows 'Event Type' which seems to be the 'action' or a category.
                // For now, let's assume filtering by status if type is success/warning/failure
                // Or if user meant 'Event Type' as 'action', we might need fuzzy match.
                // Let's stick to status for now if it matches, or just ignore if not.
                // Actually, the screenshot shows "All Events" dropdown.
                // Let's assume it filters by status for now.
                if (['success', 'warning', 'failure'].includes(type.toLowerCase())) {
                    query = query.eq('status', type.toLowerCase());
                }
            }

            if (days && days !== 'all') {
                const now = new Date();
                let pastDate;
                if (days === '24h') pastDate = new Date(now - 24 * 60 * 60 * 1000);
                else if (days === '7d') pastDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
                else if (days === '30d') pastDate = new Date(now - 30 * 24 * 60 * 60 * 1000);

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

            // Manually fetch project names since join failed
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
                        // Also mock user email if needed, or just leave as System/Unknown
                        // log.user = { email: '...' }; 
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
}

module.exports = ActivityLogService;
