const Mission = require('../models/Mission');
const UserMission = require('../models/UserMission');
const User = require('../models/User');
const AIMentor = require('../models/AIMentor');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

// Get all mission templates
exports.getMissionTemplates = async (req, res) => {
  try {
    const { 
      search, 
      careerField, 
      difficulty, 
      type,
      limit = 20, 
      page = 1 
    } = req.query;
    
    const query = { isTemplate: true, isActive: true };
    
    // Add search filter
    if (search) {
      query.$text = { $search: search };
    }
    
    // Add career field filter
    if (careerField) {
      query.careerFields = careerField;
    }
    
    // Add difficulty filter
    if (difficulty) {
      query.difficulty = difficulty;
    }
    
    // Add type filter
    if (type) {
      query.type = type;
    }
    
    const skip = (page - 1) * limit;
    
    const missions = await Mission.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('careerFields', 'name');
    
    const total = await Mission.countDocuments(query);
    
    res.json({ 
      success: true, 
      missions,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching mission templates:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get mission template by ID
exports.getMissionTemplate = async (req, res) => {
  try {
    const mission = await Mission.findOne({ 
      _id: req.params.id,
      isTemplate: true,
      isActive: true
    }).populate('careerFields', 'name');
    
    if (!mission) {
      return res.status(404).json({ message: 'Mission template not found' });
    }
    
    res.json({ success: true, mission });
  } catch (error) {
    console.error('Error fetching mission template:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create mission template (admin only)
exports.createMissionTemplate = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const {
      title,
      description,
      type,
      difficulty,
      estimatedDuration,
      careerFields,
      skills,
      steps,
      rewards
    } = req.body;
    
    // Create new mission template
    const newMission = new Mission({
      title,
      description,
      type,
      difficulty,
      estimatedDuration,
      careerFields,
      skills,
      steps,
      rewards,
      isTemplate: true,
      createdBy: req.user.id
    });
    
    const mission = await newMission.save();
    
    res.json({ success: true, mission });
  } catch (error) {
    console.error('Error creating mission template:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update mission template (admin only)
exports.updateMissionTemplate = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const mission = await Mission.findOne({ 
      _id: req.params.id,
      isTemplate: true
    });
    
    if (!mission) {
      return res.status(404).json({ message: 'Mission template not found' });
    }
    
    // Update fields
    const updateFields = {};
    for (const [key, value] of Object.entries(req.body)) {
      if (key !== 'isTemplate' && key !== 'createdBy') {
        updateFields[key] = value;
      }
    }
    
    const updatedMission = await Mission.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true }
    );
    
    res.json({ success: true, mission: updatedMission });
  } catch (error) {
    console.error('Error updating mission template:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete mission template (admin only)
exports.deleteMissionTemplate = async (req, res) => {
  try {
    const mission = await Mission.findOne({ 
      _id: req.params.id,
      isTemplate: true
    });
    
    if (!mission) {
      return res.status(404).json({ message: 'Mission template not found' });
    }
    
    // Soft delete by setting isActive to false
    mission.isActive = false;
    await mission.save();
    
    res.json({ success: true, message: 'Mission template deleted' });
  } catch (error) {
    console.error('Error deleting mission template:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Assign mission to user
exports.assignMission = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors)
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const { userId, mentorId } = req.body;
    const { id: missionId } = req.params;
    
    // Check if mission exists
    const mission = await Mission.findOne({ 
      _id: missionId,
      isActive: true
    });
    
    if (!mission) {
      return res.status(404).json({ message: 'Mission not found' });
    }
    
    // Check if user exists
    const user = await User.findById(userId || req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if mentor exists if provided
    let mentor = null;
    if (mentorId) {
      mentor = await AIMentor.findOne({ 
        _id: mentorId,
        isActive: true
      });
      
      if (!mentor) {
        return res.status(404).json({ message: 'Mentor not found' });
      }
    }
    
    // Check if user already has this mission
    const existingMission = await UserMission.findOne({
      user: userId || req.user.id,
      mission: missionId
    });
    
    if (existingMission) {
      return res.status(400).json({ message: 'Mission already assigned to user' });
    }
    
    // Create user mission
    const userMission = new UserMission({
      user: userId || req.user.id,
      mission: missionId,
      mentor: mentorId,
      stepProgress: mission.steps.map((step, index) => ({
        stepIndex: index,
        completed: false
      }))
    });
    
    await userMission.save();
    
    res.json({ 
      success: true, 
      message: 'Mission assigned successfully',
      userMission
    });
  } catch (error) {
    console.error('Error assigning mission:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user missions
exports.getUserMissions = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;
    const { status, limit = 20, page = 1 } = req.query;
    
    const query = { user: userId };
    
    // Add status filter
    if (status) {
      query.status = status;
    }
    
    // Add active filter
    if (req.query.isActive !== undefined) {
      query.isActive = req.query.isActive === 'true';
    }
    
    const skip = (page - 1) * limit;
    
    const userMissions = await UserMission.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('mission')
      .populate('mentor', 'name profileImage');
    
    const total = await UserMission.countDocuments(query);
    
    console.log('userMissions', userMissions);
    res.json({ 
      success: true, 
      missions: userMissions,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching user missions:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user mission by ID
/*
exports.getUserMission = async (req, res) => {
  try {
    const userMission = await UserMission.findOne({
      _id: req.params.id,
      user: req.params.userId || req.user.id
    })
    .populate('mission')
    .populate('mentor', 'name profileImage');
    
    if (!userMission) {
      return res.status(404).json({ message: 'User mission not found' });
    }
    
    res.json({ success: true, mission: userMission });
  } catch (error) {
    console.error('Error fetching user mission:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
*/

exports.getUserMission = async (req, res) => {
  try {
    const missionId = req.params.id;
    
    // Handle special keywords
    if (missionId === 'my-missions') {
      // Get all missions for the current user with optional status filter
      const { status } = req.query;
      const query = { user: req.user.id };
      
      if (status) {
        query.status = status;
      }
      
      const userMissions = await UserMission.find(query)
        .sort({ createdAt: -1 })
        .populate('mission')
        .populate('mentor', 'name profileImage');
      
      return res.json({ success: true, missions: userMissions });
    }
    
    // Validate if the ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(missionId)) {
      return res.status(400).json({ message: 'Invalid mission ID format' });
    }
    
    // Regular mission lookup by ID
    let userMission = await UserMission.findOne({
      _id: missionId,
      user: req.user.id
    })
    .populate('mission')
    .populate('mentor', 'name profileImage');

    if (!userMission) {
      // If not found by userMissionId, try to find by missionId
      userMission = await UserMission.findOne({
        mission: missionId,
        user: req.user.id
      })
      .populate('mission')
      .populate('mentor', 'name profileImage');
    }
    
    if (!userMission) {
      return res.status(404).json({ message: 'User mission not found' });
    }
    
    res.json({ success: true, mission: userMission });
  } catch (error) {
    console.error('Error fetching user mission:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update user mission progress
exports.updateMissionProgress = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const { stepIndex, completed, notes, evidence } = req.body;
    
    // Find user mission
    const userMission = await UserMission.findOne({
      _id: req.params.id,
      user: req.user.id
    }).populate('mission');
    
    if (!userMission) {
      return res.status(404).json({ message: 'User mission not found' });
    }
    
    // Check if mission is still active
    if (!userMission.isActive) {
      return res.status(400).json({ message: 'Mission is no longer active' });
    }
    
    // Check if mission is already completed
    if (userMission.status === 'completed') {
      return res.status(400).json({ message: 'Mission is already completed' });
    }
    
    // Check if step index is valid
    if (stepIndex < 0 || stepIndex >= userMission.mission.steps.length) {
      return res.status(400).json({ message: 'Invalid step index' });
    }
    
    // Update step progress
    const stepProgress = userMission.stepProgress.find(
      step => step.stepIndex === stepIndex
    );
    
    if (stepProgress) {
      stepProgress.completed = completed;
      if (completed) {
        stepProgress.completedAt = Date.now();
      } else {
        stepProgress.completedAt = undefined;
      }
      if (notes) stepProgress.notes = notes;
      if (evidence) stepProgress.evidence = evidence;
    } else {
      userMission.stepProgress.push({
        stepIndex,
        completed,
        completedAt: completed ? Date.now() : undefined,
        notes,
        evidence
      });
    }
    
    // Update overall progress
    const completedSteps = userMission.stepProgress.filter(step => step.completed).length;
    userMission.progress = Math.round((completedSteps / userMission.mission.steps.length) * 100);
    
    // Update status
    if (userMission.progress === 100) {
      userMission.status = 'completed';
      userMission.completedAt = Date.now();
    } else if (userMission.status === 'assigned') {
      userMission.status = 'in_progress';
    }
    
    await userMission.save();
    
    res.json({ 
      success: true, 
      message: 'Mission progress updated',
      mission: userMission
    });
  } catch (error) {
    console.error('Error updating mission progress:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Submit mission feedback
exports.submitMissionFeedback = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const { rating, comments } = req.body;
    
    // Find user mission
    const userMission = await UserMission.findOne({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!userMission) {
      return res.status(404).json({ message: 'User mission not found' });
    }
    
    // Check if mission is completed
    if (userMission.status !== 'completed') {
      return res.status(400).json({ message: 'Mission must be completed before submitting feedback' });
    }
    
    // Update feedback
    userMission.feedback = {
      rating,
      comments,
      submittedAt: Date.now()
    };
    
    await userMission.save();
    
    res.json({ 
      success: true, 
      message: 'Mission feedback submitted',
      mission: userMission
    });
  } catch (error) {
    console.error('Error submitting mission feedback:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Submit mentor feedback for mission
exports.submitMentorFeedback = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const { content } = req.body;
    
    // Find user mission
    const userMission = await UserMission.findById(req.params.id);
    
    if (!userMission) {
      return res.status(404).json({ message: 'User mission not found' });
    }
    
    // Check if user is admin or the assigned mentor
    const isAdmin = req.user.role === 'admin';
    const isMentor = userMission.mentor && userMission.mentor.toString() === req.user.id;
    
    if (!isAdmin && !isMentor) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    // Update mentor feedback
    userMission.mentorFeedback = {
      content,
      submittedAt: Date.now()
    };
    
    await userMission.save();
    
    res.json({ 
      success: true, 
      message: 'Mentor feedback submitted',
      mission: userMission
    });
  } catch (error) {
    console.error('Error submitting mentor feedback:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Abandon mission
exports.abandonMission = async (req, res) => {
  try {
    // Find user mission
    const userMission = await UserMission.findOne({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!userMission) {
      return res.status(404).json({ message: 'User mission not found' });
    }
    
    // Check if mission is already completed or abandoned
    if (userMission.status === 'completed' || userMission.status === 'abandoned') {
      return res.status(400).json({ message: `Mission is already ${userMission.status}` });
    }
    
    // Update status
    userMission.status = 'abandoned';
    userMission.isActive = false;
    
    await userMission.save();
    
    res.json({ 
      success: true, 
      message: 'Mission abandoned',
      mission: userMission
    });
  } catch (error) {
    console.error('Error abandoning mission:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get recommended missions for user
exports.getRecommendedMissions = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;
    
    // Get user
    const user = await User.findById(userId).populate('careerField');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get user's completed missions
    const completedMissions = await UserMission.find({
      user: userId,
      status: 'completed'
    }).select('mission');
    
    const completedMissionIds = completedMissions.map(m => m.mission);
    
    // Get user's active missions
    const activeMissions = await UserMission.find({
      user: userId,
      isActive: true
    }).select('mission');
    
    const activeMissionIds = activeMissions.map(m => m.mission);
    
    // Build query for recommended missions
    const query = {
      isTemplate: true,
      isActive: true,
      _id: { $nin: [...completedMissionIds, ...activeMissionIds] }
    };
    
    // Add career field filter if user has one
    if (user.careerField) {
      query.careerFields = user.careerField;
    }
    
    // Get recommended missions
    const recommendedMissions = await Mission.find(query)
      .sort({ difficulty: 1 })
      .limit(5)
      .populate('careerFields', 'name');
    
    res.json({ 
      success: true, 
      missions: recommendedMissions
    });
  } catch (error) {
    console.error('Error getting recommended missions:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAvailableMissions = async (req, res) => {
  try {
    const { 
      search, 
      careerField, 
      difficulty, 
      type,
      limit = 20, 
      page = 1 
    } = req.query;

    const userId = req.user.id;

    // Get all mission IDs assigned to the user
    const assignedMissions = await UserMission.find({ user: userId }).select('mission');
    const assignedMissionIds = assignedMissions.map(um => um.mission);

    const query = { 
      isActive: true,
      _id: { $nin: assignedMissionIds } // Exclude assigned missions
    };
    
    // Add search filter
    if (search) {
      query.$text = { $search: search };
    }
    
    // Add career field filter
    if (careerField) {
      query.careerFields = careerField;
    }
    
    // Add difficulty filter
    if (difficulty) {
      query.difficulty = difficulty;
    }
    
    // Add type filter
    if (type) {
      query.type = type;
    }
    
    const skip = (page - 1) * limit;
    
    const missions = await Mission.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('careerFields', 'name');
    
    const total = await Mission.countDocuments(query);
    console.log('missions',missions);
    res.json({ 
      success: true, 
      missions,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching available missions:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getMissionCategories = async (req, res) => {
  try {
    const categories = await Mission.distinct('type');
    res.json({ success: true, categories });
  } catch (error) {
    console.error('Error fetching mission categories:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

