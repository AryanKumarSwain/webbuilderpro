const AppError = require("./error.utils");

const sendSuccess = (res, message, data = null, statusCode = 200) => {
    const response = {
        success: true,
        message,
    };

    if (data !== null) {
        response.data = data;
    }

    return res.status(statusCode).json(response);
};

const sendError = (res, message, statusCode = 500, errors = null) => {
    const response = {
        success: false,
        message,
    };

    if (errors !== null) {
        response.errors = errors;
    }

    return res.status(statusCode).json(response);
};

// ── Handle Controller Error ──────────────────────────
// Every controller catch block should call this instead of passing
// error.message straight to sendError. An AppError's message was written to be
// shown to the client (e.g. "Invalid email or password") — anything else is an
// unexpected internal error (a raw DB/driver error, a TypeError, an SDK error)
// whose message can leak schema/table names or other implementation details, so
// the client only ever gets a generic message for those. The full error is
// always logged server-side either way.
const handleControllerError = (res, error) => {
    console.error(error);
    const message = error instanceof AppError
        ? error.message
        : 'Something went wrong. Please try again.';
    return sendError(res, message, error.statusCode || 500);
};

module.exports = { sendSuccess, sendError, handleControllerError };