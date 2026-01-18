const express = require('express');
const router = express.Router();
const projectController = require('../controllers/project.controller');
const visitorController = require('../controllers/visitor.controller');
const auth = require('../middleware/auth');

router.use(auth); // Protect all project routes

router.post('/', projectController.createProject);
router.get('/', projectController.getProjects);
router.get('/:id', projectController.getProject);
router.put('/:id', projectController.updateProject);
router.delete('/:id', projectController.deleteProject);
router.get('/:id/stats', projectController.getProjectStats);
router.get('/:id/detailed-stats', visitorController.getProjectDetailedStats);
router.put('/:id/pin', projectController.togglePin);

module.exports = router;
