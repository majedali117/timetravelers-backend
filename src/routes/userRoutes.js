const express = require('express');
const router = express.Router();
const passport = require('passport');
const authorize = require('../middleware/authorize');

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management and profile operations
 */

/**
 * @swagger
 * /api/v1/users/profile:
 *   get:
 *     summary: Get current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get(
  '/profile',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    try {
      // Remove sensitive information
      const user = req.user.toObject();
      delete user.password;
      delete user.refreshToken;
      delete user.resetPasswordToken;
      delete user.resetPasswordExpires;
      delete user.emailVerificationToken;
      delete user.emailVerificationExpires;
      
      res.status(200).json({
        message: 'Profile retrieved successfully',
        user,
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

/**
 * @swagger
 * /api/v1/users/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               profilePicture:
 *                 type: string
 *               careerField:
 *                 type: string
 *               learningStyle:
 *                 type: string
 *               careerStage:
 *                 type: string
 *                 enum: [student, early_career, mid_career, senior]
 *               careerGoals:
 *                 type: array
 *                 items:
 *                   type: string
 *               skills:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     level:
 *                       type: number
 *                       minimum: 1
 *                       maximum: 5
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.put(
  '/profile',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    try {
      const { 
        firstName, 
        lastName, 
        profilePicture, 
        careerField,
        learningStyle,
        careerStage,
        careerGoals,
        skills
      } = req.body;
      
      // Update only provided fields
      if (firstName) req.user.firstName = firstName;
      if (lastName) req.user.lastName = lastName;
      if (profilePicture) req.user.profilePicture = profilePicture;
      if (careerField) req.user.careerField = careerField;
      if (learningStyle) req.user.learningStyle = learningStyle;
      if (careerStage) req.user.careerStage = careerStage;
      if (careerGoals) req.user.careerGoals = careerGoals;
      if (skills) req.user.skills = skills;
      
      req.user.save()
        .then(updatedUser => {
          // Remove sensitive information
          const user = updatedUser.toObject();
          delete user.password;
          delete user.refreshToken;
          delete user.resetPasswordToken;
          delete user.resetPasswordExpires;
          delete user.emailVerificationToken;
          delete user.emailVerificationExpires;
          
          res.status(200).json({
            message: 'Profile updated successfully',
            user,
          });
        })
        .catch(error => {
          res.status(400).json({ 
            message: 'Profile update failed', 
            error: error.message 
          });
        });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

/**
 * @swagger
 * /api/v1/users/change-password:
 *   post:
 *     summary: Change user password
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized or incorrect current password
 *       500:
 *         description: Server error
 */
router.post(
  '/change-password',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      // Check if user is using local authentication
      if (req.user.authMethod !== 'local') {
        return res.status(400).json({
          message: `This account uses ${req.user.authMethod} authentication and cannot change password directly.`,
        });
      }
      
      // Verify current password
      const isMatch = await req.user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(401).json({ message: 'Current password is incorrect' });
      }
      
      // Validate new password
      if (!newPassword || newPassword.length < 8) {
        return res.status(400).json({ message: 'New password must be at least 8 characters long' });
      }
      
      // Update password
      req.user.password = newPassword;
      await req.user.save();
      
      res.status(200).json({ message: 'Password changed successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     summary: Get all users (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Server error
 */
router.get(
  '/',
  passport.authenticate('jwt', { session: false }),
  authorize(['admin']),
  async (req, res) => {
    try {
      const users = await User.find().select('-password -refreshToken -resetPasswordToken -resetPasswordExpires -emailVerificationToken -emailVerificationExpires');
      
      res.status(200).json({
        message: 'Users retrieved successfully',
        count: users.length,
        users,
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

module.exports = router;
