const express = require('express');
const router = express.Router();
const visitorController = require('../controllers/visitor.controller');
const rateLimiter = require('../middleware/rateLimiter');

// Public tracking endpoint (POST /api/track/:trackingId)
router.post('/:trackingId', rateLimiter, visitorController.trackVisitorPublic);

// Public stats endpoint (GET /api/track/:trackingId)
router.get('/:trackingId', visitorController.getVisitorCountPublic);

module.exports = router;
