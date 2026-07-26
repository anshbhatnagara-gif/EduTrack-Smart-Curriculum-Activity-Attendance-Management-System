const mysql = require('mysql2/promise');
require('dotenv').config();

if (process.env.DB_PASSWORD === undefined) {
  throw new Error('Database configuration error: DB_PASSWORD environment variable is required.');
}

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
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
    const [results] = await pool.query(sql, params);
    return results;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Database query error:', error.message);
    } else {
      console.error('Database query execution error.');
    }
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
      try {
        const [results] = await connection.query(sql, params);
        return results;
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Database transaction query error:', error.message);
        } else {
          console.error('Database transaction execution error.');
        }
        throw error;
      }
    }
  };
};

module.exports = {
  pool,
  query,
  getTransaction
};
