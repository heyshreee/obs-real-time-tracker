const express = require('express');
const router = express.Router();
const visitorController = require('../controllers/visitor.controller');
const rateLimiter = require('../middleware/rateLimiter');
const auth = require('../middleware/auth');

// Public endpoint for tracking (no auth required)
router.post('/track', rateLimiter, visitorController.trackVisitor);

// Protected endpoints
router.get('/live', auth, visitorController.getLiveVisitors);
router.get('/dashboard-stats', auth, visitorController.getDashboardStats);

module.exports = router;
