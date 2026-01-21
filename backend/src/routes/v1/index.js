const express = require('express');
const router = express.Router();
const csrf = require('../../middleware/csrf');

// Import sub-routers
const authRoutes = require('./auth.routes');
const projectRoutes = require('./projects.routes');
const analyticsRoutes = require('./analytics.routes');
const trackRoutes = require('./track.routes');
const usageRoutes = require('./usage.routes');

// Apply CSRF protection to all non-GET v1 routes, except public tracking
router.use((req, res, next) => {
    if (req.path.startsWith('/track')) {
        return next();
    }
    csrf(req, res, next);
});

// Mount sub-routers
router.use('/auth', authRoutes);
router.use('/projects', projectRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/track', trackRoutes);
router.use('/usage', usageRoutes);

router.use('/notifications', require('./notification.routes'));

module.exports = router;
