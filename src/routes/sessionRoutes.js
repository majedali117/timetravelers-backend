const express = require('express');
const router = express.Router();
const passport = require('passport');
const authorize = require('../middleware/authorize');
const Session = require('../models/Session');
const User = require('../models/User');
const AIMentor = require('../models/AIMentor');

/**
 * @swagger
 * tags:
 *   name: Sessions
 *   description: Mentoring session management and interaction
 */

/**
 * @swagger
 * /sessions:
 *   get:
 *     summary: Get user's sessions
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [scheduled, in_progress, completed, cancelled]
 *         description: Filter sessions by status
 *     responses:
 *       200:
 *         description: List of sessions retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get(
  '/',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      const { status } = req.query;
      
      // Build filter object
      const filter = { user: req.user._id };
      if (status) filter.status = status;
      
      const sessions = await Session.find(filter)
        .populate('aiMentor', 'name avatar specialization')
        .sort({ startTime: -1 });
      
      res.status(200).json({
        message: 'Sessions retrieved successfully',
        count: sessions.length,
        sessions,
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

/**
 * @swagger
 * /sessions/{id}:
 *   get:
 *     summary: Get session by ID
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Session ID
 *     responses:
 *       200:
 *         description: Session retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not your session
 *       404:
 *         description: Session not found
 *       500:
 *         description: Server error
 */
router.get(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      const session = await Session.findById(req.params.id)
        .populate('aiMentor', 'name avatar bio specialization experienceLevel')
        .populate('user', 'firstName lastName profilePicture');
      
      if (!session) {
        return res.status(404).json({ message: 'Session not found' });
      }
      
      // Check if the session belongs to the user
      if (session.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden - Not your session' });
      }
      
      res.status(200).json({
        message: 'Session retrieved successfully',
        session,
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

/**
 * @swagger
 * /sessions:
 *   post:
 *     summary: Create a new session
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - aiMentor
 *               - title
 *               - startTime
 *               - duration
 *             properties:
 *               aiMentor:
 *                 type: string
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               duration:
 *                 type: number
 *               topics:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Session created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: AI Mentor not found
 *       500:
 *         description: Server error
 */
router.post(
  '/',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      const { aiMentor, title, description, startTime, duration, topics } = req.body;
      
      // Check if AI Mentor exists
      const mentor = await AIMentor.findById(aiMentor);
      if (!mentor) {
        return res.status(404).json({ message: 'AI Mentor not found' });
      }
      
      // Create new session
      const session = new Session({
        user: req.user._id,
        aiMentor,
        title,
        description,
        startTime,
        duration,
        topics,
      });
      
      await session.save();
      
      res.status(201).json({
        message: 'Session created successfully',
        session,
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

/**
 * @swagger
 * /sessions/{id}/start:
 *   put:
 *     summary: Start a session
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Session ID
 *     responses:
 *       200:
 *         description: Session started successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not your session
 *       404:
 *         description: Session not found
 *       409:
 *         description: Session already in progress or completed
 *       500:
 *         description: Server error
 */
router.put(
  '/:id/start',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      const session = await Session.findById(req.params.id);
      
      if (!session) {
        return res.status(404).json({ message: 'Session not found' });
      }
      
      // Check if the session belongs to the user
      if (session.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Forbidden - Not your session' });
      }
      
      // Check if session can be started
      if (session.status !== 'scheduled') {
        return res.status(409).json({ message: `Session is already ${session.status}` });
      }
      
      // Update session status
      session.status = 'in_progress';
      await session.save();
      
      res.status(200).json({
        message: 'Session started successfully',
        session,
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

/**
 * @swagger
 * /sessions/{id}/message:
 *   post:
 *     summary: Add a message to a session
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Session ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                     url:
 *                       type: string
 *     responses:
 *       200:
 *         description: Message added successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not your session
 *       404:
 *         description: Session not found
 *       409:
 *         description: Session not in progress
 *       500:
 *         description: Server error
 */
router.post(
  '/:id/message',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      const session = await Session.findById(req.params.id);
      
      if (!session) {
        return res.status(404).json({ message: 'Session not found' });
      }
      
      // Check if the session belongs to the user
      if (session.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Forbidden - Not your session' });
      }
      
      // Check if session is in progress
      if (session.status !== 'in_progress') {
        return res.status(409).json({ message: `Cannot add message to ${session.status} session` });
      }
      
      const { content, attachments } = req.body;
      
      // Add user message
      session.messages.push({
        sender: 'user',
        content,
        timestamp: Date.now(),
        attachments: attachments || [],
      });
      
      await session.save();
      
      // TODO: Integrate with Manus AI API to get AI response
      // For now, simulate AI response
      setTimeout(async () => {
        try {
          session.messages.push({
            sender: 'ai_mentor',
            content: `Thank you for your message. As your AI mentor, I'm here to help with your career development in this area. Could you tell me more about your specific goals?`,
            timestamp: Date.now(),
          });
          
          await session.save();
        } catch (error) {
          console.error('Error adding AI response:', error);
        }
      }, 1000);
      
      res.status(200).json({
        message: 'Message added successfully',
        sessionMessage: session.messages[session.messages.length - 1],
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

/**
 * @swagger
 * /sessions/{id}/complete:
 *   put:
 *     summary: Complete a session
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Session ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               learningOutcomes:
 *                 type: array
 *                 items:
 *                   type: string
 *               nextSteps:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Session completed successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not your session
 *       404:
 *         description: Session not found
 *       409:
 *         description: Session not in progress
 *       500:
 *         description: Server error
 */
router.put(
  '/:id/complete',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      const session = await Session.findById(req.params.id);
      
      if (!session) {
        return res.status(404).json({ message: 'Session not found' });
      }
      
      // Check if the session belongs to the user
      if (session.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Forbidden - Not your session' });
      }
      
      // Check if session is in progress
      if (session.status !== 'in_progress') {
        return res.status(409).json({ message: `Cannot complete ${session.status} session` });
      }
      
      const { learningOutcomes, nextSteps } = req.body;
      
      // Update session
      session.status = 'completed';
      session.endTime = Date.now();
      session.learningOutcomes = learningOutcomes || [];
      session.nextSteps = nextSteps || [];
      
      await session.save();
      
      res.status(200).json({
        message: 'Session completed successfully',
        session,
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

/**
 * @swagger
 * /sessions/{id}/feedback:
 *   post:
 *     summary: Add feedback to a completed session
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Session ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *             properties:
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               comments:
 *                 type: string
 *     responses:
 *       200:
 *         description: Feedback added successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not your session
 *       404:
 *         description: Session not found
 *       409:
 *         description: Session not completed
 *       500:
 *         description: Server error
 */
router.post(
  '/:id/feedback',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      const session = await Session.findById(req.params.id);
      
      if (!session) {
        return res.status(404).json({ message: 'Session not found' });
      }
      
      // Check if the session belongs to the user
      if (session.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Forbidden - Not your session' });
      }
      
      // Check if session is completed
      if (session.status !== 'completed') {
        return res.status(409).json({ message: `Cannot add feedback to ${session.status} session` });
      }
      
      const { rating, comments } = req.body;
      
      // Validate rating
      if (rating < 1 || rating > 5) {
        return res.status(400).json({ message: 'Rating must be between 1 and 5' });
      }
      
      // Add feedback
      session.feedback = {
        rating,
        comments,
        submittedAt: Date.now(),
      };
      
      await session.save();
      
      // Update AI Mentor rating
      const mentor = await AIMentor.findById(session.aiMentor);
      if (mentor) {
        const newReviewCount = mentor.reviewCount + 1;
        const newRating = ((mentor.rating * mentor.reviewCount) + rating) / newReviewCount;
        
        mentor.rating = newRating;
        mentor.reviewCount = newReviewCount;
        
        await mentor.save();
      }
      
      res.status(200).json({
        message: 'Feedback added successfully',
        feedback: session.feedback,
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

/**
 * @swagger
 * /sessions/{id}/cancel:
 *   put:
 *     summary: Cancel a session
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Session ID
 *     responses:
 *       200:
 *         description: Session cancelled successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not your session
 *       404:
 *         description: Session not found
 *       409:
 *         description: Session cannot be cancelled
 *       500:
 *         description: Server error
 */
router.put(
  '/:id/cancel',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      const session = await Session.findById(req.params.id);
      
      if (!session) {
        return res.status(404).json({ message: 'Session not found' });
      }
      
      // Check if the session belongs to the user
      if (session.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Forbidden - Not your session' });
      }
      
      // Check if session can be cancelled
      if (session.status !== 'scheduled') {
        return res.status(409).json({ message: `Cannot cancel ${session.status} session` });
      }
      
      // Update session status
      session.status = 'cancelled';
      await session.save();
      
      res.status(200).json({
        message: 'Session cancelled successfully',
        session,
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

module.exports = router;
