const express = require('express');
const router = express.Router();
const userController = require('../../controllers/user.controller');
const authenticate = require('../../middleware/auth');
const upload = require('../../middleware/upload');

router.use(authenticate);

router.put('/profile', userController.updateProfile);
router.put('/avatar', upload.single('avatar'), userController.updateAvatar);
router.put('/password', userController.updatePassword);
router.get('/sessions', userController.getSessions);
router.delete('/sessions/:sessionId', userController.revokeSession);
router.put('/notifications', userController.updateNotificationPreferences);

module.exports = router;
