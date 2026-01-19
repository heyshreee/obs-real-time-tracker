const express = require('express');
const router = express.Router();
const authController = require('../../controllers/auth.controller');
const auth = require('../../middleware/auth');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', auth, authController.logout);
router.get('/me', auth, authController.getMe);

module.exports = router;
