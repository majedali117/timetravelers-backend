const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const protocolController = require('../controllers/protocolController');
const auth = require('../middleware/authorize');
const UserProtocol = require('../models/UserProtocol');

// @route   GET /protocols/templates
// @desc    Get all protocol templates
// @access  Private
router.get('/templates', auth(), protocolController.getProtocolTemplates);

// @route   GET /protocols/templates/:id
// @desc    Get protocol template by ID
// @access  Private
router.get('/templates/:id', auth(), protocolController.getProtocolTemplate);

// @route   POST /protocols/templates
// @desc    Create protocol template
// @access  Private (Admin only)
router.post('/templates',
  auth('admin'),
  [
    check('title', 'Title is required').notEmpty(),
    check('description', 'Description is required').notEmpty(),
    check('targetLevel', 'Target level must be valid').isIn(['beginner', 'intermediate', 'advanced', 'expert']),
    check('estimatedDuration.value', 'Duration value is required').isInt({ min: 1 }),
    check('estimatedDuration.unit', 'Duration unit must be valid').isIn(['days', 'weeks', 'months']),
    check('phases', 'At least one phase is required').isArray({ min: 1 })
  ],
  protocolController.createProtocolTemplate
);

// @route   PUT /protocols/templates/:id
// @desc    Update protocol template
// @access  Private (Admin only)
router.put('/templates/:id',
  auth('admin'),
  [
    check('title', 'Title is required').optional().notEmpty(),
    check('description', 'Description is required').optional().notEmpty(),
    check('targetLevel', 'Target level must be valid').optional().isIn(['beginner', 'intermediate', 'advanced', 'expert']),
    check('estimatedDuration.value', 'Duration value is required').optional().isInt({ min: 1 }),
    check('estimatedDuration.unit', 'Duration unit must be valid').optional().isIn(['days', 'weeks', 'months'])
  ],
  protocolController.updateProtocolTemplate
);

// @route   DELETE /protocols/templates/:id
// @desc    Delete protocol template
// @access  Private (Admin only)
router.delete('/templates/:id', auth('admin'), protocolController.deleteProtocolTemplate);

// @route   POST /protocols/assign
// @desc    Assign protocol to user
// @access  Private
router.post('/assign',
  auth(),
  [
    check('protocolId', 'Protocol ID is required').notEmpty(),
    check('userId', 'User ID must be valid').optional().isMongoId(),
    check('mentorId', 'Mentor ID must be valid').optional().isMongoId()
  ],
  protocolController.assignProtocol
);

// @route   GET /protocols/user/:userId?
// @desc    Get user protocols
// @access  Private
router.get('/user/:userId', auth(), protocolController.getUserProtocols);

// @route   GET /protocols/:id
// @desc    Get user protocol by ID
// @access  Private
router.get('/:id', auth(), protocolController.getUserProtocol);

// @route   PUT /protocols/:id/milestone
// @desc    Update milestone completion
// @access  Private
router.put('/:id/milestone',
  auth(),
  [
    check('phaseIndex', 'Phase index is required').isInt({ min: 0 }),
    check('milestoneIndex', 'Milestone index is required').isInt({ min: 0 }),
    check('completed', 'Completed status is required').isBoolean()
  ],
  protocolController.updateMilestoneCompletion
);

// @route   PUT /protocols/:id/customizations
// @desc    Update protocol customizations
// @access  Private
router.put('/:id/customizations',
  auth(),
  [
    check('customizations', 'Customizations are required').notEmpty()
  ],
  protocolController.updateCustomizations
);

// @route   PUT /protocols/:id/abandon
// @desc    Abandon protocol
// @access  Private
router.put('/:id/abandon', auth(), protocolController.abandonProtocol);

// @route   GET /protocols/recommended/:userId?
// @desc    Get recommended protocols for user
// @access  Private
router.get('/recommended/:userId', auth(), protocolController.getRecommendedProtocols);


router.get(
  '/',
  auth(),
  async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;
      const status = req.query.status;
      
      const query = { user: req.user.id };
      
      // Add status filter if provided
      if (status) {
        query.status = status;
      }
      
      const protocols = await UserProtocol.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('protocol')
        .populate('mentor', 'name profileImage');
      
      const total = await UserProtocol.countDocuments(query);
      
      res.status(200).json({
        success: true,
        protocols,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error fetching protocols:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

module.exports = router;
