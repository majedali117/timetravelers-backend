const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const profileController = require('../controllers/profileController');
const auth = require('../middleware/authorize');
const upload = require('../middleware/fileUpload');

// @route   GET /api/v1/profile
// @desc    Get current user profile
// @access  Private
router.get('/', auth(), profileController.getProfile);

// @route   PUT /api/v1/profile
// @desc    Create or update user profile
// @access  Private
router.put('/', 
  auth(),
  [
    check('bio', 'Bio cannot exceed 500 characters').optional().isLength({ max: 500 }),
    check('location.city', 'City must be a string').optional().isString(),
    check('location.country', 'Country must be a string').optional().isString(),
    check('education.*.institution', 'Institution is required').optional().notEmpty(),
    check('education.*.degree', 'Degree is required').optional().notEmpty(),
    check('workExperience.*.company', 'Company is required').optional().notEmpty(),
    check('workExperience.*.position', 'Position is required').optional().notEmpty(),
    check('skills.*.name', 'Skill name is required').optional().notEmpty(),
    check('skills.*.level', 'Skill level must be valid').optional().isIn(['beginner', 'intermediate', 'advanced', 'expert']),
    check('visibility', 'Visibility must be valid').optional().isIn(['public', 'private', 'connections'])
  ],
  profileController.updateProfile
);

// @route   POST /api/v1/profile/picture
// @desc    Upload profile picture
// @access  Private
router.post('/picture', 
  auth(),
  upload.single('profilePicture'),
  profileController.uploadProfilePicture
);

// @route   GET /api/v1/profile/career-goals
// @desc    Get user career goals
// @access  Private
router.get('/career-goals', auth(), profileController.getCareerGoals);

// @route   POST /api/v1/profile/career-goals
// @desc    Create a career goal
// @access  Private
router.post('/career-goals',
  auth(),
  [
    check('title', 'Title is required').notEmpty(),
    check('description', 'Description is required').notEmpty(),
    check('timeframe', 'Timeframe must be valid').optional().isIn(['short_term', 'mid_term', 'long_term']),
    check('status', 'Status must be valid').optional().isIn(['not_started', 'in_progress', 'completed', 'deferred']),
    check('priority', 'Priority must be valid').optional().isIn(['low', 'medium', 'high'])
  ],
  profileController.createCareerGoal
);

// @route   PUT /api/v1/profile/career-goals/:id
// @desc    Update a career goal
// @access  Private
router.put('/career-goals/:id',
  auth(),
  [
    check('title', 'Title is required').optional().notEmpty(),
    check('description', 'Description is required').optional().notEmpty(),
    check('timeframe', 'Timeframe must be valid').optional().isIn(['short_term', 'mid_term', 'long_term']),
    check('status', 'Status must be valid').optional().isIn(['not_started', 'in_progress', 'completed', 'deferred']),
    check('priority', 'Priority must be valid').optional().isIn(['low', 'medium', 'high'])
  ],
  profileController.updateCareerGoal
);

// @route   DELETE /api/v1/profile/career-goals/:id
// @desc    Delete a career goal
// @access  Private
router.delete('/career-goals/:id', auth(), profileController.deleteCareerGoal);

// @route   GET /api/v1/profile/learning-assessment
// @desc    Get user learning assessment
// @access  Private
router.get('/learning-assessment', auth(), profileController.getLearningAssessment);

// @route   POST /api/v1/profile/learning-assessment
// @desc    Create a learning assessment
// @access  Private
router.post('/learning-assessment',
  auth(),
  [
    check('learningStyleResults', 'Learning style results are required').notEmpty(),
    check('learningStyleResults.visual', 'Visual score must be between 0 and 100').isInt({ min: 0, max: 100 }),
    check('learningStyleResults.auditory', 'Auditory score must be between 0 and 100').isInt({ min: 0, max: 100 }),
    check('learningStyleResults.reading', 'Reading score must be between 0 and 100').isInt({ min: 0, max: 100 }),
    check('learningStyleResults.kinesthetic', 'Kinesthetic score must be between 0 and 100').isInt({ min: 0, max: 100 })
  ],
  profileController.createLearningAssessment
);

// @route   GET /api/v1/profile/skills
// @desc    Get skills
// @access  Private
router.get('/skills', auth(), profileController.getSkills);

// @route   GET /api/v1/profile/completeness
// @desc    Calculate profile completeness
// @access  Private
router.get('/completeness', auth(), profileController.calculateProfileCompleteness);

module.exports = router;
