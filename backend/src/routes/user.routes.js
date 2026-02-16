const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const linkedAccountsController = require('../controllers/linked-accounts.controller');
const auth = require('../middleware/auth');

router.get('/usage', auth, userController.getUsageStats);

// Linked Accounts Routes
router.get('/linked-accounts', auth, linkedAccountsController.getLinkedAccounts);
router.post('/linked-accounts/telegram', auth, linkedAccountsController.linkTelegram);
router.delete('/linked-accounts/:platform', auth, linkedAccountsController.unlinkAccount);

module.exports = router;
