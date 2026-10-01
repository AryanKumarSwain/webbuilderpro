const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// ── SSL (Aiven requires SSL) ─────────────────────────────────────────
// DB_SSL_CA_PATH points at the downloaded ca.pem (backend/ca.pem, committed
// so Render can see it too — see .gitignore note). This is opt-in: local
// XAMPP MySQL doesn't support SSL, so SSL is only attempted when the env var
// is explicitly set (Render's env sets DB_SSL_CA_PATH=ca.pem; local .env
// leaves it unset). Checking file-existence alone isn't enough to decide
// this, since ca.pem is committed and thus always present on disk.
const caPath = process.env.DB_SSL_CA_PATH
    ? path.resolve(__dirname, '../../', process.env.DB_SSL_CA_PATH)
    : null;
const sslConfig = caPath && fs.existsSync(caPath)
    ? { ca: fs.readFileSync(caPath, 'utf8') }
    : undefined;

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ...(sslConfig && { ssl: sslConfig }),
});

const ensureSchema = async () => {
    try {
        const [cols] = await pool.query(`SHOW COLUMNS FROM tbl_module_content LIKE 'draft_content'`);
        if (cols.length === 0) {
            console.log('Migrating tbl_module_content: adding draft_content column...');
            await pool.query(`ALTER TABLE tbl_module_content ADD COLUMN draft_content LONGTEXT NULL AFTER content`);
            console.log('✅ Added draft_content column to tbl_module_content');
        }
    } catch (e) {
        console.warn('ensureSchema check warning:', e.message);
    }
};

const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Database connected successfully');
        connection.release();
        await ensureSchema();
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        process.exit(1);
    }
};

module.exports = { pool, testConnection };