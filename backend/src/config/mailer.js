const nodemailer = require('nodemailer');
const dns = require('dns').promises;

const SMTP_HOST = 'smtp.gmail.com';
const SMTP_PORT = 587;

// ── Gmail SMTP ────────────────────────────────────────
// Requires a Gmail App Password (Google Account → Security → 2-Step
// Verification → App Passwords), not the regular account password.
//
// We resolve the IPv4 address ourselves and connect to it directly instead of
// letting nodemailer resolve `host`. Its DNS resolution (lib/shared/index.js
// #resolveHostname) fetches BOTH the A and AAAA records for a hostname and
// picks ONE AT RANDOM from the combined list — there is no option (a `family`
// setting on the transporter is simply never read by its connection code) to
// force IPv4-only. On Render, whose network has no IPv6 route, every send that
// randomly picked the IPv6 address failed instantly with ENETUNREACH — roughly
// every other attempt. Connecting straight to a resolved IPv4 address removes
// that coin flip; `servername` is set explicitly so TLS certificate validation
// still checks against the real hostname rather than the raw IP.
const buildTransporter = async () => {
    const addresses = await dns.resolve4(SMTP_HOST);
    const host = addresses[Math.floor(Math.random() * addresses.length)];
    return nodemailer.createTransport({
        host,
        port: SMTP_PORT,
        secure: false,
        servername: SMTP_HOST,
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD,
        },
        connectionTimeout: 15000,
        greetingTimeout: 15000,
        socketTimeout: 15000,
    });
};

const sendOnce = async (mail) => {
    const transporter = await buildTransporter();
    await transporter.sendMail(mail);
};

// One retry on a transient failure (connection timeout, a bad IP out of the
// resolved pool, etc.) — cheap to do since every caller already treats this as
// fire-and-forget, and re-resolving on the retry also gives it a fresh chance
// at a different IPv4 address from the pool.
const sendMail = async ({ to, subject, html }) => {
    const mail = { from: `"Web Builder Pro" <${process.env.GMAIL_USER}>`, to, subject, html };
    try {
        await sendOnce(mail);
    } catch (err) {
        console.error('First mail attempt failed, retrying once:', err.message);
        await sendOnce(mail);
    }
};

module.exports = { sendMail };
