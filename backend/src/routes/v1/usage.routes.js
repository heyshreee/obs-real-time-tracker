const express = require('express');
const router = express.Router();
const userController = require('../../controllers/user.controller');
const trackingCors = require('../../middleware/trackingCors');
const auth = require('../../middleware/auth');

router.use(auth);
router.use(trackingCors);

router.get('/', userController.getUsageStats);

module.exports = router;
