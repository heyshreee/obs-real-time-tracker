const express = require('express');
const router = express.Router();
const planController = require('../controllers/plan.controller');

// Public route to get all plans
router.get('/', planController.getPlans);

module.exports = router;
