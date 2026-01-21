const NotificationService = require('../services/notification.service');

exports.getNotifications = async (req, res) => {
    try {
        const notifications = await NotificationService.getAll(req.user.id);
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const notification = await NotificationService.markAsRead(id, req.user.id);
        res.json(notification);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.markAllAsRead = async (req, res) => {
    try {
        await NotificationService.markAllAsRead(req.user.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        await NotificationService.delete(id, req.user.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
