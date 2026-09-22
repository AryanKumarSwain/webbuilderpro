const {
    loginService,
    logoutService,
    refreshTokenService,
    forgotPasswordService,
    resetPasswordService,
    changePasswordService,
    getGoogleAuthUrlService,
    handleGoogleCallbackService,
    completeGoogleSignupService,
} = require('./auth.service');
const { sendSuccess, sendError, handleControllerError } = require('../../utils/response.utils');

const login = async (req, res) => {
    try {
        const { email, password, role } = req.body;

        // Validation
        if (!email || !password || !role) {
            return sendError(res, 'Email, password and role are required', 400);
        }

        if (!['super_admin', 'admin'].includes(role)) {
            return sendError(res, 'Invalid role', 400);
        }

        const { accessToken, refreshToken, user } = await loginService(email, password, role);

        // Refresh token cookie 
        // sameSite must be 'none' (with secure:true) in production because the deployed
        // frontend and backend live on different domains — 'strict'/'lax' cookies get
        // silently dropped on cross-site requests, breaking the refresh flow.
        const isProd = process.env.NODE_ENV === 'production';
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? 'none' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
        });

        return sendSuccess(res, 'Login successful', {
            accessToken,
            user
        });

    } catch (error) {
        return handleControllerError(res, error);
    }
};

const logout = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;

        await logoutService(refreshToken);

        // Clear the cookie
        const isProd = process.env.NODE_ENV === 'production';
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? 'none' : 'lax',
        });

        return sendSuccess(res, 'Logout successful');

    } catch (error) {
        return handleControllerError(res, error);
    }
};

const refreshToken = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;

        const { accessToken } = await refreshTokenService(refreshToken);

        return sendSuccess(res, 'Token refreshed', { accessToken });

    } catch (error) {
        return handleControllerError(res, error);
    }
};

const forgotPassword = async (req, res) => {
    try {
        const { email, role } = req.body;

        if (!email || !role) {
            return sendError(res, 'Email and role are required', 400);
        }
        if (!['super_admin', 'admin'].includes(role)) {
            return sendError(res, 'Invalid role', 400);
        }

        await forgotPasswordService(email, role);

        // Always the same response, whether or not the email exists.
        return sendSuccess(res, 'If that email is registered, a reset link has been sent.');

    } catch (error) {
        return handleControllerError(res, error);
    }
};

const resetPassword = async (req, res) => {
    try {
        const { token, role, newPassword } = req.body;

        await resetPasswordService(token, role, newPassword);

        return sendSuccess(res, 'Password reset successful. You can now log in.');

    } catch (error) {
        return handleControllerError(res, error);
    }
};

const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return sendError(res, 'Current password and new password are required', 400);
        }

        await changePasswordService(req.user.id, req.user.role, currentPassword, newPassword, req.cookies.refreshToken);

        return sendSuccess(res, 'Password changed successfully');

    } catch (error) {
        return handleControllerError(res, error);
    }
};

// ── Google OAuth Controllers ──────────────────────────

const googleAuth = async (req, res) => {
    try {
        const { role, returnUrl } = req.query;
        const redirectUrl = getGoogleAuthUrlService(role, returnUrl);
        return res.redirect(redirectUrl);
    } catch (error) {
        return handleControllerError(res, error);
    }
};

const googleCallback = async (req, res) => {
    const frontendUrl = process.env.FRONTEND_URL || 'https://www.wbpro.in';
    try {
        const { code, state, error, error_description } = req.query;

        if (error) {
            console.warn('Google OAuth returned error:', error, error_description);
            return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(error_description || error)}`);
        }

        if (!code) {
            return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent('No authorization code provided by Google')}`);
        }

        const result = await handleGoogleCallbackService(code, state);

        if (result.type === 'login') {
            const isProd = process.env.NODE_ENV === 'production';
            res.cookie('refreshToken', result.refreshToken, {
                httpOnly: true,
                secure: isProd,
                sameSite: isProd ? 'none' : 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000
            });

            const userEncoded = encodeURIComponent(JSON.stringify(result.user));
            return res.redirect(
                `${frontendUrl}/auth/callback?token=${result.accessToken}&role=${result.role}&user=${userEncoded}`
            );
        } else if (result.type === 'signup_required') {
            return res.redirect(
                `${frontendUrl}/signup?google_signup_token=${result.googleSignupToken}&email=${encodeURIComponent(result.email)}&name=${encodeURIComponent(result.name || '')}&picture=${encodeURIComponent(result.picture || '')}`
            );
        }

        return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent('Unexpected authentication state')}`);

    } catch (error) {
        console.error('Google Callback Error:', error);
        const message = error?.message || 'Google authentication failed';
        return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(message)}`);
    }
};

const completeGoogleSignup = async (req, res) => {
    try {
        const { googleSignupToken, schoolName, phone } = req.body;

        if (!googleSignupToken || !schoolName) {
            return sendError(res, 'Google registration token and school name are required', 400);
        }

        const { accessToken, refreshToken, user } = await completeGoogleSignupService({
            googleSignupToken,
            schoolName,
            phone
        });

        const isProd = process.env.NODE_ENV === 'production';
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? 'none' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return sendSuccess(res, 'School created and logged in successfully', {
            accessToken,
            user
        });

    } catch (error) {
        return handleControllerError(res, error);
    }
};

module.exports = {
    login,
    logout,
    refreshToken,
    forgotPassword,
    resetPassword,
    changePassword,
    googleAuth,
    googleCallback,
    completeGoogleSignup,
};