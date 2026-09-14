-- Backs the email-OTP signup verification flow (replaces the old Super Admin
-- Approve/Reject step — a school now goes 'pending' -> 'active' by verifying
-- a 6-digit code instead of a human review). One row per issued code; the
-- code itself is never stored raw (SHA-256 hashed), single-use (used_at), and
-- short-lived (expires_at, set to now + 10 minutes by the backend).
-- `attempts` guards against brute-forcing a 6-digit code (only 1,000,000
-- possibilities) — the service locks a row out after ~5 wrong guesses and
-- requires a resend instead.
-- Apply by hand against any other environment (no migration runner in this project).
--
-- expires_at has an explicit DEFAULT below (never actually relied on — the app
-- always supplies a real value on INSERT) specifically to defeat a MariaDB/MySQL
-- legacy quirk: a bare `TIMESTAMP NOT NULL` column with no explicit default is
-- silently given BOTH an implicit `DEFAULT CURRENT_TIMESTAMP` and an implicit
-- `ON UPDATE CURRENT_TIMESTAMP` if it's the first such column in the table. The
-- latter would silently reset expires_at to "now" on every UPDATE to the row —
-- including the `attempts` increment on a wrong guess — instantly expiring a
-- code after the very first wrong attempt instead of honoring the real 10-minute
-- window. Verified this exact quirk already exists on tbl_password_resets too
-- (harmless there only because that row goes single-use before any other UPDATE
-- touches it); not fixing that one here since it's out of scope for this table.

CREATE TABLE IF NOT EXISTS tbl_signup_otps (
  id INT NOT NULL AUTO_INCREMENT,
  school_id INT NOT NULL,
  otp_hash CHAR(64) NOT NULL,
  expires_at TIMESTAMP NOT NULL DEFAULT '2000-01-01 00:00:00',
  used_at TIMESTAMP NULL DEFAULT NULL,
  attempts INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY school_id (school_id),
  CONSTRAINT tbl_signup_otps_school_fk FOREIGN KEY (school_id) REFERENCES tbl_schools (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
