const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'edutrack_db'
};

async function testConnection() {
  console.log('Attempting to connect with settings:');
  console.log(`Host: ${dbConfig.host}`);
  console.log(`Port: ${dbConfig.port}`);
  console.log(`User: ${dbConfig.user}`);
  console.log(`Database: ${dbConfig.database}`);
  console.log('Password: ' + (dbConfig.password ? '****' : '(none)'));

  try {
    const connection = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password
    });
    console.log('\n[SUCCESS] Connected to MySQL Server!');

    // Check if database exists
    const [dbCheck] = await connection.query(`SHOW DATABASES LIKE '${dbConfig.database}'`);
    if (dbCheck.length > 0) {
      console.log(`[SUCCESS] Database '${dbConfig.database}' exists!`);
      
      // Reconnect with database specified
      await connection.changeUser({ database: dbConfig.database });
      
      // Test querying users
      const [users] = await connection.query('SHOW TABLES');
      console.log('Tables found in database:');
      console.log(users.map(row => Object.values(row)[0]));
    } else {
      console.log(`[WARNING] Database '${dbConfig.database}' does not exist yet. Run schema.sql first.`);
    }

    await connection.end();
    console.log('Connection test completed successfully.');
  } catch (error) {
    console.error('\n[ERROR] Failed to connect to MySQL database:');
    console.error(error.message);
    process.exit(1);
  }
}

testConnection();
