const express = require('express');
const router = express.Router();
const passport = require('passport');
const authorize = require('../middleware/authorize');
const LearningStyle = require('../models/LearningStyle');

/**
 * @swagger
 * tags:
 *   name: LearningStyles
 *   description: Learning style management and information
 */

/**
 * @swagger
 * /api/v1/learning-styles:
 *   get:
 *     summary: Get all learning styles
 *     tags: [LearningStyles]
 *     responses:
 *       200:
 *         description: List of learning styles retrieved successfully
 *       500:
 *         description: Server error
 */
router.get('/', async (req, res) => {
  try {
    const learningStyles = await LearningStyle.find({ isActive: true });
    
    res.status(200).json({
      message: 'Learning styles retrieved successfully',
      count: learningStyles.length,
      learningStyles,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @swagger
 * /api/v1/learning-styles/{id}:
 *   get:
 *     summary: Get learning style by ID
 *     tags: [LearningStyles]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Learning style ID
 *     responses:
 *       200:
 *         description: Learning style retrieved successfully
 *       404:
 *         description: Learning style not found
 *       500:
 *         description: Server error
 */
router.get('/:id', async (req, res) => {
  try {
    const learningStyle = await LearningStyle.findById(req.params.id);
    
    if (!learningStyle) {
      return res.status(404).json({ message: 'Learning style not found' });
    }
    
    res.status(200).json({
      message: 'Learning style retrieved successfully',
      learningStyle,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @swagger
 * /api/v1/learning-styles:
 *   post:
 *     summary: Create a new learning style (admin only)
 *     tags: [LearningStyles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               characteristics:
 *                 type: array
 *                 items:
 *                   type: string
 *               recommendedApproaches:
 *                 type: array
 *                 items:
 *                   type: string
 *               icon:
 *                 type: string
 *               assessmentQuestions:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     question:
 *                       type: string
 *                     options:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           text:
 *                             type: string
 *                           value:
 *                             type: number
 *               compatibleStyles:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Learning style created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Server error
 */
router.post(
  '/',
  passport.authenticate('jwt', { session: false }),
  authorize(['admin']),
  async (req, res) => {
    try {
      const {
        name,
        description,
        characteristics,
        recommendedApproaches,
        icon,
        assessmentQuestions,
        compatibleStyles,
      } = req.body;
      
      // Create new learning style
      const learningStyle = new LearningStyle({
        name,
        description,
        characteristics,
        recommendedApproaches,
        icon,
        assessmentQuestions,
        compatibleStyles,
      });
      
      await learningStyle.save();
      
      res.status(201).json({
        message: 'Learning style created successfully',
        learningStyle,
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

/**
 * @swagger
 * /api/v1/learning-styles/{id}:
 *   put:
 *     summary: Update learning style (admin only)
 *     tags: [LearningStyles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Learning style ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               characteristics:
 *                 type: array
 *                 items:
 *                   type: string
 *               recommendedApproaches:
 *                 type: array
 *                 items:
 *                   type: string
 *               icon:
 *                 type: string
 *               assessmentQuestions:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     question:
 *                       type: string
 *                     options:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           text:
 *                             type: string
 *                           value:
 *                             type: number
 *               compatibleStyles:
 *                 type: array
 *                 items:
 *                   type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Learning style updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Learning style not found
 *       500:
 *         description: Server error
 */
router.put(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  authorize(['admin']),
  async (req, res) => {
    try {
      const learningStyle = await LearningStyle.findById(req.params.id);
      
      if (!learningStyle) {
        return res.status(404).json({ message: 'Learning style not found' });
      }
      
      // Update fields
      const updateFields = [
        'name', 'description', 'characteristics', 'recommendedApproaches',
        'icon', 'assessmentQuestions', 'compatibleStyles', 'isActive'
      ];
      
      updateFields.forEach(field => {
        if (req.body[field] !== undefined) {
          learningStyle[field] = req.body[field];
        }
      });
      
      await learningStyle.save();
      
      res.status(200).json({
        message: 'Learning style updated successfully',
        learningStyle,
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

/**
 * @swagger
 * /api/v1/learning-styles/{id}:
 *   delete:
 *     summary: Delete learning style (admin only)
 *     tags: [LearningStyles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Learning style ID
 *     responses:
 *       200:
 *         description: Learning style deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Learning style not found
 *       500:
 *         description: Server error
 */
router.delete(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  authorize(['admin']),
  async (req, res) => {
    try {
      const learningStyle = await LearningStyle.findById(req.params.id);
      
      if (!learningStyle) {
        return res.status(404).json({ message: 'Learning style not found' });
      }
      
      await learningStyle.remove();
      
      res.status(200).json({
        message: 'Learning style deleted successfully',
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

module.exports = router;
