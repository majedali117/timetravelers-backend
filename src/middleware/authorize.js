/**
 * Middleware for role-based authorization
 * @param {Array} roles - Array of allowed roles
 * @returns {Function} - Express middleware function
 
const authorize = (roles = []) => {
  // Convert string to array if single role is passed
  if (typeof roles === 'string') {
    roles = [roles];
  }

  return (req, res, next) => {
    // Check if user exists and has a role
    if (!req.user || !req.user.role) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Check if user's role is in the allowed roles
    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden - Insufficient permissions' });
    }

    // User is authorized, proceed to the next middleware
    next();
  };
};

module.exports = authorize;
*/

// Modified authorize.js middleware to properly handle JWT authentication
const passport = require('passport');

/**
 * Middleware for role-based authorization
 * This middleware should only be applied to protected routes
 * @param {Array} roles - Array of allowed roles
 * @returns {Function} - Express middleware function
 */
const authorize = (roles = []) => {
  // Convert string to array if single role is passed
  if (typeof roles === 'string') {
    roles = [roles];
  }
  
  return (req, res, next) => {
    // Use JWT authentication
    passport.authenticate('jwt', { session: false }, (err, user, info) => {
      if (err) {
        return next(err);
      }
      
      // If no user found or authentication failed
      if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      // Set user in request object
      req.user = user;
      
      // Check if user has a role
      if (!user.role) {
        return res.status(401).json({ message: 'Unauthorized - No role assigned' });
      }
      
      // Check if user's role is in the allowed roles
      if (roles.length && !roles.includes(user.role)) {
        return res.status(403).json({ message: 'Forbidden - Insufficient permissions' });
      }
      
      // User is authorized, proceed to the next middleware
      next();
    })(req, res, next);
  };
};

module.exports = authorize;