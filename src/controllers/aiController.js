const AIMentor = require('../models/AIMentor');
const geminiAIService = require('../services/geminiAIService');
const CareerAdvice = require('../models/CareerAdvice');
const { validationResult } = require('express-validator');

// Initialize Gemini AI service
exports.initializeService = async (req, res) => {
  try {
    await geminiAIService.initialize();
    res.json({ success: true, message: 'Google Gemini AI service initialized successfully' });
  } catch (error) {
    console.error('Error initializing Gemini AI service:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to initialize Gemini AI service',
      error: error.message 
    });
  }
};

// Get usage statistics
exports.getUsageStats = async (req, res) => {
  try {
    const stats = await geminiAIService.getUsageStats();
    res.json({ success: true, stats });
  } catch (error) {
    console.error('Error fetching usage stats:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch usage statistics',
      error: error.message 
    });
  }
};

// Sync AI mentors (now loads static mentor profiles)
exports.syncMentors = async (req, res) => {
  try {
    // Get all mentors from Gemini AI service (static data)
    const mentorsData = await geminiAIService.getAllMentors();
    
    if (!mentorsData || !mentorsData.mentors) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid response from Gemini AI service' 
      });
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
        let mentor = await AIMentor.findOne({ geminiMentorId: mentorData.id });
        
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
          mentor.lastSyncedAt = new Date();
          
          await mentor.save();
          results.updated++;
        } else {
          // Create new mentor
          mentor = new AIMentor({
            name: mentorData.name,
            specialization: mentorData.specialization,
            bio: mentorData.bio,
            profileImage: mentorData.profile_image || '/assets/default-mentor.png',
            geminiMentorId: mentorData.id, // Changed from manusAIMentorId
            manusAIMentorId: mentorData.id, 
            experienceLevel: mentorData.experience_level || 'expert',
            skills: mentorData.skills || [],
            teachingStyle: mentorData.teaching_style || 'mentoring',
            communicationStyle: mentorData.communication_style || 'supportive',
            rating: 4.5, // Default rating
            reviewCount: 0,
            isActive: true,
            lastSyncedAt: new Date()
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
    res.status(500).json({ 
      success: false,
      message: 'Failed to sync AI mentors',
      error: error.message 
    });
  }
};

// Get AI mentor by ID
exports.getMentor = async (req, res) => {
  try {
    const mentor = await AIMentor.findById(req.params.id);
    
    if (!mentor) {
      return res.status(404).json({ 
        success: false,
        message: 'AI mentor not found' 
      });
    }
    
    res.json({ success: true, mentor });
  } catch (error) {
    console.error('Error fetching AI mentor:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch AI mentor',
      error: error.message 
    });
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
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { careerField: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } },
        { skills: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    if (careerField && mongoose.Types.ObjectId.isValid(careerField)) {
      query.careerFields = careerField;
    }
    
    // Add specialization filter
    if (specialization) {
      query.specialization = { $regex: specialization, $options: 'i' };
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
      .populate('careerFields', 'name') // This will join the name from the CareerField model
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
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch AI mentors',
      error: error.message 
    });
  }
};

// Generate career advice
exports.generateCareerAdvice = async (req, res) => {
  try {
    const userProfile = req.body.userProfile || req.body;
    const { mentorId } = req.body; // Extract mentorId from request body

    if (!userProfile || Object.keys(userProfile).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'User profile is required'
      });
    }

    let aiMentor = null;
    let mentorName = null;

    if (mentorId) {
      const mentor = await AIMentor.findById(mentorId);
      if (mentor) {
        aiMentor = mentor._id;
        mentorName = mentor.name;
      }
    }
    
    // Generate career advice using Gemini AI
    const advice = await geminiAIService.generateCareerAdvice(userProfile);

    // Store the generated advice
    const newCareerAdvice = new CareerAdvice({
      user: req.user.id,
      aiMentor: aiMentor,
      mentorName: mentorName,
      userProfileSnapshot: userProfile,
      adviceContent: advice.advice.content,
      modelUsed: geminiAIService.model.model, // Assuming this is how we get the model name
    });
    await newCareerAdvice.save();
    
    res.json({ 
      success: true, 
      advice
    });
  } catch (error) {
    console.error('Error generating career advice:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to generate career advice',
      error: error.message 
    });
  }
};

// Generate learning plan
exports.generateLearningPlan = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      errors: errors.array() 
    });
  }
  
  try {
    const { userId, careerGoals, currentSkills } = req.body;
    
    // Validate required fields
    if (!careerGoals || !currentSkills) {
      return res.status(400).json({
        success: false,
        message: 'Career goals and current skills are required'
      });
    }
    
    // Generate learning plan using Gemini AI
    const plan = await geminiAIService.generateLearningPlan(userId, careerGoals, currentSkills);
    console.log(plan)
    res.json({ 
      success: true, 
      plan
    });
  } catch (error) {
    console.error('Error generating learning plan:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to generate learning plan',
      error: error.message 
    });
  }
};

// Create AI mentor session
exports.createSession = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      errors: errors.array() 
    });
  }
  
  try {
    const { mentorId, sessionData } = req.body;
    const userId = req.user.id; // Assuming user is authenticated
    
    // Validate mentor exists
    const mentor = await AIMentor.findById(mentorId);
    if (!mentor) {
      return res.status(404).json({
        success: false,
        message: 'AI mentor not found'
      });
    }
    
    // Create session using Gemini AI service
    const session = await geminiAIService.createSession(mentor.geminiMentorId, userId, sessionData);
    
    res.json({ 
      success: true, 
      session: session.session
    });
  } catch (error) {
    console.error('Error creating AI mentor session:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to create AI mentor session',
      error: error.message 
    });
  }
};

// Send message in session
exports.sendMessage = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      errors: errors.array() 
    });
  }
  
  try {
    const { sessionId } = req.params;
    const { message, context } = req.body;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }
    
    // Send message using Gemini AI service
    const response = await geminiAIService.sendMessage(sessionId, message, context);
    
    res.json({ 
      success: true, 
      message: response.message
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to send message',
      error: error.message 
    });
  }
};

// Health check endpoint
exports.healthCheck = async (req, res) => {
  try {
    const stats = await geminiAIService.getUsageStats();
    
    res.json({
      success: true,
      status: 'healthy',
      service: 'Google Gemini AI',
      isInitialized: stats.isInitialized,
      model: stats.model,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      service: 'Google Gemini AI',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

