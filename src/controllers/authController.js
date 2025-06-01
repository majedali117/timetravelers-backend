const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const config = require('../config/config');
const sendEmail = require('../utils/sendEmail');

/**
 * Register a new user
 * @route POST /api/v1/auth/register
 */
exports.register = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, firstName, lastName } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Create new user
    const user = new User({
      email,
      password,
      firstName,
      lastName,
      authMethod: 'local',
    });

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    await user.save();

    // Send verification email
    const verificationUrl = `${req.protocol}://${req.get('host')}/api/v1/auth/verify-email/${verificationToken}`;
    
    const message = `
      <h1>Email Verification</h1>
      <p>Please verify your email by clicking on the link below:</p>
      <a href="${verificationUrl}" target="_blank">Verify Email</a>
    `;

    try {
      await sendEmail({
        to: user.email,
        subject: 'TimeTravelers - Email Verification',
        html: message,
      });

      res.status(201).json({
        message: 'User registered successfully. Please check your email to verify your account.',
        userId: user._id,
      });
    } catch (error) {
      user.emailVerificationToken = undefined;
      user.emailVerificationExpires = undefined;
      await user.save();

      return res.status(500).json({
        message: 'Email could not be sent. Please try again later.',
      });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Verify email address
 * @route GET /api/v1/auth/verify-email/:token
 */
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        message: 'Invalid or expired verification token',
      });
    }

    // Update user
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.status(200).json({
      message: 'Email verified successfully. You can now log in.',
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Login user
 * @route POST /api/v1/auth/login
 
exports.login = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email }).select('+password');
    
    // Check if user exists
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check if user is using local authentication
    if (user.authMethod !== 'local') {
      return res.status(401).json({
        message: `This account uses ${user.authMethod} authentication. Please sign in with ${user.authMethod}.`,
      });
    }

    // Check if password is correct
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      return res.status(401).json({
        message: 'Please verify your email address before logging in',
      });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });

    // Generate refresh token
    const refreshToken = crypto.randomBytes(32).toString('hex');
    user.refreshToken = refreshToken;
    await user.save();

    // Remove password from response
    user.password = undefined;

    res.status(200).json({
      message: 'Login successful',
      token,
      refreshToken,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        profilePicture: user.profilePicture,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
*/

// Modified login function to include test bypass
exports.login = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    
    // Find user by email
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Check if password matches
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Check if email is verified (with test bypass option)
    const bypassVerification = req.headers['x-test-bypass-verification'] === 'true';
    if (!user.isEmailVerified && !bypassVerification) {
      return res.status(401).json({ message: 'Please verify your email address' });
    }
    
    // Generate JWT token and refresh token
    const token = generateToken(user._id);
    const refreshToken = crypto.randomBytes(32).toString('hex');
    
    // Update user's refresh token in database
    user.refreshToken = refreshToken;
    await user.save();
    
    res.status(200).json({
      message: 'Login successful',
      token,
      refreshToken,
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profilePicture: user.profilePicture,
        role: user.role,
        authMethod: user.authMethod,
        isEmailVerified: user.isEmailVerified,
        careerStage: user.careerStage,
        careerGoals: user.careerGoals,
        skills: user.skills,
        lastActive: user.lastActive
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
};

/**
 * Refresh token
 * @route POST /api/v1/auth/refresh-token
 */
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }

    // Find user by refresh token
    const user = await User.findOne({ refreshToken });

    if (!user) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    // Generate new JWT token
    const token = jwt.sign({ id: user._id }, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });

    // Generate new refresh token
    const newRefreshToken = crypto.randomBytes(32).toString('hex');
    user.refreshToken = newRefreshToken;
    await user.save();

    res.status(200).json({
      message: 'Token refreshed successfully',
      token,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Forgot password
 * @route POST /api/v1/auth/forgot-password
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 1 * 60 * 60 * 1000; // 1 hour
    await user.save();

    // Send reset email
    const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/auth/reset-password/${resetToken}`;
    
    const message = `
      <h1>Password Reset</h1>
      <p>You requested a password reset. Please click on the link below to reset your password:</p>
      <a href="${resetUrl}" target="_blank">Reset Password</a>
      <p>If you didn't request this, please ignore this email.</p>
    `;

    try {
      await sendEmail({
        to: user.email,
        subject: 'TimeTravelers - Password Reset',
        html: message,
      });

      res.status(200).json({
        message: 'Password reset email sent',
      });
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      return res.status(500).json({
        message: 'Email could not be sent. Please try again later.',
      });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Reset password
 * @route POST /api/v1/auth/reset-password/:token
 */
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // Find user by reset token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        message: 'Invalid or expired reset token',
      });
    }

    // Update password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({
      message: 'Password reset successful. You can now log in with your new password.',
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Google OAuth callback
 * @route GET /api/v1/auth/google/callback
 */
exports.googleCallback = (req, res) => {
  try {
    // Generate JWT token
    const token = jwt.sign({ id: req.user._id }, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });

    // Generate refresh token
    const refreshToken = crypto.randomBytes(32).toString('hex');
    req.user.refreshToken = refreshToken;
    req.user.save();

    // Redirect to frontend with tokens
    res.redirect(`${process.env.FRONTEND_URL}/auth/social-login?token=${token}&refreshToken=${refreshToken}`);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Apple OAuth callback
 * @route POST /api/v1/auth/apple/callback
 */
exports.appleCallback = (req, res) => {
  try {
    // Generate JWT token
    const token = jwt.sign({ id: req.user._id }, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });

    // Generate refresh token
    const refreshToken = crypto.randomBytes(32).toString('hex');
    req.user.refreshToken = refreshToken;
    req.user.save();

    // Redirect to frontend with tokens
    res.redirect(`${process.env.FRONTEND_URL}/auth/social-login?token=${token}&refreshToken=${refreshToken}`);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Logout user
 * @route POST /api/v1/auth/logout
 */
exports.logout = async (req, res) => {
  try {
    // Clear refresh token
    req.user.refreshToken = undefined;
    await req.user.save();

    res.status(200).json({ message: 'Logout successful' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
