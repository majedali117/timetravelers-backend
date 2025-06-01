/**
 * Application configuration
 */
require('dotenv').config();

module.exports = {
  app: {
    port: process.env.PORT || 5001,
    env: process.env.NODE_ENV || 'development',
    apiPrefix: '/api/v1',
  },
  db: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/timetravelers',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'timetravelers-super-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },
  email: {
    from: process.env.EMAIL_FROM || 'noreply@timetravelers.com',
    smtp: {
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT || 587,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    },
  },
  google: {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/v1/auth/google/callback',
  },
  apple: {
    clientID: process.env.APPLE_CLIENT_ID,
    teamID: process.env.APPLE_TEAM_ID,
    keyID: process.env.APPLE_KEY_ID,
    privateKeyLocation: process.env.APPLE_PRIVATE_KEY_LOCATION,
    callbackURL: process.env.APPLE_CALLBACK_URL || '/api/v1/auth/apple/callback',
  },
};
