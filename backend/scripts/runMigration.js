const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'edutrack_db'
};

async function runMigration() {
  const migrationFile = process.argv[2];
  if (!migrationFile) {
    console.error('Please provide a migration file name (e.g. 004_add_password_reset_otps.sql)');
    process.exit(1);
  }

  console.log(`Connecting to MySQL to run migration ${migrationFile}...`);
  let connection;
  try {
    connection = await mysql.createConnection({
      ...dbConfig,
      multipleStatements: true
    });
    
    const migrationPath = path.join(__dirname, '../database/migrations', migrationFile);
    console.log(`Reading migration from ${migrationPath}...`);
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('Executing migration...');
    await connection.query(sql);
    console.log(`[SUCCESS] Migration ${migrationFile} executed successfully.`);

    await connection.end();
  } catch (error) {
    console.error('[ERROR] Migration failed:');
    console.error(error.stack || error.message);
    if (connection) {
      try { await connection.end(); } catch (e) {}
    }
    process.exit(1);
  }
}

runMigration();
