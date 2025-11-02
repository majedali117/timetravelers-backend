const UserProfile = require('../models/UserProfile');
const User = require('../models/User');
const CareerGoal = require('../models/CareerGoal');
const LearningAssessment = require('../models/LearningAssessment');
const Skill = require('../models/Skill');
const CareerAdvice = require('../models/CareerAdvice');
const { validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');

// Get current user profile
exports.getProfile = async (req, res) => {
  try {
    // Find profile by user ID
    const userProfile = await UserProfile.findOne({ user: req.user.id });
    
    if (!userProfile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    
    res.json({ success: true, profile: userProfile });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create or update user profile
exports.updateProfile = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors.array());
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const {
      bio,
      location,
      education,
      workExperience,
      careerGoals,
      learningPreferences,
      learningStyle,
      experienceLevel,
      skills,
      interests,
      languages,
      socialProfiles,
      preferences,
      visibility
    } = req.body;
    
    // Build profile object
    const profileFields = {};
    profileFields.user = req.user.id;
    if (bio) profileFields.bio = bio;
    if (location) profileFields.location = location;
    if (education) profileFields.education = education;
    if (workExperience) profileFields.workExperience = workExperience;
    if (careerGoals) profileFields.careerGoals = careerGoals;
    if (learningPreferences) profileFields.learningPreferences = learningPreferences;
    if (learningStyle) profileFields.learningStyle = learningStyle;
    if (experienceLevel) profileFields.experienceLevel = experienceLevel;
    if (skills) profileFields.skills = skills;
    if (interests) profileFields.interests = interests;
    if (languages) profileFields.languages = languages;
    if (socialProfiles) profileFields.socialProfiles = socialProfiles;
    if (preferences) profileFields.preferences = preferences;
    if (visibility) profileFields.visibility = visibility;
    
    // Find profile by user ID
    let userProfile = await UserProfile.findOne({ user: req.user.id });
    
    if (userProfile) {
      // Update existing profile
      userProfile = await UserProfile.findOneAndUpdate(
        { user: req.user.id },
        { $set: profileFields },
        { new: true }
      );
    } else {
      // Create new profile
      userProfile = new UserProfile(profileFields);
      await userProfile.save();
    }
    
    res.json({ success: true, profile: userProfile });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Upload profile picture
exports.uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    // Update user with profile picture path
    const user = await User.findById(req.user.id);
    
    // If user already has a profile picture, delete the old one
    if (user.profilePicture) {
      const oldPicturePath = path.join(__dirname, '../../uploads/profile', path.basename(user.profilePicture));
      if (fs.existsSync(oldPicturePath)) {
        fs.unlinkSync(oldPicturePath);
      }
    }
    
    // Set new profile picture path
    user.profilePicture = `/uploads/profile/${req.file.filename}`;
    await user.save();
    
    res.json({ 
      success: true, 
      profilePicture: user.profilePicture 
    });
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user career goals
exports.getCareerGoals = async (req, res) => {
  try {
    const careerGoals = await CareerGoal.find({ user: req.user.id })
      .sort({ createdAt: -1 });
    
    res.json({ success: true, careerGoals });
  } catch (error) {
    console.error('Error fetching career goals:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create career goal
exports.createCareerGoal = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const {
      title,
      description,
      timeframe,
      targetDate,
      status,
      milestones,
      relatedSkills,
      relatedCareerFields,
      priority,
      notes
    } = req.body;
    
    // Create new career goal
    const newCareerGoal = new CareerGoal({
      user: req.user.id,
      title,
      description,
      timeframe,
      targetDate,
      status,
      milestones,
      relatedSkills,
      relatedCareerFields,
      priority,
      notes
    });
    
    const careerGoal = await newCareerGoal.save();
    
    res.json({ success: true, careerGoal });
  } catch (error) {
    console.error('Error creating career goal:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update career goal
exports.updateCareerGoal = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const careerGoal = await CareerGoal.findById(req.params.id);
    
    if (!careerGoal) {
      return res.status(404).json({ message: 'Career goal not found' });
    }
    
    // Check if user owns the career goal
    if (careerGoal.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    // Update fields
    const updateFields = {};
    for (const [key, value] of Object.entries(req.body)) {
      updateFields[key] = value;
    }
    
    const updatedCareerGoal = await CareerGoal.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true }
    );
    
    res.json({ success: true, careerGoal: updatedCareerGoal });
  } catch (error) {
    console.error('Error updating career goal:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete career goal
exports.deleteCareerGoal = async (req, res) => {
  try {
    const careerGoal = await CareerGoal.findById(req.params.id);
    
    if (!careerGoal) {
      return res.status(404).json({ message: 'Career goal not found' });
    }
    
    // Check if user owns the career goal
    if (careerGoal.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    await careerGoal.remove();
    
    res.json({ success: true, message: 'Career goal removed' });
  } catch (error) {
    console.error('Error deleting career goal:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get learning assessment
exports.getLearningAssessment = async (req, res) => {
  try {
    const learningAssessment = await LearningAssessment.findOne({ 
      user: req.user.id,
      isActive: true
    }).sort({ createdAt: -1 });
    
    if (!learningAssessment) {
      return res.status(404).json({ message: 'Learning assessment not found' });
    }
    
    res.json({ success: true, learningAssessment });
  } catch (error) {
    console.error('Error fetching learning assessment:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create learning assessment
exports.createLearningAssessment = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const {
      learningStyleResults,
      learningPreferences,
      notes
    } = req.body;
    
    // Deactivate previous assessments
    await LearningAssessment.updateMany(
      { user: req.user.id, isActive: true },
      { isActive: false }
    );
    
    // Create new learning assessment
    const newLearningAssessment = new LearningAssessment({
      user: req.user.id,
      learningStyleResults,
      learningPreferences,
      notes
    });
    
    const learningAssessment = await newLearningAssessment.save();
    
    res.json({ success: true, learningAssessment });
  } catch (error) {
    console.error('Error creating learning assessment:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get skills
exports.getSkills = async (req, res) => {
  try {
    const { search, category, limit = 20, page = 1 } = req.query;
    
    const query = {};
    if (search) {
      query.$text = { $search: search };
    }
    if (category) {
      query.category = category;
    }
    
    const skip = (page - 1) * limit;
    
    const skills = await Skill.find(query)
      .sort({ popularity: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Skill.countDocuments(query);
    
    res.json({ 
      success: true, 
      skills,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching skills:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Calculate profile completeness
exports.calculateProfileCompleteness = async (req, res) => {
  try {
    const userProfile = await UserProfile.findOne({ user: req.user.id });
    
    if (!userProfile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    
    const completeness = userProfile.calculateProfileCompleteness();
    await userProfile.save();
    
    res.json({ 
      success: true, 
      completeness,
      profile: userProfile
    });
  } catch (error) {
    console.error('Error calculating profile completeness:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user career advice
exports.getCareerAdvice = async (req, res) => {
  try {
    const careerAdvice = await CareerAdvice.find({ user: req.user.id })
      .sort({ generatedAt: -1 })
      .populate('aiMentor', 'name specialization') // Populate mentor details if available
      .populate('sessionId', 'title'); // Populate session title if available
    
    res.json({ success: true, careerAdvice });
  } catch (error) {
    console.error('Error fetching career advice:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
