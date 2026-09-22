const express = require('express');
const router = express.Router();
const {
    login,
    logout,
    refreshToken,
    forgotPassword,
    resetPassword,
    changePassword,
    googleAuth,
    googleCallback,
    completeGoogleSignup,
} = require('./auth.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { authLimiter } = require('../../middlewares/rateLimit.middleware');

// Google OAuth
router.get('/google', googleAuth);
router.get('/google/callback', googleCallback);
router.post('/google/complete-signup', authLimiter, completeGoogleSignup);

router.post('/login', authLimiter, login);
router.post('/logout', protect, logout);
router.post('/refresh', refreshToken);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);
// Logged-in self-service change — works for both admin and super_admin (protect alone,
// no isAdmin/isSuperAdmin gate, since either role should be able to change their own password).
router.post('/change-password', protect, authLimiter, changePassword);

module.exports = router;