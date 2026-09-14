-- Backs the mediated wbpro.in subdomain provisioning flow: a school admin
-- requests a subdomain label (e.g. "mcs" -> mcs.wbpro.in) right after paying
-- via Razorpay, or later from Settings. A Super Admin does the manual GoDaddy
-- CNAME + Vercel domain work outside the app, then marks the request
-- fulfilled (writing the final domain into tbl_schools.custom_domain, which
-- the existing custom-domain routing/CORS mechanism already resolves — see
-- school.service.js#getSchoolByDomain and app.js's CORS check) or rejected.
--
-- One school can have multiple historical rows (e.g. rejected, then a fresh
-- pending request) — always treat the latest row (highest id) as current.
-- Apply by hand against any other environment (no migration runner in this project).

CREATE TABLE IF NOT EXISTS tbl_subdomain_requests (
  id INT NOT NULL AUTO_INCREMENT,
  school_id INT NOT NULL,
  requested_label VARCHAR(63) NOT NULL,
  status ENUM('pending','fulfilled','rejected') NOT NULL DEFAULT 'pending',
  fulfilled_by INT NULL,
  fulfilled_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY school_id (school_id),
  CONSTRAINT tbl_subdomain_requests_school_fk FOREIGN KEY (school_id) REFERENCES tbl_schools (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
