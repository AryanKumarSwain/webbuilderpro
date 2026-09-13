const app = require('./app');
const { testConnection } = require('./src/config/db');
require('dotenv').config();

const PORT = process.env.PORT || 5000;

// ── Required Env Vars ────────────────────────────────
// Fails loudly at boot instead of letting a missing var misbehave silently
// later — e.g. a missing JWT_ACCESS_EXPIRY doesn't error, it just makes
// jsonwebtoken issue tokens with no expiry at all. Mirrors how testConnection()
// below already exits on a bad DB config; this is the same idea for env vars.
const REQUIRED_ENV_VARS = [
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET',
    'JWT_ACCESS_EXPIRY',
    'JWT_REFRESH_EXPIRY',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
    'FRONTEND_URL',
    'NODE_ENV',
];

const assertRequiredEnv = () => {
    const missing = REQUIRED_ENV_VARS.filter((name) => !process.env[name]);
    if (missing.length > 0) {
        console.error('❌ Missing required environment variable(s):');
        missing.forEach((name) => console.error(`   - ${name}`));
        process.exit(1);
    }
};

// ── Process-Level Crash Handlers ─────────────────────
// Last-resort safety net — every route/controller already catches its own
// errors, but this covers anything that ever slips through (a future
// regression, a truly detached promise) so the process fails loudly and
// restarts cleanly on Render instead of continuing in a corrupted state.
process.on('unhandledRejection', (reason) => {
    console.error('❌ Unhandled promise rejection:', reason);
    process.exit(1);
});

process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught exception:', error);
    process.exit(1);
});

const startServer = async () => {
    try {
        assertRequiredEnv();
        await testConnection();

        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📍 http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('❌ Server failed to start:', error.message);
        process.exit(1);
    }
};

startServer();