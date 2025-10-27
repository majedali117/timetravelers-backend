const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const missionController = require('../controllers/missionController');
const auth = require('../middleware/authorize');
const UserMission = require('../models/UserMission');

// @route   GET /missions/templates
// @desc    Get all mission templates
// @access  Private
router.get('/templates', auth(), missionController.getMissionTemplates);

// @route   GET /missions/templates/:id
// @desc    Get mission template by ID
// @access  Private
router.get('/templates/:id', auth(), missionController.getMissionTemplate);

// @route   POST /missions/templates
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

// @route   PUT /missions/templates/:id
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

// @route   DELETE /missions/templates/:id
// @desc    Delete mission template
// @access  Private (Admin only)
router.delete('/templates/:id', auth('admin'), missionController.deleteMissionTemplate);

// @route   POST /missions/assign
// @desc    Assign mission to user
// @access  Private
router.post('/assign',
  auth('user'),
  [
    // --- VALIDATION MIDDLEWARE ---
    // Checks that the request body contains a valid missionId.
    check('missionId', 'Mission ID is required').notEmpty(),
    check('missionId', 'Please provide a valid Mission ID').isMongoId(),
    check('mentorId', 'Please provide a valid Mentor ID').optional().isMongoId(),
  ],
  missionController.assignMission
);

// @route   GET /missions/user/:userId?
// @desc    Get user missions
// @access  Private
// router.get('/user/:userId', auth(), missionController.getUserMissions);

router.get('/user/:userId', auth(), missionController.getUserMissions);
router.get('/user', auth(), missionController.getUserMissions);

// @route   GET /missions/recommended/:userId?
// @desc    Get recommended missions for user
// @access  Private
router.get('/recommended/:userId', auth(), missionController.getRecommendedMissions);


router.get('/available', auth(), missionController.getAvailableMissions);

router.get('/categories', auth(), missionController.getMissionCategories);

// @route   GET /missions/:id
// @desc    Get user mission by ID
// @access  Private
router.get('/:id', auth(), missionController.getUserMission);

// @route   PUT /missions/:id/progress
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

// @route   POST /missions/:id/feedback
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

// @route   POST /missions/:id/mentor-feedback
// @desc    Submit mentor feedback for mission
// @access  Private (Admin or assigned mentor)
router.post('/:id/mentor-feedback',
  auth(),
  [
    check('content', 'Content is required').notEmpty()
  ],
  missionController.submitMentorFeedback
);

// @route   PUT /missions/:id/abandon
// @desc    Abandon mission
// @access  Private
router.put('/:id/abandon', auth(), missionController.abandonMission);

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
      
      const missions = await UserMission.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('mission')
        .populate('mentor', 'name profileImage');
      
      const total = await UserMission.countDocuments(query);
      
      res.status(200).json({
        success: true,
        missions,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error fetching missions:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

module.exports = router;
