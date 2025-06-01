const Protocol = require('../models/Protocol');
const UserProtocol = require('../models/UserProtocol');
const User = require('../models/User');
const AIMentor = require('../models/AIMentor');
const Mission = require('../models/Mission');
const { validationResult } = require('express-validator');

// Get all protocol templates
exports.getProtocolTemplates = async (req, res) => {
  try {
    const { 
      search, 
      careerField, 
      targetLevel,
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
    
    // Add target level filter
    if (targetLevel) {
      query.targetLevel = targetLevel;
    }
    
    const skip = (page - 1) * limit;
    
    const protocols = await Protocol.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('careerFields', 'name');
    
    const total = await Protocol.countDocuments(query);
    
    res.json({ 
      success: true, 
      protocols,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching protocol templates:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get protocol template by ID
exports.getProtocolTemplate = async (req, res) => {
  try {
    const protocol = await Protocol.findOne({ 
      _id: req.params.id,
      isTemplate: true,
      isActive: true
    })
    .populate('careerFields', 'name')
    .populate('phases.milestones.missions');
    
    if (!protocol) {
      return res.status(404).json({ message: 'Protocol template not found' });
    }
    
    res.json({ success: true, protocol });
  } catch (error) {
    console.error('Error fetching protocol template:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create protocol template (admin only)
exports.createProtocolTemplate = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const {
      title,
      description,
      careerFields,
      targetLevel,
      estimatedDuration,
      phases,
      learningOutcomes,
      skillsGained,
      prerequisites
    } = req.body;
    
    // Create new protocol template
    const newProtocol = new Protocol({
      title,
      description,
      careerFields,
      targetLevel,
      estimatedDuration,
      phases,
      learningOutcomes,
      skillsGained,
      prerequisites,
      isTemplate: true,
      createdBy: req.user.id
    });
    
    const protocol = await newProtocol.save();
    
    res.json({ success: true, protocol });
  } catch (error) {
    console.error('Error creating protocol template:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update protocol template (admin only)
exports.updateProtocolTemplate = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const protocol = await Protocol.findOne({ 
      _id: req.params.id,
      isTemplate: true
    });
    
    if (!protocol) {
      return res.status(404).json({ message: 'Protocol template not found' });
    }
    
    // Update fields
    const updateFields = {};
    for (const [key, value] of Object.entries(req.body)) {
      if (key !== 'isTemplate' && key !== 'createdBy') {
        updateFields[key] = value;
      }
    }
    
    const updatedProtocol = await Protocol.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true }
    );
    
    res.json({ success: true, protocol: updatedProtocol });
  } catch (error) {
    console.error('Error updating protocol template:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete protocol template (admin only)
exports.deleteProtocolTemplate = async (req, res) => {
  try {
    const protocol = await Protocol.findOne({ 
      _id: req.params.id,
      isTemplate: true
    });
    
    if (!protocol) {
      return res.status(404).json({ message: 'Protocol template not found' });
    }
    
    // Soft delete by setting isActive to false
    protocol.isActive = false;
    await protocol.save();
    
    res.json({ success: true, message: 'Protocol template deleted' });
  } catch (error) {
    console.error('Error deleting protocol template:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Assign protocol to user
exports.assignProtocol = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const { 
      protocolId, 
      userId, 
      mentorId,
      customizations 
    } = req.body;
    
    // Check if protocol exists
    const protocol = await Protocol.findOne({ 
      _id: protocolId,
      isActive: true
    });
    
    if (!protocol) {
      return res.status(404).json({ message: 'Protocol not found' });
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
    
    // Check if user already has this protocol
    const existingProtocol = await UserProtocol.findOne({
      user: userId || req.user.id,
      protocol: protocolId
    });
    
    if (existingProtocol) {
      return res.status(400).json({ message: 'Protocol already assigned to user' });
    }
    
    // Create phase progress array
    const phaseProgress = protocol.phases.map((phase, phaseIndex) => ({
      phaseIndex,
      progress: 0,
      milestoneProgress: phase.milestones.map((milestone, milestoneIndex) => ({
        milestoneIndex,
        completed: false
      }))
    }));
    
    // Create user protocol
    const userProtocol = new UserProtocol({
      user: userId || req.user.id,
      protocol: protocolId,
      mentor: mentorId,
      phaseProgress,
      customizations
    });
    
    await userProtocol.save();
    
    res.json({ 
      success: true, 
      message: 'Protocol assigned successfully',
      userProtocol
    });
  } catch (error) {
    console.error('Error assigning protocol:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user protocols
exports.getUserProtocols = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;
    const { status, isActive = true, limit = 20, page = 1 } = req.query;
    
    const query = { user: userId };
    
    // Add status filter
    if (status) {
      query.status = status;
    }
    
    // Add active filter
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    
    const skip = (page - 1) * limit;
    
    const userProtocols = await UserProtocol.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('protocol', 'title description targetLevel estimatedDuration')
      .populate('mentor', 'name profileImage');
    
    const total = await UserProtocol.countDocuments(query);
    
    res.json({ 
      success: true, 
      protocols: userProtocols,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching user protocols:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user protocol by ID
exports.getUserProtocol = async (req, res) => {
  try {
    const userProtocol = await UserProtocol.findOne({
      _id: req.params.id,
      user: req.params.userId || req.user.id
    })
    .populate({
      path: 'protocol',
      populate: {
        path: 'phases.milestones.missions',
        model: 'Mission'
      }
    })
    .populate('mentor', 'name profileImage');
    
    if (!userProtocol) {
      return res.status(404).json({ message: 'User protocol not found' });
    }
    
    res.json({ success: true, protocol: userProtocol });
  } catch (error) {
    console.error('Error fetching user protocol:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update milestone completion
exports.updateMilestoneCompletion = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const { phaseIndex, milestoneIndex, completed } = req.body;
    
    // Find user protocol
    const userProtocol = await UserProtocol.findOne({
      _id: req.params.id,
      user: req.user.id
    }).populate('protocol');
    
    if (!userProtocol) {
      return res.status(404).json({ message: 'User protocol not found' });
    }
    
    // Check if protocol is still active
    if (!userProtocol.isActive) {
      return res.status(400).json({ message: 'Protocol is no longer active' });
    }
    
    // Check if protocol is already completed
    if (userProtocol.status === 'completed') {
      return res.status(400).json({ message: 'Protocol is already completed' });
    }
    
    // Check if phase index is valid
    if (phaseIndex < 0 || phaseIndex >= userProtocol.protocol.phases.length) {
      return res.status(400).json({ message: 'Invalid phase index' });
    }
    
    // Check if milestone index is valid
    if (milestoneIndex < 0 || milestoneIndex >= userProtocol.protocol.phases[phaseIndex].milestones.length) {
      return res.status(400).json({ message: 'Invalid milestone index' });
    }
    
    // Update milestone completion
    const phase = userProtocol.phaseProgress.find(p => p.phaseIndex === phaseIndex);
    if (!phase) {
      return res.status(400).json({ message: 'Phase progress not found' });
    }
    
    const milestone = phase.milestoneProgress.find(m => m.milestoneIndex === milestoneIndex);
    if (!milestone) {
      return res.status(400).json({ message: 'Milestone progress not found' });
    }
    
    milestone.completed = completed;
    if (completed) {
      milestone.completedAt = Date.now();
    } else {
      milestone.completedAt = undefined;
    }
    
    // Update phase progress
    const totalMilestones = phase.milestoneProgress.length;
    const completedMilestones = phase.milestoneProgress.filter(m => m.completed).length;
    phase.progress = Math.round((completedMilestones / totalMilestones) * 100);
    
    // Update overall progress
    let totalPhaseProgress = 0;
    userProtocol.phaseProgress.forEach(p => {
      totalPhaseProgress += p.progress;
    });
    userProtocol.progress = Math.round(totalPhaseProgress / userProtocol.phaseProgress.length);
    
    // Update status
    if (userProtocol.progress === 100) {
      userProtocol.status = 'completed';
      userProtocol.completedAt = Date.now();
    } else if (userProtocol.status === 'assigned') {
      userProtocol.status = 'in_progress';
    }
    
    await userProtocol.save();
    
    res.json({ 
      success: true, 
      message: 'Milestone completion updated',
      protocol: userProtocol
    });
  } catch (error) {
    console.error('Error updating milestone completion:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update protocol customizations
exports.updateCustomizations = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const { customizations } = req.body;
    
    // Find user protocol
    const userProtocol = await UserProtocol.findOne({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!userProtocol) {
      return res.status(404).json({ message: 'User protocol not found' });
    }
    
    // Check if protocol is still active
    if (!userProtocol.isActive) {
      return res.status(400).json({ message: 'Protocol is no longer active' });
    }
    
    // Update customizations
    userProtocol.customizations = {
      ...userProtocol.customizations,
      ...customizations
    };
    
    await userProtocol.save();
    
    res.json({ 
      success: true, 
      message: 'Protocol customizations updated',
      protocol: userProtocol
    });
  } catch (error) {
    console.error('Error updating protocol customizations:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Abandon protocol
exports.abandonProtocol = async (req, res) => {
  try {
    // Find user protocol
    const userProtocol = await UserProtocol.findOne({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!userProtocol) {
      return res.status(404).json({ message: 'User protocol not found' });
    }
    
    // Check if protocol is already completed or abandoned
    if (userProtocol.status === 'completed' || userProtocol.status === 'abandoned') {
      return res.status(400).json({ message: `Protocol is already ${userProtocol.status}` });
    }
    
    // Update status
    userProtocol.status = 'abandoned';
    userProtocol.isActive = false;
    
    await userProtocol.save();
    
    res.json({ 
      success: true, 
      message: 'Protocol abandoned',
      protocol: userProtocol
    });
  } catch (error) {
    console.error('Error abandoning protocol:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get recommended protocols for user
exports.getRecommendedProtocols = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;
    
    // Get user
    const user = await User.findById(userId).populate('careerField');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get user's active and completed protocols
    const userProtocols = await UserProtocol.find({
      user: userId
    }).select('protocol');
    
    const userProtocolIds = userProtocols.map(p => p.protocol);
    
    // Build query for recommended protocols
    const query = {
      isTemplate: true,
      isActive: true,
      _id: { $nin: userProtocolIds }
    };
    
    // Add career field filter if user has one
    if (user.careerField) {
      query.careerFields = user.careerField;
    }
    
    // Get recommended protocols
    const recommendedProtocols = await Protocol.find(query)
      .sort({ targetLevel: 1 })
      .limit(5)
      .populate('careerFields', 'name');
    
    res.json({ 
      success: true, 
      protocols: recommendedProtocols
    });
  } catch (error) {
    console.error('Error getting recommended protocols:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
