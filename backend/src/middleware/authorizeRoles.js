const ApiError = require('../utils/ApiError');

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return next(new ApiError(403, `Access denied: Role '${req.user ? req.user.role : 'unauthenticated'}' is not authorized to access this resource.`));
    }
    next();
  };
};

module.exports = authorizeRoles;
