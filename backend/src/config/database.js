const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '',
  database: process.env.DB_NAME || 'edutrack_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Helper to execute query with parameters
const query = async (sql, params) => {
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    // Avoid exposing raw database error parameters to users
    console.error('Database query error:', error.message);
    throw error;
  }
};

// Helper for transactions
const getTransaction = async () => {
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  return {
    connection,
    commit: async () => {
      await connection.commit();
      connection.release();
    },
    rollback: async () => {
      await connection.rollback();
      connection.release();
    },
    execute: async (sql, params) => {
      const [results] = await connection.execute(sql, params);
      return results;
    }
  };
};

module.exports = {
  pool,
  query,
  getTransaction
};
