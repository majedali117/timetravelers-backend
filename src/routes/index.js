// src/routes/index.js - CORRECTED VERSION
const express = require('express');
const router = express.Router();

// Import routes
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const mentorRoutes = require('./mentorRoutes');
const careerFieldRoutes = require('./careerFieldRoutes');
const learningStyleRoutes = require('./learningStyleRoutes');
const sessionRoutes = require('./sessionRoutes');
const missionRoutes = require('./missionRoutes');
const profileRoutes = require('./profileRoutes');
const matchingRoutes = require('./matchingRoutes');
const protocolRoutes = require('./protocolRoutes');
const analyticsRoutes = require('./analyticsRoutes');
const adminRoutes = require('./adminRoutes');
const aiRoutes = require('./aiRoutes');  // Import AI routes


// Define API routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/mentors', mentorRoutes);
router.use('/career-fields', careerFieldRoutes);
router.use('/learning-styles', learningStyleRoutes);
router.use('/sessions', sessionRoutes);
router.use('/missions', missionRoutes);
router.use('/profile', profileRoutes);
router.use('/matching', matchingRoutes);
router.use('/protocols', protocolRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/admin', adminRoutes);
router.use('/ai', aiRoutes);             // Mount AI routes at /ai

module.exports = router;
