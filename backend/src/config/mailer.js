const nodemailer = require('nodemailer');

// ── Gmail SMTP ────────────────────────────────────────
// Requires a Gmail App Password (Google Account → Security → 2-Step
// Verification → App Passwords), not the regular account password.
//
// Explicit host/port/587 (STARTTLS) instead of nodemailer's `service: 'gmail'`
// shorthand (which resolves to port 465/implicit TLS) — in production this
// intermittently failed with "Connection timeout" from Render's network on
// 465, while 587 (Google's standard submission port) is far more universally
// reliable across hosting providers' outbound network paths.
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 15000,
});

// One retry on a transient failure (connection timeout, temporary DNS blip,
// etc.) — cheap to do since every caller already treats this as fire-and-forget,
// and it meaningfully improves delivery odds against flaky outbound networking
// without making any caller wait longer for the common (first-try-succeeds) case.
const sendMail = async ({ to, subject, html }) => {
    const mail = { from: `"Web Builder Pro" <${process.env.GMAIL_USER}>`, to, subject, html };
    try {
        await transporter.sendMail(mail);
    } catch (err) {
        console.error('First mail attempt failed, retrying once:', err.message);
        await transporter.sendMail(mail);
    }
};

module.exports = { sendMail };
