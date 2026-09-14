const rateLimit = require('express-rate-limit');
const { sendError } = require('../utils/response.utils');

const handler = (req, res) => sendError(res, 'Too many requests. Please try again later.', 429);

// Login / forgot-password / reset-password — guards against credential
// stuffing and reset-link spam.
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
    handler,
});

// Public school signup — guards against fake school signups flooding the
// approval queue / signup-received emails.
const signupLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    handler,
});

// Public admission/career enquiry forms — guards against inbox spam.
const enquiryLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 15,
    standardHeaders: true,
    legacyHeaders: false,
    handler,
});

// Signup OTP verify/resend — stricter than the other limiters since a 6-digit
// code only has 1,000,000 combinations and must resist brute-forcing.
const otpLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    limit: 8,
    standardHeaders: true,
    legacyHeaders: false,
    handler,
});

module.exports = { authLimiter, signupLimiter, enquiryLimiter, otpLimiter };
