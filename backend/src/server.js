require('dotenv').config();
const app = require('./app');
const { pool } = require('./config/database');

const PORT = process.env.PORT || 5000;

let server;

const startServer = async () => {
  try {
    // Test database connection
    console.log('Testing MySQL connection pool...');
    const connection = await pool.getConnection();
    console.log('Successfully connected to MySQL database.');
    connection.release();
  } catch (err) {
    console.error('CRITICAL: Failed to connect to database on startup.');
    console.error('Error Details:', err.message);
    console.log('Server will start, but database-dependent features will fail. Ensure schema.sql has been run and credentials are correct.');
  }

  server = app.listen(PORT, () => {
    console.log(`EduTrack server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });

  // Graceful shutdown handling
  const shutdown = (signal) => {
    console.log(`Received ${signal}. Shutting down gracefully...`);
    if (server) {
      server.close(async () => {
        console.log('HTTP server closed.');
        try {
          await pool.end();
          console.log('Database pool connection closed.');
          process.exit(0);
        } catch (dbErr) {
          console.error('Error closing database pool:', dbErr.message);
          process.exit(1);
        }
      });
    } else {
      process.exit(0);
    }
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
};

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception! Server shutting down...');
  console.error(err.stack || err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // We can let the server continue running but log it
});

startServer();
