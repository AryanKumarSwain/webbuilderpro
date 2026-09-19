require('dotenv').config();
const { pool } = require('../src/config/db.js');

async function main() {
  console.log('Ensuring all tables...');
  
  await pool.query(`CREATE TABLE IF NOT EXISTS tbl_plans (
    id INT NOT NULL AUTO_INCREMENT,
    uuid VARCHAR(36) NOT NULL,
    tenure_years TINYINT NOT NULL,
    storage_mb INT NOT NULL,
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uuid (uuid),
    UNIQUE KEY tenure_storage (tenure_years, storage_mb)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);

  await pool.query(`CREATE TABLE IF NOT EXISTS tbl_payments (
    id INT NOT NULL AUTO_INCREMENT,
    uuid VARCHAR(36) NOT NULL,
    school_id INT NOT NULL,
    plan_id INT NOT NULL,
    order_id VARCHAR(64) NOT NULL,
    payment_id VARCHAR(64) DEFAULT NULL,
    amount_paise INT NOT NULL,
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

  await pool.query(`CREATE TABLE IF NOT EXISTS tbl_media_usage (
    id INT NOT NULL AUTO_INCREMENT,
    uuid VARCHAR(36) NOT NULL,
    school_id INT NOT NULL,
    media_type ENUM('image','pdf','video') NOT NULL,
    bytes BIGINT NOT NULL,
    cloudinary_public_id VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uuid (uuid),
    KEY school_id (school_id),
    CONSTRAINT tbl_media_usage_school_fk FOREIGN KEY (school_id) REFERENCES tbl_schools (id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);

  // Populate default plans if empty
  const [existingPlans] = await pool.query('SELECT COUNT(*) as count FROM tbl_plans');
  if (existingPlans[0].count === 0) {
    await pool.query(`INSERT INTO tbl_plans (uuid, tenure_years, storage_mb, price) VALUES
      (UUID(), 1, 200, 4999.00),
      (UUID(), 1, 400, 7999.00),
      (UUID(), 1, 1024, 12999.00),
      (UUID(), 2, 200, 8999.00),
      (UUID(), 2, 400, 14999.00),
      (UUID(), 2, 1024, 23999.00)`);
    console.log('Inserted default plans');
  }

  const [tables] = await pool.query('SHOW TABLES');
  console.log('Current DB tables:', tables.map(r => Object.values(r)[0]));

  await pool.end();
}

main().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
