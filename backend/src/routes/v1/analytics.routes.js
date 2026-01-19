const express = require('express');
const router = express.Router();
const projectController = require('../../controllers/project.controller');
const visitorController = require('../../controllers/visitor.controller');
const auth = require('../../middleware/auth');

router.use(auth);

// Global Analytics
router.get('/overview', visitorController.getDashboardStats);

// Project Analytics
router.get('/projects/:id/overview', projectController.getProjectStats);
router.get('/projects/:id/traffic', visitorController.getProjectDetailedStats);
router.get('/projects/:id/pages', projectController.getProjectPages);
router.get('/projects/:id/activity', projectController.getProjectActivity);

module.exports = router;
