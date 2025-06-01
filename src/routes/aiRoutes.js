const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const aiController = require('../controllers/aiController');
const auth = require('../middleware/authorize');

// @route   GET /api/v1/ai/config
// @desc    Get Manus AI configuration
// @access  Private (Admin only)
router.get('/config', auth('admin'), aiController.getConfig);

// @route   PUT /api/v1/ai/config
// @desc    Update Manus AI configuration
// @access  Private (Admin only)
router.put('/config',
  auth('admin'),
  [
    check('apiEndpoint', 'API endpoint must be a valid URL').optional().isURL(),
    check('rateLimit.requestsPerMinute', 'Requests per minute must be a positive number').optional().isInt({ min: 1 }),
    check('rateLimit.requestsPerDay', 'Requests per day must be a positive number').optional().isInt({ min: 1 }),
    check('quotaSettings.maxTokensPerRequest', 'Max tokens per request must be a positive number').optional().isInt({ min: 1 }),
    check('quotaSettings.maxTokensPerDay', 'Max tokens per day must be a positive number').optional().isInt({ min: 1 }),
    check('cacheSettings.enabled', 'Cache enabled must be a boolean').optional().isBoolean(),
    check('cacheSettings.ttl', 'Cache TTL must be a positive number').optional().isInt({ min: 1 }),
    check('retrySettings.maxRetries', 'Max retries must be a positive number').optional().isInt({ min: 0 }),
    check('retrySettings.initialDelayMs', 'Initial delay must be a positive number').optional().isInt({ min: 1 }),
    check('retrySettings.maxDelayMs', 'Max delay must be a positive number').optional().isInt({ min: 1 })
  ],
  aiController.updateConfig
);

// @route   POST /api/v1/ai/initialize
// @desc    Initialize Manus AI client
// @access  Private (Admin only)
router.post('/initialize', auth('admin'), aiController.initializeClient);

// @route   GET /api/v1/ai/usage
// @desc    Get Manus AI usage statistics
// @access  Private (Admin only)
router.get('/usage', auth('admin'), aiController.getUsageStats);

// @route   POST /api/v1/ai/sync-mentors
// @desc    Sync AI mentors from Manus AI
// @access  Private (Admin only)
router.post('/sync-mentors', auth('admin'), aiController.syncMentors);

// @route   GET /api/v1/ai/mentors
// @desc    Get all AI mentors
// @access  Private
router.get('/mentors', auth(), aiController.getAllMentors);

// @route   GET /api/v1/ai/mentors/:id
// @desc    Get AI mentor by ID
// @access  Private
router.get('/mentors/:id', auth(), aiController.getMentor);

// @route   POST /api/v1/ai/generate/career-advice
// @desc    Generate career advice
// @access  Private
router.post('/generate/career-advice',
  auth(),
  [
    check('userProfile', 'User profile is required').notEmpty()
  ],
  aiController.generateCareerAdvice
);

// @route   POST /api/v1/ai/generate/learning-plan
// @desc    Generate learning plan
// @access  Private
router.post('/generate/learning-plan',
  auth(),
  [
    check('userId', 'User ID is required').notEmpty(),
    check('careerGoals', 'Career goals are required').notEmpty(),
    check('currentSkills', 'Current skills are required').notEmpty()
  ],
  aiController.generateLearningPlan
);

module.exports = router;
