const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ApiError = require('../utils/ApiError');
require('dotenv').config();

const maxFileSizeMB = parseInt(process.env.MAX_FILE_SIZE_MB || '10', 10);
const maxSizeBytes = maxFileSizeMB * 1024 * 1024;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Determine directory based on request URL
    let folder = 'uploads/materials/';
    if (req.originalUrl.includes('submission')) {
      folder = 'uploads/submissions/';
    }

    const destPath = path.join(__dirname, '../../', folder);
    
    // Ensure directory exists
    if (!fs.existsSync(destPath)) {
      fs.mkdirSync(destPath, { recursive: true });
    }
    
    cb(null, destPath);
  },
  filename: (req, file, cb) => {
    // Sanitize filename and append timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'application/pdf',
    // Word documents
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    // PowerPoint
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    // Images
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif'
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ApiError(400, 'Unsupported file type. Only PDF, Word, PowerPoint, and Image files are allowed.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: maxSizeBytes
  }
});

module.exports = upload;
