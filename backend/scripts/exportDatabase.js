const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const exportAll = async () => {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT,
        ssl: { rejectUnauthorized: false }
    });

    console.log('Connected to source database...');

    let sqlOutput = `-- ========================================================\n`;
    sqlOutput += `-- Full Database Dump for VPS MySQL Setup\n`;
    sqlOutput += `-- Target DB: db_school_saas\n`;
    sqlOutput += `-- Generated: ${new Date().toISOString()}\n`;
    sqlOutput += `-- ========================================================\n\n`;
    sqlOutput += `CREATE DATABASE IF NOT EXISTS \`db_school_saas\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\n`;
    sqlOutput += `USE \`db_school_saas\`;\n\n`;
    sqlOutput += `SET FOREIGN_KEY_CHECKS = 0;\n\n`;

    const [tables] = await conn.query('SHOW TABLES');
    const tableNames = tables.map(t => Object.values(t)[0]);

    for (const tableName of tableNames) {
        console.log(`Exporting schema for ${tableName}...`);
        sqlOutput += `-- --------------------------------------------------------\n`;
        sqlOutput += `-- Table structure for \`${tableName}\`\n`;
        sqlOutput += `-- --------------------------------------------------------\n`;
        sqlOutput += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;

        const [createResult] = await conn.query(`SHOW CREATE TABLE \`${tableName}\``);
        const createTableSql = createResult[0]['Create Table'];
        sqlOutput += `${createTableSql};\n\n`;

        // Export data
        const [rows] = await conn.query(`SELECT * FROM \`${tableName}\``);
        if (rows.length > 0) {
            console.log(`Exporting ${rows.length} rows for ${tableName}...`);
            sqlOutput += `-- Dumping data for \`${tableName}\`\n`;
            for (const row of rows) {
                const cols = Object.keys(row).map(c => `\`${c}\``).join(', ');
                const vals = Object.values(row).map(val => {
                    if (val === null) return 'NULL';
                    if (typeof val === 'number') return val;
                    if (val instanceof Date) {
                        return `'${val.toISOString().slice(0, 19).replace('T', ' ')}'`;
                    }
                    if (typeof val === 'object') {
                        return mysql.escape(JSON.stringify(val));
                    }
                    return mysql.escape(val);
                }).join(', ');

                sqlOutput += `INSERT INTO \`${tableName}\` (${cols}) VALUES (${vals});\n`;
            }
            sqlOutput += `\n`;
        }
    }

    sqlOutput += `SET FOREIGN_KEY_CHECKS = 1;\n`;

    const outputPath = path.resolve(__dirname, '../../database/vps_full_db_dump.sql');
    fs.writeFileSync(outputPath, sqlOutput, 'utf8');
    console.log(`Successfully exported full database dump to: ${outputPath}`);

    await conn.end();
};

exportAll().catch(err => {
    console.error('Export failed:', err);
    process.exit(1);
});
