const express = require('express');
const { register, login, logout, getMe } = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// @desc    Register user
// @route   POST /auth/register
// @access  Public
router.post('/register', register);

// @desc    Login user
// @route   POST /auth/login
// @access  Public
router.post('/login', login);

// @desc    Logout user
// @route   POST /auth/logout
// @access  Private
router.post('/logout', authMiddleware, logout);

// @desc    Get current logged in user
// @route   GET /auth/me
// @access  Private
router.get('/me', authMiddleware, getMe);

module.exports = router;