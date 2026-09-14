const { createSignupRequestService, verifySignupOtpService, resendSignupOtpService } = require('./signup.service');
const { sendSuccess, sendError, handleControllerError } = require('../../utils/response.utils');

const createSignupRequest = async (req, res) => {
    try {
        const result = await createSignupRequestService(req.body);
        return sendSuccess(res, 'Verification code sent to your email', result, 201);
    } catch (error) {
        return handleControllerError(res, error);
    }
};

const verifySignupOtp = async (req, res) => {
    try {
        const { uuid, otp } = req.body;
        if (!uuid || !otp) {
            return sendError(res, 'School and verification code are required', 400);
        }

        const { accessToken, refreshToken, user } = await verifySignupOtpService(uuid, otp);

        // Same cookie shape as auth.controller.js's login — the caller ends up
        // logged in immediately after verifying, no separate login step.
        const isProd = process.env.NODE_ENV === 'production';
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? 'none' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        return sendSuccess(res, 'Email verified', { accessToken, user });
    } catch (error) {
        return handleControllerError(res, error);
    }
};

const resendSignupOtp = async (req, res) => {
    try {
        const { uuid } = req.body;
        if (!uuid) {
            return sendError(res, 'School is required', 400);
        }

        const result = await resendSignupOtpService(uuid);
        return sendSuccess(res, result.message);
    } catch (error) {
        return handleControllerError(res, error);
    }
};

module.exports = { createSignupRequest, verifySignupOtp, resendSignupOtp };
