const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const { pool } = require("../../config/db");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../../utils/jwt.utils");
const AppError = require("../../utils/error.utils");
const { sendMail } = require("../../config/mailer");

// ── Issue Session ─────────────────────────────────────
// Generates access+refresh tokens for a user and persists the refresh token.
// Shared by loginService and signup.service.js's verifySignupOtpService (which
// auto-logs an admin in right after OTP verification instead of a password
// check) — one source of truth for what "issuing a session" means. Does not
// update last_login; callers do that separately since not every caller wants to.
const issueSession = async (userId, role, schoolId) => {
  const payload = { id: parseInt(userId), role };
  if (role === "admin") payload.schoolId = parseInt(schoolId);

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await pool.query(
    `INSERT INTO tbl_refresh_tokens
        (token, admin_id, super_admin_id, expires_at)
        VALUES (?, ?, ?, ?)`,
    [
      refreshToken,
      role === "admin" ? userId : null,
      role === "super_admin" ? userId : null,
      expiresAt,
    ],
  );

  return { accessToken, refreshToken };
};

const loginService = async (email, password, role) => {
  // Step 1 — Find user by email
  let user;
  let table = role === "super_admin" ? "tbl_super_admins" : "tbl_admins";

  let [rows] = await pool.query(
    role === 'super_admin'
        ? `SELECT id, uuid, name, email, password, is_active, last_login, created_at, updated_at FROM tbl_super_admins WHERE email = ?`
        : `SELECT id, uuid, school_id, name, email, password, phone, profile_photo, status, last_login, created_at, updated_at FROM tbl_admins WHERE email = ?`,
    [email]
  );

  // Fallback: If not found, check the other table automatically!
  if (rows.length === 0) {
    const otherQuery = role === 'super_admin'
        ? `SELECT id, uuid, school_id, name, email, password, phone, profile_photo, status, last_login, created_at, updated_at FROM tbl_admins WHERE email = ?`
        : `SELECT id, uuid, name, email, password, is_active, last_login, created_at, updated_at FROM tbl_super_admins WHERE email = ?`;
    const [fallbackRows] = await pool.query(otherQuery, [email]);
    if (fallbackRows.length > 0) {
      rows = fallbackRows;
      role = role === 'super_admin' ? 'admin' : 'super_admin';
    }
  }

  if (rows.length === 0) {
    throw new AppError("Invalid email or password", 401);
  }

  user = rows[0];

  // Step 2 — Check the password
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new AppError("Invalid email or password", 401);
  }

  // Step 3 — For admin, check the school
  if (role === "admin") {
    if (user.status === "suspended") {
      throw new AppError("Your account has been suspended", 403);
    }

    // Check whether the school is also active
    const [schoolRows] = await pool.query(
      `SELECT status FROM tbl_schools WHERE id = ?`,
      [user.school_id],
    );

    if (schoolRows[0].status === "suspended") {
      throw new AppError("Your school account has been suspended", 403);
    }

    if (schoolRows[0].status === "pending") {
      throw new AppError("Please verify your email to activate your account", 403);
    }
  }

  // Step 4/5 — Generate tokens and save the refresh token
  const { accessToken, refreshToken } = await issueSession(user.id, role, user.school_id);

  // Step 6 — Update last login
  await pool.query(`UPDATE ${table} SET last_login = NOW() WHERE id = ?`, [
    user.id,
  ]);

  // Step 7 — Return safe user data (not the password)
  const { password: _, ...safeUser } = user;

  return { accessToken, refreshToken, user: safeUser };
};

const logoutService = async (refreshToken) => {
  if (!refreshToken) {
    throw new AppError("No token provided", 400);
  }

  await pool.query(
    `UPDATE tbl_refresh_tokens SET is_revoked = 1 WHERE token = ?`,
    [refreshToken],
  );
};

const refreshTokenService = async (refreshToken) => {
  if (!refreshToken) {
    throw new AppError("No refresh token provided", 401);
  }

  // Check in the database
  const [rows] = await pool.query(
    `SELECT * FROM tbl_refresh_tokens
        WHERE token = ? AND is_revoked = 0 AND expires_at > NOW()`,
    [refreshToken],
  );

  if (rows.length === 0) {
    throw new AppError("Invalid or expired refresh token", 401);
  }

  const tokenData = rows[0];

  // Determine the role and id
  const role = tokenData.super_admin_id ? "super_admin" : "admin";
  const userId = tokenData.super_admin_id || tokenData.admin_id;

  // Generate a new access token
  const payload = {
    id: parseInt(userId),
    role,
  };

  if (role === "admin") {
    // tokenData.admin_id is the admin's own row id, not their school — look up
    // the real school_id rather than reusing admin_id (a prior bug did this,
    // scoping every request after a silent refresh to the wrong school/no
    // school at all whenever admin_id and school_id happened to differ).
    const [adminRows] = await pool.query(
      `SELECT school_id FROM tbl_admins WHERE id = ?`,
      [tokenData.admin_id],
    );
    if (adminRows.length === 0) {
      throw new AppError("Admin account not found", 401);
    }
    payload.schoolId = parseInt(adminRows[0].school_id);
  }

  const newAccessToken = generateAccessToken(payload);

  return { accessToken: newAccessToken };
};

// ── Forgot Password ──────────────────────────────────
// Always resolves successfully regardless of whether the email exists, so a
// caller can't use this endpoint to enumerate registered admin/super-admin
// emails — the "no such email" case just silently skips sending anything.
const forgotPasswordService = async (email, role) => {
  const table = role === "super_admin" ? "tbl_super_admins" : "tbl_admins";
  const [rows] = await pool.query(
    `SELECT id, name, email FROM ${table} WHERE email = ?`,
    [email],
  );

  if (rows.length === 0) return;

  const user = rows[0];
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

  await pool.query(
    `INSERT INTO tbl_password_resets (role, admin_id, super_admin_id, token_hash, expires_at)
        VALUES (?, ?, ?, ?, ?)`,
    [
      role,
      role === "admin" ? user.id : null,
      role === "super_admin" ? user.id : null,
      tokenHash,
      expiresAt,
    ],
  );

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${rawToken}&role=${role}`;

  if (process.env.NODE_ENV !== "production") {
    console.log("🔗 [dev only] Password reset link:", resetUrl);
  }

  // Fire-and-forget, same reasoning as signup.service.js and superAdmin.service.js's
  // approveSchoolService: Gmail SMTP can take a long time to connect/time out, and the
  // forgot-password response must not block on (or fail because of) that delay.
  sendMail({
    to: user.email,
    subject: "Reset your Web Builder Pro password",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #20242C;">
        <h2 style="color: #4169E1;">Reset your password</h2>
        <p>Hi ${user.name || ""},</p>
        <p>We received a request to reset your Web Builder Pro password. This link is valid for 30 minutes.</p>
        <p style="margin: 28px 0;">
          <a href="${resetUrl}" style="background: #4169E1; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
            Reset Password
          </a>
        </p>
        <p>If you didn't request this, you can safely ignore this email — your password will stay unchanged.</p>
        <p style="color: #9aa3b8; font-size: 12px; margin-top: 32px;">Web Builder Pro</p>
      </div>
    `,
  }).catch((err) => console.error("Failed to send password reset email:", err.message));
};

// ── Reset Password ───────────────────────────────────
const resetPasswordService = async (token, role, newPassword) => {
  if (!token || !role || !newPassword) {
    throw new AppError("Token, role and new password are required", 400);
  }
  if (newPassword.length < 8) {
    throw new AppError("Password must be at least 8 characters", 400);
  }

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const [rows] = await pool.query(
    `SELECT * FROM tbl_password_resets
        WHERE token_hash = ? AND role = ? AND used_at IS NULL AND expires_at > NOW()`,
    [tokenHash, role],
  );

  if (rows.length === 0) {
    throw new AppError("This reset link is invalid or has expired", 400);
  }

  const resetRow = rows[0];
  const table = role === "super_admin" ? "tbl_super_admins" : "tbl_admins";
  const userId = role === "super_admin" ? resetRow.super_admin_id : resetRow.admin_id;

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await pool.query(`UPDATE ${table} SET password = ? WHERE id = ?`, [
    hashedPassword,
    userId,
  ]);

  await pool.query(
    `UPDATE tbl_password_resets SET used_at = NOW() WHERE id = ?`,
    [resetRow.id],
  );

  // Log the user out of every existing session — a leaked/guessed old
  // session shouldn't survive a password reset.
  await pool.query(
    role === "super_admin"
      ? `UPDATE tbl_refresh_tokens SET is_revoked = 1 WHERE super_admin_id = ?`
      : `UPDATE tbl_refresh_tokens SET is_revoked = 1 WHERE admin_id = ?`,
    [userId],
  );
};

// ── Change Password (logged-in admin/super-admin, from within the panel) ──
// Different from resetPasswordService: this requires knowing the current password
// (no email link/token involved) so it can be used any time, not just via "forgot password".
// `currentRefreshToken` (the caller's own cookie) is kept alive on revoke so changing your
// password doesn't immediately log out the tab you just changed it from — every *other*
// session/device still gets revoked, same safety net as an email-link reset.
const changePasswordService = async (userId, role, currentPassword, newPassword, currentRefreshToken) => {
  if (!currentPassword || !newPassword) {
    throw new AppError("Current password and new password are required", 400);
  }
  if (newPassword.length < 6) {
    throw new AppError("New password must be at least 6 characters", 400);
  }

  const table = role === "super_admin" ? "tbl_super_admins" : "tbl_admins";
  const [rows] = await pool.query(`SELECT password FROM ${table} WHERE id = ?`, [userId]);
  if (rows.length === 0) {
    throw new AppError("Account not found", 404);
  }

  const isCurrentValid = await bcrypt.compare(currentPassword, rows[0].password);
  if (!isCurrentValid) {
    throw new AppError("Current password is incorrect", 401);
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await pool.query(`UPDATE ${table} SET password = ? WHERE id = ?`, [hashedPassword, userId]);

  await pool.query(
    role === "super_admin"
      ? `UPDATE tbl_refresh_tokens SET is_revoked = 1 WHERE super_admin_id = ? AND token != ?`
      : `UPDATE tbl_refresh_tokens SET is_revoked = 1 WHERE admin_id = ? AND token != ?`,
    [userId, currentRefreshToken || ""],
  );
};

// ── Google OAuth Services ────────────────────────────

const getGoogleAuthUrlService = (role = "admin", returnUrl = "") => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new AppError("Google OAuth is not configured on this server", 500);
  }

  const redirectUri = process.env.GOOGLE_CALLBACK_URL || `${process.env.FRONTEND_URL}/api/auth/google/callback`;

  const statePayload = Buffer.from(
    JSON.stringify({
      role: role || "admin",
      returnUrl: returnUrl || "",
      nonce: crypto.randomBytes(12).toString("hex"),
    })
  ).toString("base64url");

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "select_account",
    state: statePayload,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
};

const handleGoogleCallbackService = async (code, state) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_CALLBACK_URL || `${process.env.FRONTEND_URL}/api/auth/google/callback`;

  if (!clientId || !clientSecret) {
    throw new AppError("Google OAuth is not properly configured on this server", 500);
  }

  // Parse state
  let parsedState = { role: "admin" };
  if (state) {
    try {
      parsedState = JSON.parse(Buffer.from(state, "base64url").toString("utf-8"));
    } catch {
      // Fallback
    }
  }

  // 1. Exchange authorization code for tokens
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  const tokenData = await tokenResponse.json();
  if (!tokenResponse.ok || !tokenData.access_token) {
    console.error("Google token exchange error:", tokenData);
    throw new AppError(tokenData.error_description || "Failed to exchange code with Google", 400);
  }

  // 2. Fetch user profile
  const userProfileResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });

  const profile = await userProfileResponse.json();
  if (!userProfileResponse.ok || !profile.email) {
    console.error("Google profile fetch error:", profile);
    throw new AppError("Failed to retrieve user profile from Google", 400);
  }

  const email = profile.email.toLowerCase().trim();
  const name = profile.name || profile.given_name || email.split("@")[0];
  const picture = profile.picture || null;
  const googleId = profile.sub;

  // 3. Super Admin accounts must strictly log in with email and password
  const [superAdmins] = await pool.query(
    `SELECT id FROM tbl_super_admins WHERE email = ?`,
    [email]
  );

  if (superAdmins.length > 0) {
    throw new AppError("Google login is not available for Super Admin accounts. Please sign in with your email and password.", 403);
  }

  // 4. Check for existing school admin
  const [admins] = await pool.query(
    `SELECT a.id, a.uuid, a.school_id, a.name, a.email, a.phone, a.profile_photo, a.google_id, a.status,
            s.name as school_name, s.slug as school_slug, s.status as school_status
     FROM tbl_admins a
     JOIN tbl_schools s ON a.school_id = s.id
     WHERE a.email = ? OR (a.google_id IS NOT NULL AND a.google_id = ?)`,
    [email, googleId]
  );

  if (admins.length > 0) {
    const admin = admins[0];

    if (admin.status === "suspended") {
      throw new AppError("Your account has been suspended", 403);
    }

    if (admin.school_status === "suspended") {
      throw new AppError("Your school account has been suspended", 403);
    }

    // If previously pending verification, Google verified it!
    if (admin.school_status === "pending") {
      await pool.query(`UPDATE tbl_schools SET status = 'active' WHERE id = ?`, [admin.school_id]);
    }

    // Link google_id or update avatar if missing
    await pool.query(
      `UPDATE tbl_admins SET google_id = COALESCE(google_id, ?), profile_photo = COALESCE(profile_photo, ?) WHERE id = ?`,
      [googleId, picture, admin.id]
    );

    const { accessToken, refreshToken } = await issueSession(admin.id, "admin", admin.school_id);
    await pool.query(`UPDATE tbl_admins SET last_login = NOW() WHERE id = ?`, [admin.id]);

    return {
      type: "login",
      role: "admin",
      accessToken,
      refreshToken,
      user: {
        id: admin.id,
        uuid: admin.uuid,
        school_id: admin.school_id,
        name: admin.name,
        email: admin.email,
        phone: admin.phone,
        profile_photo: picture || admin.profile_photo,
        status: "active",
        school_name: admin.school_name,
        school_slug: admin.school_slug,
        role: "admin",
      },
    };
  }

  // 5. User not found in either table -> New School Signup Required
  // Sign a short-lived token (15 mins) that encodes verified Google details
  const googleSignupToken = jwt.sign(
    {
      email,
      name,
      picture,
      googleId,
      purpose: "google_signup",
    },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: "15m" }
  );

  return {
    type: "signup_required",
    googleSignupToken,
    email,
    name,
    picture,
  };
};

const completeGoogleSignupService = async ({ googleSignupToken, schoolName, phone }) => {
  if (!googleSignupToken) {
    throw new AppError("Google registration token is required", 400);
  }

  let decoded;
  try {
    decoded = jwt.verify(googleSignupToken, process.env.JWT_ACCESS_SECRET);
  } catch {
    throw new AppError("Your Google registration session has expired. Please try again.", 400);
  }

  if (decoded.purpose !== "google_signup" || !decoded.email || !decoded.googleId) {
    throw new AppError("Invalid registration session", 400);
  }

  const { email, name, picture, googleId } = decoded;

  if (!schoolName || schoolName.trim().length < 2) {
    throw new AppError("School name must be at least 2 characters", 400);
  }

  if (phone && !/^\d{10}$/.test(phone)) {
    throw new AppError("Phone number must be exactly 10 digits", 400);
  }

  // Check if school or admin with this email exists
  const [existingSchools] = await pool.query("SELECT id, status FROM tbl_schools WHERE email = ?", [email]);
  const [existingAdmins] = await pool.query("SELECT id FROM tbl_admins WHERE email = ?", [email]);

  if (existingAdmins.length > 0 || (existingSchools.length > 0 && existingSchools[0].status !== "pending")) {
    throw new AppError("An account with this email already exists. Please log in.", 409);
  }

  let schoolId;
  let schoolUuid;
  let slug;

  if (existingSchools.length > 0 && existingSchools[0].status === "pending") {
    // Re-use pending school
    schoolId = existingSchools[0].id;
    schoolUuid = existingSchools[0].uuid;
    await pool.query("UPDATE tbl_schools SET status = 'active', name = ? WHERE id = ?", [schoolName.trim(), schoolId]);
  } else {
    // Generate unique slug
    const slugBase = schoolName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-");

    slug = slugBase;
    let suffix = 1;
    while (true) {
      const [slugCheck] = await pool.query("SELECT id FROM tbl_schools WHERE slug = ?", [slug]);
      if (slugCheck.length === 0) break;
      suffix += 1;
      slug = `${slugBase}-${suffix}`;
    }

    schoolUuid = uuidv4();
    await pool.query(
      `INSERT INTO tbl_schools (uuid, name, slug, email, phone, status) VALUES (?, ?, ?, ?, ?, 'active')`,
      [schoolUuid, schoolName.trim(), slug, email, phone || null]
    );

    const [newSchool] = await pool.query("SELECT id FROM tbl_schools WHERE uuid = ?", [schoolUuid]);
    schoolId = newSchool[0].id;
  }

  // Create or update admin
  const adminUuid = uuidv4();
  const randomPass = crypto.randomBytes(32).toString("hex");
  const hashedPassword = await bcrypt.hash(randomPass, 10);

  await pool.query(
    `INSERT INTO tbl_admins (uuid, school_id, name, email, password, phone, profile_photo, google_id, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')
     ON DUPLICATE KEY UPDATE google_id = VALUES(google_id), profile_photo = VALUES(profile_photo), status = 'active'`,
    [adminUuid, schoolId, name.trim(), email, hashedPassword, phone || null, picture || null, googleId]
  );

  const [adminRows] = await pool.query("SELECT * FROM tbl_admins WHERE email = ?", [email]);
  const admin = adminRows[0];

  const { accessToken, refreshToken } = await issueSession(admin.id, "admin", schoolId);
  await pool.query("UPDATE tbl_admins SET last_login = NOW() WHERE id = ?", [admin.id]);

  return {
    accessToken,
    refreshToken,
    user: {
      id: admin.id,
      uuid: admin.uuid,
      school_id: schoolId,
      name: admin.name,
      email: admin.email,
      phone: admin.phone,
      profile_photo: admin.profile_photo,
      status: "active",
      school_name: schoolName.trim(),
      school_slug: slug,
      role: "admin",
    },
  };
};

module.exports = {
  issueSession,
  loginService,
  logoutService,
  refreshTokenService,
  forgotPasswordService,
  resetPasswordService,
  changePasswordService,
  getGoogleAuthUrlService,
  handleGoogleCallbackService,
  completeGoogleSignupService,
};

