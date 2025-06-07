const express = require('express');
const router = express.Router();
const passport = require('passport');
const authorize = require('../middleware/authorize');
const CareerField = require('../models/CareerField');

/**
 * @swagger
 * tags:
 *   name: CareerFields
 *   description: Career field management and information
 */

/**
 * @swagger
 * /career-fields:
 *   get:
 *     summary: Get all career fields
 *     tags: [CareerFields]
 *     responses:
 *       200:
 *         description: List of career fields retrieved successfully
 *       500:
 *         description: Server error
 */
router.get('/', async (req, res) => {
  try {
    const careerFields = await CareerField.find({ isActive: true });
    
    res.status(200).json({
      message: 'Career fields retrieved successfully',
      count: careerFields.length,
      careerFields,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @swagger
 * /career-fields/{id}:
 *   get:
 *     summary: Get career field by ID
 *     tags: [CareerFields]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Career field ID
 *     responses:
 *       200:
 *         description: Career field retrieved successfully
 *       404:
 *         description: Career field not found
 *       500:
 *         description: Server error
 */
router.get('/:id', async (req, res) => {
  try {
    const careerField = await CareerField.findById(req.params.id);
    
    if (!careerField) {
      return res.status(404).json({ message: 'Career field not found' });
    }
    
    res.status(200).json({
      message: 'Career field retrieved successfully',
      careerField,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @swagger
 * /career-fields:
 *   post:
 *     summary: Create a new career field (admin only)
 *     tags: [CareerFields]
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
 *               icon:
 *                 type: string
 *               skills:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *                     level:
 *                       type: string
 *                       enum: [beginner, intermediate, advanced, expert]
 *               subFields:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *               resources:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                     type:
 *                       type: string
 *                       enum: [article, video, course, book, tool, other]
 *                     url:
 *                       type: string
 *                     description:
 *                       type: string
 *               careerPaths:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                     description:
 *                       type: string
 *                     averageSalary:
 *                       type: number
 *                     growthRate:
 *                       type: number
 *                     requiredSkills:
 *                       type: array
 *                       items:
 *                         type: string
 *     responses:
 *       201:
 *         description: Career field created successfully
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
        icon,
        skills,
        subFields,
        resources,
        careerPaths,
      } = req.body;
      
      // Create new career field
      const careerField = new CareerField({
        name,
        description,
        icon,
        skills,
        subFields,
        resources,
        careerPaths,
      });
      
      await careerField.save();
      
      res.status(201).json({
        message: 'Career field created successfully',
        careerField,
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

/**
 * @swagger
 * /career-fields/{id}:
 *   put:
 *     summary: Update career field (admin only)
 *     tags: [CareerFields]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Career field ID
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
 *               icon:
 *                 type: string
 *               skills:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *                     level:
 *                       type: string
 *                       enum: [beginner, intermediate, advanced, expert]
 *               subFields:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *               resources:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                     type:
 *                       type: string
 *                       enum: [article, video, course, book, tool, other]
 *                     url:
 *                       type: string
 *                     description:
 *                       type: string
 *               careerPaths:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                     description:
 *                       type: string
 *                     averageSalary:
 *                       type: number
 *                     growthRate:
 *                       type: number
 *                     requiredSkills:
 *                       type: array
 *                       items:
 *                         type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Career field updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Career field not found
 *       500:
 *         description: Server error
 */
router.put(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  authorize(['admin']),
  async (req, res) => {
    try {
      const careerField = await CareerField.findById(req.params.id);
      
      if (!careerField) {
        return res.status(404).json({ message: 'Career field not found' });
      }
      
      // Update fields
      const updateFields = [
        'name', 'description', 'icon', 'skills', 'subFields',
        'resources', 'careerPaths', 'isActive'
      ];
      
      updateFields.forEach(field => {
        if (req.body[field] !== undefined) {
          careerField[field] = req.body[field];
        }
      });
      
      await careerField.save();
      
      res.status(200).json({
        message: 'Career field updated successfully',
        careerField,
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

/**
 * @swagger
 * /career-fields/{id}:
 *   delete:
 *     summary: Delete career field (admin only)
 *     tags: [CareerFields]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Career field ID
 *     responses:
 *       200:
 *         description: Career field deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Career field not found
 *       500:
 *         description: Server error
 */
router.delete(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  authorize(['admin']),
  async (req, res) => {
    try {
      const careerField = await CareerField.findById(req.params.id);
      
      if (!careerField) {
        return res.status(404).json({ message: 'Career field not found' });
      }
      
      await careerField.remove();
      
      res.status(200).json({
        message: 'Career field deleted successfully',
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

module.exports = router;
