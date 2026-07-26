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

async function initDb() {
  console.log('Connecting to MySQL Server to initialize database...');
  let connection;
  try {
    connection = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
      multipleStatements: true // Allow executing file scripts directly
    });
    
    console.log('[SUCCESS] Connected.');

    // 1. Read schema.sql
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    console.log(`Reading schema from ${schemaPath}...`);
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    // 2. Execute schema.sql
    console.log('Executing schema.sql queries...');
    await connection.query(schemaSql);
    console.log('[SUCCESS] Database tables created.');

    // 3. Read seed.sql
    const seedPath = path.join(__dirname, '../database/seed.sql');
    console.log(`Reading seed data from ${seedPath}...`);
    const seedSql = fs.readFileSync(seedPath, 'utf8');

    // 4. Execute seed.sql
    console.log('Executing seed.sql queries...');
    await connection.query(seedSql);
    console.log('[SUCCESS] Seed data inserted successfully.');

    await connection.end();
    console.log('Database initialization completed.');
  } catch (error) {
    console.error('[ERROR] Database initialization failed:');
    console.error(error.stack || error.message);
    if (connection) {
      try { await connection.end(); } catch (e) {}
    }
    process.exit(1);
  }
}

initDb();
