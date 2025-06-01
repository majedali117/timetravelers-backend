const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const missionController = require('../controllers/missionController');
const auth = require('../middleware/authorize');

// @route   GET /api/v1/missions/templates
// @desc    Get all mission templates
// @access  Private
router.get('/templates', auth(), missionController.getMissionTemplates);

// @route   GET /api/v1/missions/templates/:id
// @desc    Get mission template by ID
// @access  Private
router.get('/templates/:id', auth(), missionController.getMissionTemplate);

// @route   POST /api/v1/missions/templates
// @desc    Create mission template
// @access  Private (Admin only)
router.post('/templates',
  auth('admin'),
  [
    check('title', 'Title is required').notEmpty(),
    check('description', 'Description is required').notEmpty(),
    check('type', 'Type must be valid').isIn(['learning', 'skill_building', 'networking', 'project', 'assessment', 'reflection']),
    check('difficulty', 'Difficulty must be valid').isIn(['beginner', 'intermediate', 'advanced', 'expert']),
    check('estimatedDuration.value', 'Duration value is required').isInt({ min: 1 }),
    check('estimatedDuration.unit', 'Duration unit must be valid').isIn(['minutes', 'hours', 'days', 'weeks']),
    check('steps', 'At least one step is required').isArray({ min: 1 })
  ],
  missionController.createMissionTemplate
);

// @route   PUT /api/v1/missions/templates/:id
// @desc    Update mission template
// @access  Private (Admin only)
router.put('/templates/:id',
  auth('admin'),
  [
    check('title', 'Title is required').optional().notEmpty(),
    check('description', 'Description is required').optional().notEmpty(),
    check('type', 'Type must be valid').optional().isIn(['learning', 'skill_building', 'networking', 'project', 'assessment', 'reflection']),
    check('difficulty', 'Difficulty must be valid').optional().isIn(['beginner', 'intermediate', 'advanced', 'expert']),
    check('estimatedDuration.value', 'Duration value is required').optional().isInt({ min: 1 }),
    check('estimatedDuration.unit', 'Duration unit must be valid').optional().isIn(['minutes', 'hours', 'days', 'weeks'])
  ],
  missionController.updateMissionTemplate
);

// @route   DELETE /api/v1/missions/templates/:id
// @desc    Delete mission template
// @access  Private (Admin only)
router.delete('/templates/:id', auth('admin'), missionController.deleteMissionTemplate);

// @route   POST /api/v1/missions/assign
// @desc    Assign mission to user
// @access  Private
router.post('/assign',
  auth(),
  [
    check('missionId', 'Mission ID is required').notEmpty(),
    check('userId', 'User ID must be valid').optional().isMongoId(),
    check('mentorId', 'Mentor ID must be valid').optional().isMongoId()
  ],
  missionController.assignMission
);

// @route   GET /api/v1/missions/user/:userId?
// @desc    Get user missions
// @access  Private
// router.get('/user/:userId', auth(), missionController.getUserMissions);

router.get('/user/:userId', auth(), missionController.getUserMissions);
router.get('/user', auth(), missionController.getUserMissions);

// @route   GET /api/v1/missions/:id
// @desc    Get user mission by ID
// @access  Private
router.get('/:id', auth(), missionController.getUserMission);

// @route   PUT /api/v1/missions/:id/progress
// @desc    Update user mission progress
// @access  Private
router.put('/:id/progress',
  auth(),
  [
    check('stepIndex', 'Step index is required').isInt({ min: 0 }),
    check('completed', 'Completed status is required').isBoolean()
  ],
  missionController.updateMissionProgress
);

// @route   POST /api/v1/missions/:id/feedback
// @desc    Submit mission feedback
// @access  Private
router.post('/:id/feedback',
  auth(),
  [
    check('rating', 'Rating must be between 1 and 5').isInt({ min: 1, max: 5 }),
    check('comments', 'Comments are required').notEmpty()
  ],
  missionController.submitMissionFeedback
);

// @route   POST /api/v1/missions/:id/mentor-feedback
// @desc    Submit mentor feedback for mission
// @access  Private (Admin or assigned mentor)
router.post('/:id/mentor-feedback',
  auth(),
  [
    check('content', 'Content is required').notEmpty()
  ],
  missionController.submitMentorFeedback
);

// @route   PUT /api/v1/missions/:id/abandon
// @desc    Abandon mission
// @access  Private
router.put('/:id/abandon', auth(), missionController.abandonMission);

// @route   GET /api/v1/missions/recommended/:userId?
// @desc    Get recommended missions for user
// @access  Private
router.get('/recommended/:userId', auth(), missionController.getRecommendedMissions);

module.exports = router;
