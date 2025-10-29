const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const aiController = require('../controllers/aiController');
const auth = require('../middleware/authorize');

// @route   POST /api/v1/ai/initialize
// @desc    Initialize Google Gemini AI service
// @access  Private (Admin only)
router.post('/initialize', auth('admin'), aiController.initializeService);

// @route   GET /api/v1/ai/usage
// @desc    Get Gemini AI usage statistics
// @access  Private (Admin only)
router.get('/usage', auth('admin'), aiController.getUsageStats);

// @route   GET /api/v1/ai/health
// @desc    Health check for Gemini AI service
// @access  Private (Admin only)
router.get('/health', auth('admin'), aiController.healthCheck);

// @route   POST /api/v1/ai/sync-mentors
// @desc    Sync AI mentors (load static mentor profiles)
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
// @desc    Generate career advice using Gemini AI
// @access  Private
router.post('/generate/career-advice',
  auth(),
  aiController.generateCareerAdvice
);

// @route   POST /api/v1/ai/generate/learning-plan
// @desc    Generate learning plan using Gemini AI
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

// @route   POST /api/v1/ai/sessions
// @desc    Create AI mentor session
// @access  Private
router.post('/sessions',
  auth(),
  [
    check('mentorId', 'Mentor ID is required').notEmpty(),
    check('sessionData', 'Session data is required').optional().isObject()
  ],
  aiController.createSession
);

// @route   POST /api/v1/ai/sessions/:sessionId/messages
// @desc    Send message in AI mentor session
// @access  Private
router.post('/sessions/:sessionId/messages',
  auth(),
  [
    check('message', 'Message content is required').notEmpty(),
    check('context', 'Context object is optional').optional().isObject()
  ],
  aiController.sendMessage
);

module.exports = router;

