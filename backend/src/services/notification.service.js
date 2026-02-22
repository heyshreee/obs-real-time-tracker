const supabase = require('../config/supabase');
const TelegramService = require('./telegram.service');

class NotificationService {
    /**
     * Create a new notification
     */
    static async create(userId, title, message, type = 'info') {
        try {
            const { data, error } = await supabase
                .from('notifications')
                .insert({
                    user_id: userId,
                    title,
                    message,
                    type,
                    is_read: false,
                    created_at: new Date().toISOString()
                })
                .select()
                .single();

            if (error) throw error;

            if (global.io) {
                global.io.to(`user_${userId}`).emit('new_notification', data);
            }

            // Dispatch to linked accounts asynchronously
            this.dispatchToLinkedAccounts(userId, title, message).catch(err =>
                console.error('Error dispatching to linked accounts:', err)
            );

            return data;
        } catch (error) {
            console.error('Error creating notification:', error.message);
            return null;
        }
    }

    /**
     * Get all notifications for a user
     */
    static async getAll(userId) {
        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching notifications:', error.message);
            throw error;
        }
    }

    /**
     * Mark a notification as read
     */
    static async markAsRead(id, userId) {
        try {
            const { data, error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', id)
                .eq('user_id', userId)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error marking notification as read:', error.message);
            throw error;
        }
    }

    /**
     * Mark all notifications as read for a user
     */
    static async markAllAsRead(userId) {
        try {
            const { data, error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('user_id', userId)
                .eq('is_read', false);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error marking all notifications as read:', error.message);
            throw error;
        }
    }

    /**
     * Delete a notification
     */
    static async delete(id, userId) {
        try {
            const { error } = await supabase
                .from('notifications')
                .delete()
                .eq('id', id)
                .eq('user_id', userId);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error deleting notification:', error.message);
            throw error;
        }
    }

    /**
     * Cleanup old notifications (older than 24 hours)
     */
    static async cleanup() {
        try {
            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

            const { error } = await supabase
                .from('notifications')
                .delete()
                .lt('created_at', twentyFourHoursAgo);

            if (error) throw error;
            console.log('Cleaned up old notifications');
            return true;
        } catch (error) {
            console.error('Error cleaning up notifications:', error.message);
            return false;
        }
    }

    /**
     * Dispatch notification to linked external accounts
     */
    static async dispatchToLinkedAccounts(userId, title, message) {
        try {
            // Fetch user's linked accounts
            const { data: user, error } = await supabase
                .from('users')
                .select('linked_accounts')
                .eq('id', userId)
                .single();

            if (error || !user || !user.linked_accounts) return;

            const { telegram } = user.linked_accounts;
            const fullMessage = `*${title}*\n${message}`;

            // Send to Telegram
            if (telegram && telegram.chat_id) {
                await TelegramService.send(telegram.chat_id, fullMessage);
            }

        } catch (error) {
            console.error('Error in dispatchToLinkedAccounts:', error.message);
        }
    }
}

module.exports = NotificationService;
