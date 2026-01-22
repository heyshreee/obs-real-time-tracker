const express = require('express');
const router = express.Router();
const activityController = require('../../controllers/activity.controller');
const requireAuth = require('../../middleware/auth');

router.get('/:projectId', requireAuth, activityController.getProjectLogs);
router.get('/', requireAuth, activityController.getProjectLogs);

module.exports = router;
