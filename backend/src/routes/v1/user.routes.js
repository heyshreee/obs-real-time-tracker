const express = require('express');
const router = express.Router();
const userController = require('../../controllers/user.controller');
const authenticate = require('../../middleware/auth');
const upload = require('../../middleware/upload');

const linkedAccountsController = require('../../controllers/linked-accounts.controller');

router.use(authenticate);

router.put('/profile', userController.updateProfile);
router.put('/avatar', upload.single('avatar'), userController.updateAvatar);
router.put('/password', userController.updatePassword);
router.get('/sessions', userController.getSessions);
router.delete('/sessions/:sessionId', userController.revokeSession);
router.put('/notifications', userController.updateNotificationPreferences);

// Linked Accounts Routes
router.get('/linked-accounts', linkedAccountsController.getLinkedAccounts);
router.post('/linked-accounts/whatsapp', linkedAccountsController.linkWhatsApp);
router.post('/linked-accounts/telegram', linkedAccountsController.linkTelegram);
router.delete('/linked-accounts/:platform', linkedAccountsController.unlinkAccount);

module.exports = router;
