require('dotenv').config();
const { pool } = require('../src/config/db.js');
const { getRandomThemeKey } = require('../src/utils/theme.utils.js');

async function addColumnIfMissing(tableName, columnName, definition) {
  const [rows] = await pool.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [tableName, columnName]
  );
  if (rows.length === 0) {
    console.log(`Adding ${tableName}.${columnName}...`);
    await pool.query(`ALTER TABLE \`${tableName}\` ADD COLUMN ${definition}`);
  }
}

async function dropIndexIfExists(tableName, indexName) {
  const [rows] = await pool.query(
    `SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS 
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?`,
    [tableName, indexName]
  );
  if (rows.length > 0) {
    console.log(`Dropping index ${indexName} from ${tableName}...`);
    await pool.query(`ALTER TABLE \`${tableName}\` DROP INDEX \`${indexName}\``);
  }
}

async function main() {
  console.log('Ensuring all tables and columns...');

  // 1. Core tables
  await pool.query(`CREATE TABLE IF NOT EXISTS tbl_plans (
    id INT NOT NULL AUTO_INCREMENT,
    uuid VARCHAR(36) NOT NULL,
    name VARCHAR(100) NOT NULL DEFAULT '',
    tenure_years TINYINT NOT NULL,
    storage_mb INT NOT NULL,
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    description VARCHAR(500) NULL,
    features JSON NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uuid (uuid)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);

  // Fix tbl_payments if created with legacy/incorrect columns
  const [payCols] = await pool.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tbl_payments'`
  );
  const payColNames = payCols.map(c => c.COLUMN_NAME);
  if (payColNames.includes('order_id') && !payColNames.includes('razorpay_order_id')) {
    const [rows] = await pool.query('SELECT COUNT(*) as count FROM tbl_payments');
    if (rows[0].count === 0) {
      await pool.query('DROP TABLE tbl_payments');
    }
  }

  await pool.query(`CREATE TABLE IF NOT EXISTS tbl_payments (
    id INT NOT NULL AUTO_INCREMENT,
    uuid VARCHAR(36) NOT NULL,
    school_id INT NOT NULL,
    plan_id INT NOT NULL,
    razorpay_order_id VARCHAR(64) NOT NULL,
    razorpay_payment_id VARCHAR(64) DEFAULT NULL,
    razorpay_signature VARCHAR(255) DEFAULT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    status ENUM('created','paid','failed') NOT NULL DEFAULT 'created',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uuid (uuid),
    KEY school_id (school_id),
    KEY plan_id (plan_id),
    CONSTRAINT tbl_payments_school_fk FOREIGN KEY (school_id) REFERENCES tbl_schools (id) ON DELETE CASCADE,
    CONSTRAINT tbl_payments_plan_fk FOREIGN KEY (plan_id) REFERENCES tbl_plans (id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);

  // Fix tbl_media_usage if created with incorrect columns
  const [mediaCols] = await pool.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tbl_media_usage'`
  );
  const mediaColNames = mediaCols.map(c => c.COLUMN_NAME);
  if (mediaColNames.includes('bytes') && !mediaColNames.includes('file_size_bytes')) {
    const [rows] = await pool.query('SELECT COUNT(*) as count FROM tbl_media_usage');
    if (rows[0].count === 0) {
      await pool.query('DROP TABLE tbl_media_usage');
    }
  }

  await pool.query(`CREATE TABLE IF NOT EXISTS tbl_media_usage (
    id INT NOT NULL AUTO_INCREMENT,
    school_id INT NOT NULL,
    module_key VARCHAR(50) DEFAULT NULL,
    resource_type ENUM('image','pdf','video') NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    cloudinary_public_id VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY school_id (school_id),
    KEY module_key (module_key),
    CONSTRAINT tbl_media_usage_school_fk FOREIGN KEY (school_id) REFERENCES tbl_schools (id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);

  await pool.query(`CREATE TABLE IF NOT EXISTS tbl_signup_otps (
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
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);

  await pool.query(`CREATE TABLE IF NOT EXISTS tbl_subdomain_requests (
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
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);

  await pool.query(`CREATE TABLE IF NOT EXISTS tbl_password_resets (
    id INT NOT NULL AUTO_INCREMENT,
    role ENUM('admin','super_admin') NOT NULL,
    admin_id INT NULL,
    super_admin_id INT NULL,
    token_hash CHAR(64) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY token_hash (token_hash)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);

  // 2. Ensure columns on tbl_plans
  await addColumnIfMissing('tbl_plans', 'name', '`name` VARCHAR(100) NOT NULL DEFAULT \'\'');
  await addColumnIfMissing('tbl_plans', 'description', '`description` VARCHAR(500) NULL');
  await addColumnIfMissing('tbl_plans', 'features', '`features` JSON NULL');
  await addColumnIfMissing('tbl_plans', 'sort_order', '`sort_order` INT NOT NULL DEFAULT 0');
  await dropIndexIfExists('tbl_plans', 'tenure_storage');

  // Backfill names on seeded plans if empty
  await pool.query(`UPDATE tbl_plans SET name = CONCAT(
    tenure_years, '-Year · ',
    CASE WHEN storage_mb >= 1024 AND storage_mb MOD 1024 = 0
         THEN CONCAT(storage_mb DIV 1024, ' GB')
         ELSE CONCAT(storage_mb, ' MB') END
  ) WHERE name = '' OR name IS NULL`);

  // 3. Ensure columns on tbl_schools
  await addColumnIfMissing('tbl_schools', 'phone2', '`phone2` VARCHAR(20) NULL');
  await addColumnIfMissing('tbl_schools', 'whatsapp_number', '`whatsapp_number` VARCHAR(20) NULL');
  await addColumnIfMissing('tbl_schools', 'base_theme', '`base_theme` VARCHAR(20) DEFAULT \'white\'');
  await addColumnIfMissing('tbl_schools', 'plan_id', '`plan_id` INT NULL');
  await addColumnIfMissing('tbl_schools', 'plan_start_date', '`plan_start_date` DATE NULL');
  await addColumnIfMissing('tbl_schools', 'plan_end_date', '`plan_end_date` DATE NULL');
  await addColumnIfMissing('tbl_schools', 'storage_used_bytes', '`storage_used_bytes` BIGINT NOT NULL DEFAULT 0');
  await addColumnIfMissing('tbl_schools', 'terms_accepted_at', '`terms_accepted_at` DATETIME NULL');
  await addColumnIfMissing('tbl_schools', 'terms_version', '`terms_version` INT NULL');
  await addColumnIfMissing('tbl_schools', 'footer_bg_url', '`footer_bg_url` VARCHAR(500) NULL');
  await addColumnIfMissing('tbl_schools', 'bg_music_enabled', '`bg_music_enabled` TINYINT(1) NOT NULL DEFAULT 0');
  await addColumnIfMissing('tbl_schools', 'bg_music_track', '`bg_music_track` VARCHAR(50) NULL');
  await addColumnIfMissing('tbl_schools', 'affiliation_badges', '`affiliation_badges` JSON NULL');
  await addColumnIfMissing('tbl_schools', 'custom_domain', '`custom_domain` VARCHAR(255) NULL');
  await addColumnIfMissing('tbl_schools', 'prospectus_url', '`prospectus_url` VARCHAR(500) NULL');
  await addColumnIfMissing('tbl_schools', 'footer_about_text', '`footer_about_text` VARCHAR(500) NULL');
  await addColumnIfMissing('tbl_schools', 'school_app_label', '`school_app_label` VARCHAR(100) NULL');
  await addColumnIfMissing('tbl_schools', 'school_app_url', '`school_app_url` VARCHAR(500) NULL');
  await addColumnIfMissing('tbl_schools', 'intro_message_enabled', '`intro_message_enabled` TINYINT(1) NOT NULL DEFAULT 1');
  await addColumnIfMissing('tbl_schools', 'welcome_banner_enabled', '`welcome_banner_enabled` TINYINT(1) NOT NULL DEFAULT 0');
  await addColumnIfMissing('tbl_schools', 'welcome_banner_url', '`welcome_banner_url` VARCHAR(500) NULL');
  await addColumnIfMissing('tbl_schools', 'welcome_banner_link', '`welcome_banner_link` VARCHAR(500) NULL');

  // Make sure created_by is nullable
  await pool.query('ALTER TABLE `tbl_schools` MODIFY COLUMN `created_by` INT NULL DEFAULT NULL');

  // 4. Ensure google_id columns for Google OAuth
  await addColumnIfMissing('tbl_admins', 'google_id', '`google_id` VARCHAR(100) NULL UNIQUE');
  await addColumnIfMissing('tbl_super_admins', 'google_id', '`google_id` VARCHAR(100) NULL UNIQUE');

  // 5. Backfill schools with default/null theme to random theme
  const [defaultSchools] = await pool.query(
    "SELECT id FROM tbl_schools WHERE theme = 'default' OR theme IS NULL OR theme = ''"
  );
  for (const s of defaultSchools) {
    await pool.query('UPDATE tbl_schools SET theme = ? WHERE id = ?', [getRandomThemeKey(), s.id]);
  }
  if (defaultSchools.length > 0) {
    console.log(`Assigned random themes to ${defaultSchools.length} schools.`);
  }

  console.log('✅ All tables and columns synchronized successfully!');
  await pool.end();
}

main().then(() => process.exit(0)).catch(err => {
  console.error('Error synchronizing database schema:', err);
  process.exit(1);
});
