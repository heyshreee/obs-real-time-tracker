const express = require('express');
const router = express.Router();
const notificationController = require('../../controllers/notification.controller');
const auth = require('../../middleware/auth');

router.use(auth);

router.get('/', notificationController.getNotifications);
router.put('/:id/read', notificationController.markAsRead);
router.put('/read-all', notificationController.markAllAsRead);
router.delete('/:id', notificationController.deleteNotification);

module.exports = router;
