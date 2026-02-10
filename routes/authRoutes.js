const express = require('express');
const authController = require('../controller/authController');
const { validateLogin, validateSignup } = require('../validators/loginValidator');
const { authMiddleware } = require('../middleware/auth');
const { adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/login', validateLogin, authController.login);
router.post('/signup', validateSignup, authController.signup);
router.post('/admin/register', validateSignup, authController.adminRegister);
router.post('/admin/login', validateLogin, authController.adminLogin);
router.get('/admin/users', authMiddleware, adminMiddleware, authController.getAllUsers);

// Protected routes
router.get('/me', authMiddleware, authController.getCurrentUser);
router.post('/logout', authMiddleware, authController.logout);

module.exports = router;
