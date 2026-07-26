const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Security Headers
app.use(helmet({
  crossOriginResourcePolicy: false // Allow file access in local dev
}));

// CORS Configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
};
app.use(cors(corsOptions));

// HTTP Request Logging
app.use(morgan('dev'));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.'
  }
});
app.use('/api/', limiter);

// Parse JSON and Form Data
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve Uploads Directory Static Assets
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'EduTrack API server is healthy',
    data: {
      timestamp: new Date(),
      uptime: process.uptime()
    }
  });
});

// Mount Routes (Imported on demand as built, or defined below)
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/academic', require('./routes/academic.routes'));
app.use('/api/attendance', require('./routes/attendance.routes'));
app.use('/api/teacher', require('./routes/attendance.routes'));
app.use('/api/materials', require('./routes/material.routes'));
app.use('/api/assignments', require('./routes/assignment.routes'));
app.use('/api/submissions', require('./routes/assignment.routes'));
app.use('/api/marks', require('./routes/marks.routes'));
app.use('/api/timetable', require('./routes/timetable.routes'));
app.use('/api/announcements', require('./routes/announcement.routes'));
app.use('/api/notifications', require('./routes/notification.routes'));
app.use('/api/reports', require('./routes/report.routes'));

// 404 Route handler
app.use(notFound);

// Central error handler
app.use(errorHandler);

module.exports = app;
