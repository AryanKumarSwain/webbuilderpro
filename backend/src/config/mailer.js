const RESEND_API_URL = 'https://api.resend.com/emails';
const FROM_ADDRESS = 'Web Builder Pro <noreply@wbpro.in>';

// ── Resend (HTTP email API) ──────────────────────────
// Switched from Gmail SMTP after production (Render) consistently failed to
// complete outbound SMTP connections (timeouts on both IPv4 and IPv6 — see
// git history on this file) — most hosting PaaS providers block or throttle
// raw SMTP (ports 25/465/587) egress to prevent spam abuse. Resend is a plain
// HTTPS API call, which isn't subject to that class of restriction.
//
// Requires RESEND_API_KEY, and the wbpro.in domain verified in the Resend
// dashboard (DNS records) — without a verified domain, Resend only allows
// sending to the account owner's own address, not arbitrary recipients like
// a new school's signup email.
const sendOnce = async ({ to, subject, html }) => {
    const res = await fetch(RESEND_API_URL, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from: FROM_ADDRESS, to, subject, html }),
    });
    if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`Resend API ${res.status}: ${body}`);
    }
};

// One retry on a transient failure — cheap since every caller already treats
// this as fire-and-forget.
const sendMail = async ({ to, subject, html }) => {
    try {
        await sendOnce({ to, subject, html });
    } catch (err) {
        console.error('First mail attempt failed, retrying once:', err.message);
        await sendOnce({ to, subject, html });
    }
};

module.exports = { sendMail };
