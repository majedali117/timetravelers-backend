const express = require('express');
const router = express.Router();
const matchingController = require('../controllers/matchingController');
const auth = require('../middleware/authorize');

// @route   POST /api/v1/matching/calculate/:userId?
// @desc    Calculate TELL matching scores for a user
// @access  Private (Admin can calculate for any user, regular users only for themselves)
router.post('/calculate/:userId', auth(), matchingController.calculateMatching);

// @route   GET /api/v1/matching/top/:userId?
// @desc    Get top mentor matches for a user
// @access  Private (Admin can view any user's matches, regular users only their own)
router.get('/top/:userId', auth(), matchingController.getTopMatches);

// @route   GET /api/v1/matching/mentor/:mentorId
// @desc    Get matching details for a specific mentor
// @access  Private
router.get('/mentor/:mentorId', auth(), matchingController.getMentorMatch);

// @route   POST /api/v1/matching/batch
// @desc    Run matching algorithm for all users
// @access  Private (Admin only)
router.post('/batch', auth('admin'), matchingController.runBatchMatching);

module.exports = router;
