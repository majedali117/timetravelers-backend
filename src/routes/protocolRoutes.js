const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const protocolController = require('../controllers/protocolController');
const auth = require('../middleware/authorize');

// @route   GET /api/v1/protocols/templates
// @desc    Get all protocol templates
// @access  Private
router.get('/templates', auth(), protocolController.getProtocolTemplates);

// @route   GET /api/v1/protocols/templates/:id
// @desc    Get protocol template by ID
// @access  Private
router.get('/templates/:id', auth(), protocolController.getProtocolTemplate);

// @route   POST /api/v1/protocols/templates
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

// @route   PUT /api/v1/protocols/templates/:id
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

// @route   DELETE /api/v1/protocols/templates/:id
// @desc    Delete protocol template
// @access  Private (Admin only)
router.delete('/templates/:id', auth('admin'), protocolController.deleteProtocolTemplate);

// @route   POST /api/v1/protocols/assign
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

// @route   GET /api/v1/protocols/user/:userId?
// @desc    Get user protocols
// @access  Private
router.get('/user/:userId', auth(), protocolController.getUserProtocols);

// @route   GET /api/v1/protocols/:id
// @desc    Get user protocol by ID
// @access  Private
router.get('/:id', auth(), protocolController.getUserProtocol);

// @route   PUT /api/v1/protocols/:id/milestone
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

// @route   PUT /api/v1/protocols/:id/customizations
// @desc    Update protocol customizations
// @access  Private
router.put('/:id/customizations',
  auth(),
  [
    check('customizations', 'Customizations are required').notEmpty()
  ],
  protocolController.updateCustomizations
);

// @route   PUT /api/v1/protocols/:id/abandon
// @desc    Abandon protocol
// @access  Private
router.put('/:id/abandon', auth(), protocolController.abandonProtocol);

// @route   GET /api/v1/protocols/recommended/:userId?
// @desc    Get recommended protocols for user
// @access  Private
router.get('/recommended/:userId', auth(), protocolController.getRecommendedProtocols);

module.exports = router;
