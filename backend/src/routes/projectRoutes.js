const express = require('express');
const {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
} = require('../controllers/projectController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// @desc    Create new project
// @route   POST /projects
// @access  Private
router.post('/', createProject);

// @desc    Get all projects for authenticated user
// @route   GET /projects
// @access  Private
router.get('/', getProjects);

// @desc    Get single project
// @route   GET /projects/:id
// @access  Private
router.get('/:id', getProject);

// @desc    Update project
// @route   PUT /projects/:id
// @access  Private
router.put('/:id', updateProject);

// @desc    Delete project
// @route   DELETE /projects/:id
// @access  Private
router.delete('/:id', deleteProject);

module.exports = router;