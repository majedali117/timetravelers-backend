const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const analyticsController = require('../controllers/analyticsController');
const auth = require('../middleware/authorize');

// @route   POST /api/v1/analytics/events
// @desc    Track analytics event
// @access  Private
router.post('/events',
  auth(),
  [
    check('eventType', 'Event type is required').notEmpty(),
    check('eventType', 'Event type must be valid').isIn([
      'login', 
      'registration', 
      'profile_update', 
      'mission_start', 
      'mission_complete',
      'mission_abandon',
      'protocol_start',
      'protocol_milestone_complete',
      'protocol_complete',
      'protocol_abandon',
      'mentor_session_start',
      'mentor_session_end',
      'assessment_complete',
      'skill_added',
      'goal_created',
      'goal_completed',
      'resource_accessed',
      'feedback_submitted',
      'search_performed',
      'recommendation_clicked',
      'feature_used',
      'error_encountered'
    ])
  ],
  analyticsController.trackEvent
);

// @route   GET /api/v1/analytics/engagement
// @desc    Get user engagement metrics
// @access  Private (Admin only)
router.get('/engagement', auth('admin'), analyticsController.getUserEngagementMetrics);

// @route   GET /api/v1/analytics/missions
// @desc    Get mission completion metrics
// @access  Private (Admin only)
router.get('/missions', auth('admin'), analyticsController.getMissionMetrics);

// @route   GET /api/v1/analytics/protocols
// @desc    Get protocol progress metrics
// @access  Private (Admin only)
router.get('/protocols', auth('admin'), analyticsController.getProtocolMetrics);

// @route   GET /api/v1/analytics/growth
// @desc    Get user growth metrics
// @access  Private (Admin only)
router.get('/growth', auth('admin'), analyticsController.getUserGrowthMetrics);

// @route   POST /api/v1/analytics/reports
// @desc    Create analytics report
// @access  Private (Admin only)
router.post('/reports',
  auth('admin'),
  [
    check('title', 'Title is required').notEmpty(),
    check('reportType', 'Report type is required').notEmpty(),
    check('reportType', 'Report type must be valid').isIn([
      'user_engagement',
      'mission_completion',
      'protocol_progress',
      'mentor_effectiveness',
      'skill_development',
      'user_retention',
      'feature_usage',
      'user_growth',
      'learning_outcomes',
      'custom'
    ]),
    check('dateRange', 'Date range is required').notEmpty(),
    check('dateRange.start', 'Start date is required').notEmpty(),
    check('dateRange.end', 'End date is required').notEmpty()
  ],
  analyticsController.createReport
);

// @route   GET /api/v1/analytics/reports
// @desc    Get all analytics reports
// @access  Private
router.get('/reports', auth(), analyticsController.getAllReports);

// @route   GET /api/v1/analytics/reports/:id
// @desc    Get analytics report by ID
// @access  Private
router.get('/reports/:id', auth(), analyticsController.getReport);

// @route   PUT /api/v1/analytics/reports/:id
// @desc    Update analytics report
// @access  Private
router.put('/reports/:id',
  auth(),
  [
    check('title', 'Title is required').optional().notEmpty(),
    check('reportType', 'Report type must be valid').optional().isIn([
      'user_engagement',
      'mission_completion',
      'protocol_progress',
      'mentor_effectiveness',
      'skill_development',
      'user_retention',
      'feature_usage',
      'user_growth',
      'learning_outcomes',
      'custom'
    ])
  ],
  analyticsController.updateReport
);

// @route   DELETE /api/v1/analytics/reports/:id
// @desc    Delete analytics report
// @access  Private
router.delete('/reports/:id', auth(), analyticsController.deleteReport);

// @route   GET /api/v1/analytics/export
// @desc    Export analytics data
// @access  Private (Admin only)
router.get('/export', auth('admin'), analyticsController.exportData);

module.exports = router;
