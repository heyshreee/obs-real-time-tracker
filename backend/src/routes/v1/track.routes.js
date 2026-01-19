const express = require('express');
const router = express.Router();
const visitorController = require('../../controllers/visitor.controller');
const rateLimiter = require('../../middleware/rateLimiter');
const trackingCors = require('../../middleware/trackingCors');

// Public tracking endpoints - apply CORS to all methods including OPTIONS
router.use('/:trackingId', trackingCors);
router.post('/:trackingId', rateLimiter, visitorController.trackVisitorPublic);
router.get('/:trackingId', visitorController.getVisitorCountPublic);

module.exports = router;
