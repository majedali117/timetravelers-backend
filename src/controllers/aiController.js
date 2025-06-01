const ManusAIConfig = require('../models/ManusAIConfig');
const AIMentor = require('../models/AIMentor');
const manusAIClient = require('../services/manusAIClient');
const { validationResult } = require('express-validator');

// Initialize Manus AI client
exports.initializeClient = async (req, res) => {
  try {
    await manusAIClient.initialize();
    res.json({ success: true, message: 'Manus AI client initialized successfully' });
  } catch (error) {
    console.error('Error initializing Manus AI client:', error);
    res.status(500).json({ message: 'Failed to initialize Manus AI client' });
  }
};

// Get Manus AI configuration
exports.getConfig = async (req, res) => {
  try {
    const config = await ManusAIConfig.findOne({ isActive: true });
    
    if (!config) {
      return res.status(404).json({ message: 'No active Manus AI configuration found' });
    }
    
    res.json({ success: true, config });
  } catch (error) {
    console.error('Error fetching Manus AI config:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update Manus AI configuration
exports.updateConfig = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const {
      apiKey,
      apiEndpoint,
      rateLimit,
      quotaSettings,
      cacheSettings,
      retrySettings
    } = req.body;
    
    // Find active configuration
    let config = await ManusAIConfig.findOne({ isActive: true });
    
    if (config) {
      // Update existing configuration
      if (apiKey) config.apiKey = apiKey;
      if (apiEndpoint) config.apiEndpoint = apiEndpoint;
      if (rateLimit) config.rateLimit = { ...config.rateLimit, ...rateLimit };
      if (quotaSettings) config.quotaSettings = { ...config.quotaSettings, ...quotaSettings };
      if (cacheSettings) config.cacheSettings = { ...config.cacheSettings, ...cacheSettings };
      if (retrySettings) config.retrySettings = { ...config.retrySettings, ...retrySettings };
      
      config.lastUpdated = Date.now();
      await config.save();
    } else {
      // Create new configuration
      config = new ManusAIConfig({
        apiKey,
        apiEndpoint,
        rateLimit,
        quotaSettings,
        cacheSettings,
        retrySettings
      });
      
      await config.save();
    }
    
    // Re-initialize client with new configuration
    await manusAIClient.initialize();
    
    res.json({ 
      success: true, 
      message: 'Manus AI configuration updated successfully',
      config
    });
  } catch (error) {
    console.error('Error updating Manus AI config:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get usage statistics
exports.getUsageStats = async (req, res) => {
  try {
    const stats = await manusAIClient.getUsageStats();
    res.json({ success: true, stats });
  } catch (error) {
    console.error('Error fetching usage stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Sync AI mentors from Manus AI
exports.syncMentors = async (req, res) => {
  try {
    // Get all mentors from Manus AI
    const mentorsData = await manusAIClient.getAllMentors();
    
    if (!mentorsData || !mentorsData.mentors) {
      return res.status(400).json({ message: 'Invalid response from Manus AI' });
    }
    
    const mentors = mentorsData.mentors;
    const results = {
      total: mentors.length,
      created: 0,
      updated: 0,
      failed: 0
    };
    
    // Process each mentor
    for (const mentorData of mentors) {
      try {
        // Check if mentor already exists
        let mentor = await AIMentor.findOne({ manusAIMentorId: mentorData.id });
        
        if (mentor) {
          // Update existing mentor
          mentor.name = mentorData.name;
          mentor.specialization = mentorData.specialization;
          mentor.bio = mentorData.bio;
          mentor.profileImage = mentorData.profile_image || mentor.profileImage;
          mentor.experienceLevel = mentorData.experience_level || mentor.experienceLevel;
          mentor.skills = mentorData.skills || mentor.skills;
          mentor.teachingStyle = mentorData.teaching_style || mentor.teachingStyle;
          mentor.communicationStyle = mentorData.communication_style || mentor.communicationStyle;
          
          await mentor.save();
          results.updated++;
        } else {
          // Create new mentor
          mentor = new AIMentor({
            name: mentorData.name,
            specialization: mentorData.specialization,
            bio: mentorData.bio,
            profileImage: mentorData.profile_image || '/assets/default-mentor.png',
            manusAIMentorId: mentorData.id,
            experienceLevel: mentorData.experience_level || 'expert',
            skills: mentorData.skills || [],
            teachingStyle: mentorData.teaching_style || 'mentoring',
            communicationStyle: mentorData.communication_style || 'supportive'
          });
          
          await mentor.save();
          results.created++;
        }
      } catch (error) {
        console.error(`Error processing mentor ${mentorData.id}:`, error);
        results.failed++;
      }
    }
    
    res.json({ 
      success: true, 
      message: 'AI mentors synced successfully',
      results
    });
  } catch (error) {
    console.error('Error syncing AI mentors:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get AI mentor by ID
exports.getMentor = async (req, res) => {
  try {
    const mentor = await AIMentor.findById(req.params.id);
    
    if (!mentor) {
      return res.status(404).json({ message: 'AI mentor not found' });
    }
    
    res.json({ success: true, mentor });
  } catch (error) {
    console.error('Error fetching AI mentor:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all AI mentors
exports.getAllMentors = async (req, res) => {
  try {
    const { 
      search, 
      careerField, 
      experienceLevel, 
      teachingStyle,
      limit = 20, 
      page = 1 
    } = req.query;
    
    const query = { isActive: true };
    
    // Add search filter
    if (search) {
      query.$text = { $search: search };
    }
    
    // Add career field filter
    if (careerField) {
      query.careerFields = careerField;
    }
    
    // Add experience level filter
    if (experienceLevel) {
      query.experienceLevel = experienceLevel;
    }
    
    // Add teaching style filter
    if (teachingStyle) {
      query.teachingStyle = teachingStyle;
    }
    
    const skip = (page - 1) * limit;
    
    const mentors = await AIMentor.find(query)
      .sort({ rating: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await AIMentor.countDocuments(query);
    
    res.json({ 
      success: true, 
      mentors,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching AI mentors:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Generate career advice
exports.generateCareerAdvice = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const { userProfile } = req.body;
    
    // Generate career advice
    const advice = await manusAIClient.generateCareerAdvice(userProfile);
    
    res.json({ 
      success: true, 
      advice
    });
  } catch (error) {
    console.error('Error generating career advice:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Generate learning plan
exports.generateLearningPlan = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const { userId, careerGoals, currentSkills } = req.body;
    
    // Generate learning plan
    const plan = await manusAIClient.generateLearningPlan(userId, careerGoals, currentSkills);
    
    res.json({ 
      success: true, 
      plan
    });
  } catch (error) {
    console.error('Error generating learning plan:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
