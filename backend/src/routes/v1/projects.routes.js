const express = require('express');
const router = express.Router();
const projectController = require('../../controllers/project.controller');
const trackingCors = require('../../middleware/trackingCors');
const auth = require('../../middleware/auth');

router.use(auth);
router.use(trackingCors);

router.post('/', projectController.createProject);
router.get('/', projectController.getProjects);
router.get('/:id', projectController.getProject);
router.put('/:id', projectController.updateProject);
router.delete('/:id', projectController.deleteProject);
router.put('/:id/pin', projectController.togglePin);

module.exports = router;
