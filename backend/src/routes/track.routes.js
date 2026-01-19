const express = require('express');
const router = express.Router();
const visitorController = require('../controllers/visitor.controller');
const rateLimiter = require('../middleware/rateLimiter');

const trackingCors = require('../middleware/trackingCors');

// Apply CORS middleware to all tracking routes
router.use('/:trackingId', trackingCors);

// Public tracking endpoint (POST /api/track/:trackingId)
router.post('/:trackingId', rateLimiter, visitorController.trackVisitorPublic);

// Public stats endpoint (GET /api/track/:trackingId)
router.get('/:trackingId', visitorController.getVisitorCountPublic);

module.exports = router;
