const supabase = require('../config/supabase');
const bcrypt = require('bcryptjs');
const usageService = require('../services/usage.service');
const ActivityLogService = require('../services/activity.service');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

exports.getUsageStats = async (req, res) => {
    try {
        const userId = req.user.id;
        const usage = await usageService.calculateUsage(userId);
        res.json(usage);
    } catch (error) {
        console.error('Get usage stats error:', error);
        res.status(500).json({ error: 'Failed to fetch usage stats' });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, bio, timezone, language, job_title } = req.body;

        const updates = {};
        if (name !== undefined) updates.name = name;
        if (bio !== undefined) updates.bio = bio;
        if (timezone !== undefined) updates.timezone = timezone;
        if (language !== undefined) updates.language = language;
        if (job_title !== undefined) updates.job_title = job_title;

        const { data, error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', userId)
            .select()
            .single();

        if (error) throw error;

        await ActivityLogService.log(
            null,
            userId,
            'user.profile_update',
            'Updated profile details',
            'info',
            req.ip
        );

        res.json({ success: true, user: data });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
};

exports.updateAvatar = async (req, res) => {
    try {
        const userId = req.user.id;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Upload to Cloudinary
        const b64 = Buffer.from(file.buffer).toString('base64');
        let dataURI = "data:" + file.mimetype + ";base64," + b64;

        const result = await cloudinary.uploader.upload(dataURI, {
            folder: 'obs-tracker/avatars',
            public_id: `user_${userId}`,
            overwrite: true,
            transformation: [{ width: 400, height: 400, crop: 'fill' }]
        });

        // Update Supabase
        const { data, error } = await supabase
            .from('users')
            .update({ avatar_url: result.secure_url })
            .eq('id', userId)
            .select()
            .single();

        if (error) throw error;

        await ActivityLogService.log(
            null,
            userId,
            'user.avatar_update',
            'Updated profile picture',
            'info',
            req.ip
        );

        res.json({ success: true, avatar_url: result.secure_url });
    } catch (error) {
        console.error('Update avatar error:', error);
        res.status(500).json({ error: 'Failed to update avatar' });
    }
};

exports.updatePassword = async (req, res) => {
    try {
        const userId = req.user.id;
        const { currentPassword, newPassword } = req.body;

        // Verify current password
        const { data: user } = await supabase
            .from('users')
            .select('password_hash')
            .eq('id', userId)
            .single();

        if (!user || !user.password_hash) {
            return res.status(400).json({ error: 'User not found or no password set' });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ error: 'Incorrect current password' });
        }

        // Hash new password
        const passwordHash = await bcrypt.hash(newPassword, 10);

        const { error } = await supabase
            .from('users')
            .update({ password_hash: passwordHash })
            .eq('id', userId);

        if (error) throw error;

        await ActivityLogService.log(
            null,
            userId,
            'user.password_change',
            'Changed password',
            'warning',
            req.ip
        );

        res.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        console.error('Update password error:', error);
        res.status(500).json({ error: 'Failed to update password' });
    }
};

exports.getSessions = async (req, res) => {
    try {
        // Mock sessions for now as we don't track them in DB yet
        // In a real app, we would query a sessions table
        const sessions = [
            {
                id: 'current',
                device: req.headers['user-agent'],
                ip: req.ip,
                lastActive: new Date(),
                isCurrent: true,
                location: 'Unknown'
            }
        ];
        res.json(sessions);
    } catch (error) {
        console.error('Get sessions error:', error);
        res.status(500).json({ error: 'Failed to fetch sessions' });
    }
};

exports.revokeSession = async (req, res) => {
    try {
        // Mock revocation
        const { sessionId } = req.params;
        res.json({ success: true, message: 'Session revoked' });
    } catch (error) {
        console.error('Revoke session error:', error);
        res.status(500).json({ error: 'Failed to revoke session' });
    }
};

exports.updateNotificationPreferences = async (req, res) => {
    try {
        const userId = req.user.id;
        const { preferences } = req.body;

        const { data, error } = await supabase
            .from('users')
            .update({ notification_preferences: preferences })
            .eq('id', userId)
            .select()
            .single();

        if (error) throw error;

        res.json({ success: true, preferences: data.notification_preferences });
    } catch (error) {
        console.error('Update notification preferences error:', error);
        res.status(500).json({ error: 'Failed to update preferences' });
    }
};
