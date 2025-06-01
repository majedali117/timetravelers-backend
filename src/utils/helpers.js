const crypto = require('crypto');

/**
 * Generate a random token
 * @param {Number} bytes - Number of bytes for token generation
 * @returns {String} - Hex string token
 */
exports.generateToken = (bytes = 32) => {
  return crypto.randomBytes(bytes).toString('hex');
};

/**
 * Hash a password or token
 * @param {String} string - String to hash
 * @returns {String} - Hashed string
 */
exports.hashString = (string) => {
  return crypto.createHash('sha256').update(string).digest('hex');
};

/**
 * Generate a random password
 * @param {Number} length - Length of password
 * @returns {String} - Random password
 */
exports.generatePassword = (length = 10) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return password;
};

/**
 * Validate email format
 * @param {String} email - Email to validate
 * @returns {Boolean} - True if valid, false otherwise
 */
exports.isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Format error messages
 * @param {Object} error - Error object
 * @returns {Object} - Formatted error object
 */
exports.formatError = (error) => {
  if (error.name === 'ValidationError') {
    const errors = {};
    
    Object.keys(error.errors).forEach((key) => {
      errors[key] = error.errors[key].message;
    });
    
    return {
      message: 'Validation Error',
      errors,
    };
  }
  
  return {
    message: error.message || 'Server Error',
  };
};
