const express = require('express');
const router = express.Router();
const { createSignupRequest, verifySignupOtp, resendSignupOtp } = require('./signup.controller');
const { signupLimiter, otpLimiter } = require('../../middlewares/rateLimit.middleware');

// ── Public — no auth ─────────────────────────────────
router.post('/', signupLimiter, createSignupRequest);
router.post('/verify-otp', otpLimiter, verifySignupOtp);
router.post('/resend-otp', otpLimiter, resendSignupOtp);

module.exports = router;
