const express = require('express');
const authController = require('../controller/authController');
const { validateLogin, validateSignup } = require('../validators/loginValidator');
const { authMiddleware } = require('../middleware/auth');
const { adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/login', validateLogin, authController.login);
router.post('/signup', validateSignup, authController.signup);
router.post('/google-login', authController.googleLogin);
router.post('/admin/register', validateSignup, authController.adminRegister);
router.post('/admin/login', validateLogin, authController.adminLogin);
router.get('/admin/users', authMiddleware, adminMiddleware, authController.getAllUsers);
router.delete('/admin/users/:id', authMiddleware, adminMiddleware, authController.deleteUser);
router.put('/admin/profile', authMiddleware, adminMiddleware, authController.updateAdminProfile);

// Protected routes
router.get('/me', authMiddleware, authController.getCurrentUser);
router.post('/logout', authMiddleware, authController.logout);

module.exports = router;
