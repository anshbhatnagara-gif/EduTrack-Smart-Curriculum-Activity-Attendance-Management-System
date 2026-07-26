const ApiError = require('../utils/ApiError');

const errorHandler = (err, req, res, next) => {
  let error = err;

  // If the error is not an instance of ApiError, normalize it
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || (error.code === 'LIMIT_FILE_SIZE' ? 413 : 500);
    let message = error.message || 'Something went wrong';
    
    // Mask raw database errors
    if (error.sql || error.code?.startsWith('ER_')) {
      message = 'A database error occurred while processing your request.';
      // Log the actual DB error on the server
      console.error('Database Error details:', err);
    }

    error = new ApiError(statusCode, message, error.errors || [], err.stack);
  }

  const response = {
    success: false,
    message: error.message,
    errors: error.errors || []
  };

  // Log in non-production environments
  if (process.env.NODE_ENV !== 'production') {
    console.error(err);
  }

  return res.status(error.statusCode).json(response);
};

module.exports = errorHandler;
