const express = require('express');
const router = express.Router();
const passport = require('passport');
const authorize = require('../middleware/authorize');
const AIMentor = require('../models/AIMentor');
const CareerField = require('../models/CareerField');

/**
 * @swagger
 * tags:
 *   name: Mentors
 *   description: AI Mentor management and interaction
 */

/**
 * @swagger
 * /mentors:
 *   get:
 *     summary: Get all AI mentors
 *     tags: [Mentors]
 *     parameters:
 *       - in: query
 *         name: careerField
 *         schema:
 *           type: string
 *         description: Filter mentors by career field ID
 *       - in: query
 *         name: experienceLevel
 *         schema:
 *           type: string
 *           enum: [entry, intermediate, senior, expert]
 *         description: Filter mentors by experience level
 *       - in: query
 *         name: teachingStyle
 *         schema:
 *           type: string
 *         description: Filter mentors by teaching style ID
 *     responses:
 *       200:
 *         description: List of AI mentors retrieved successfully
 *       500:
 *         description: Server error
 */
router.get('/', async (req, res) => {
  try {
    const { careerField, experienceLevel, teachingStyle } = req.query;
    
    // Build filter object
    const filter = { isActive: true };
    if (careerField) filter.careerFields = careerField;
    if (experienceLevel) filter.experienceLevel = experienceLevel;
    if (teachingStyle) filter.teachingStyle = teachingStyle;
    
    const mentors = await AIMentor.find(filter)
      .populate('careerFields', 'name');
    
    res.status(200).json({
      message: 'AI mentors retrieved successfully',
      count: mentors.length,
      mentors,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @swagger
 * /mentors/{id}:
 *   get:
 *     summary: Get AI mentor by ID
 *     tags: [Mentors]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: AI mentor ID
 *     responses:
 *       200:
 *         description: AI mentor retrieved successfully
 *       404:
 *         description: AI mentor not found
 *       500:
 *         description: Server error
 */
router.get('/:id', async (req, res) => {
  try {
    const mentor = await AIMentor.findById(req.params.id)
      .populate('careerFields', 'name description');
    
    if (!mentor) {
      return res.status(404).json({ message: 'AI mentor not found' });
    }
    
    res.status(200).json({
      message: 'AI mentor retrieved successfully',
      mentor,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @swagger
 * /mentors:
 *   post:
 *     summary: Create a new AI mentor (admin only)
 *     tags: [Mentors]
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
 *               - bio
 *               - expertise
 *               - specialization
 *               - experienceLevel
 *               - teachingStyle
 *               - knowledgeBase
 *             properties:
 *               name:
 *                 type: string
 *               avatar:
 *                 type: string
 *               bio:
 *                 type: string
 *               expertise:
 *                 type: array
 *                 items:
 *                   type: string
 *               specialization:
 *                 type: string
 *               experienceLevel:
 *                 type: string
 *                 enum: [entry, intermediate, senior, expert]
 *               teachingStyle:
 *                 type: string
 *               personalityTraits:
 *                 type: array
 *                 items:
 *                   type: string
 *               communicationStyle:
 *                 type: string
 *                 enum: [direct, supportive, analytical, expressive]
 *               knowledgeBase:
 *                 type: string
 *     responses:
 *       201:
 *         description: AI mentor created successfully
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
        avatar,
        bio,
        expertise,
        specialization,
        experienceLevel,
        teachingStyle,
        personalityTraits,
        communicationStyle,
        knowledgeBase,
      } = req.body;
      
      // Create new AI mentor
      const mentor = new AIMentor({
        name,
        avatar,
        bio,
        expertise,
        specialization,
        experienceLevel,
        teachingStyle,
        personalityTraits,
        communicationStyle,
        knowledgeBase,
      });
      
      await mentor.save();
      
      res.status(201).json({
        message: 'AI mentor created successfully',
        mentor,
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

/**
 * @swagger
 * /mentors/{id}:
 *   put:
 *     summary: Update AI mentor (admin only)
 *     tags: [Mentors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: AI mentor ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               avatar:
 *                 type: string
 *               bio:
 *                 type: string
 *               expertise:
 *                 type: array
 *                 items:
 *                   type: string
 *               specialization:
 *                 type: string
 *               experienceLevel:
 *                 type: string
 *                 enum: [entry, intermediate, senior, expert]
 *               teachingStyle:
 *                 type: string
 *               personalityTraits:
 *                 type: array
 *                 items:
 *                   type: string
 *               communicationStyle:
 *                 type: string
 *                 enum: [direct, supportive, analytical, expressive]
 *               knowledgeBase:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: AI mentor updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: AI mentor not found
 *       500:
 *         description: Server error
 */
router.put(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  authorize(['admin']),
  async (req, res) => {
    try {
      const mentor = await AIMentor.findById(req.params.id);
      
      if (!mentor) {
        return res.status(404).json({ message: 'AI mentor not found' });
      }
      
      // Update fields
      const updateFields = [
        'name', 'avatar', 'bio', 'expertise', 'specialization',
        'experienceLevel', 'teachingStyle', 'personalityTraits',
        'communicationStyle', 'knowledgeBase', 'isActive'
      ];
      
      updateFields.forEach(field => {
        if (req.body[field] !== undefined) {
          mentor[field] = req.body[field];
        }
      });
      
      await mentor.save();
      
      res.status(200).json({
        message: 'AI mentor updated successfully',
        mentor,
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

/**
 * @swagger
 * /mentors/{id}:
 *   delete:
 *     summary: Delete AI mentor (admin only)
 *     tags: [Mentors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: AI mentor ID
 *     responses:
 *       200:
 *         description: AI mentor deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: AI mentor not found
 *       500:
 *         description: Server error
 */
router.delete(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  authorize(['admin']),
  async (req, res) => {
    try {
      const mentor = await AIMentor.findById(req.params.id);
      
      if (!mentor) {
        return res.status(404).json({ message: 'AI mentor not found' });
      }
      
      await mentor.remove();
      
      res.status(200).json({
        message: 'AI mentor deleted successfully',
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

module.exports = router;

