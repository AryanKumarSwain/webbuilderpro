const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
require('dotenv').config();

const routes = require('./src/routes/index.routes');
const { pool } = require('./src/config/db');
const AppError = require('./src/utils/error.utils');

const app = express();

// Render/Vercel sit in front of this app as a reverse proxy — without this,
// express-rate-limit can't see the real client IP (everyone shares one
// bucket) and throws on the X-Forwarded-For header it can't validate.
app.set('trust proxy', 1);

app.use(helmet({
    // Cross-Origin-Resource-Policy defaults to same-origin, which would block
    // the frontend (different origin) from loading images/files this API serves.
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// ── CORS ──────────────────────────────────────────────
// Origins allowed without a DB lookup: the platform's own hosts (mirrors
// isPlatformHost() in frontend/src/App.jsx). Anything else is checked
// against tbl_schools.custom_domain, since schools can connect their own
// domain and must be able to call the API with credentials from it too.
const staticAllowedOrigins = new Set([process.env.FRONTEND_URL].filter(Boolean));

const isStaticAllowedHost = (hostname) =>
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.endsWith('.vercel.app') ||
    hostname === 'wbpro.in' ||
    hostname === 'www.wbpro.in';

// Custom-domain lookups are cached briefly so CORS doesn't hit the DB on
// every single request from a school's connected domain.
const customDomainCache = new Map(); // hostname -> { allowed, expiresAt }
const CUSTOM_DOMAIN_CACHE_MS = 5 * 60 * 1000;

const isAllowedCustomDomain = async (hostname) => {
    const cached = customDomainCache.get(hostname);
    if (cached && cached.expiresAt > Date.now()) return cached.allowed;

    const [rows] = await pool.query(
        `SELECT id FROM tbl_schools WHERE custom_domain = ? AND status = 'active' LIMIT 1`,
        [hostname]
    );
    const allowed = rows.length > 0;
    customDomainCache.set(hostname, { allowed, expiresAt: Date.now() + CUSTOM_DOMAIN_CACHE_MS });
    return allowed;
};

app.use(cors({
    origin: async (origin, callback) => {
        // No Origin header = non-browser request (curl, server health check) — allow.
        if (!origin) return callback(null, true);
        if (staticAllowedOrigins.has(origin)) return callback(null, true);

        let hostname;
        try {
            hostname = new URL(origin).hostname;
        } catch {
            return callback(new Error('Not allowed by CORS'));
        }

        if (isStaticAllowedHost(hostname)) return callback(null, true);

        try {
            if (await isAllowedCustomDomain(hostname)) return callback(null, true);
        } catch (err) {
            console.error('CORS custom-domain lookup failed:', err.message);
        }

        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true
}));

app.use(express.json({
    limit: '50mb',
    // Stash the raw request bytes so the Razorpay webhook (billing/) can verify
    // its HMAC signature against exactly what was received — express.json()
    // otherwise consumes the stream and only the parsed object survives.
    verify: (req, res, buf) => { req.rawBody = buf; },
}));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// ── Test Route ───────────────────────────────────────
app.get('/', (req, res) => {
    res.json({ 
        success: true, 
        message: 'School SaaS API is running 🚀' 
    });
});

// ── All Routes ───────────────────────────────────────
app.use('/api', routes);

// ── 404 Handler ──────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ 
        success: false, 
        message: 'Route not found' 
    });
});

// ── Global Error Handler ─────────────────────────────
// Fallback only — every controller catches its own errors and responds via
// handleControllerError with error.statusCode (see response.utils.js). This
// only fires for errors thrown outside a controller's try/catch (e.g.
// middleware). Same instanceof AppError check as handleControllerError, so an
// unexpected error can't leak a raw DB/stack message here either.
app.use((err, req, res, next) => {
    console.error('ERROR DETAILS:', err);
    console.error('ERROR MESSAGE:', err?.message);
    console.error('ERROR STACK:', err?.stack);
    const message = err instanceof AppError
        ? err.message
        : 'Something went wrong. Please try again.';
    res.status(err.statusCode || err.status || 500).json({
        success: false,
        message
    });
});
module.exports = app;