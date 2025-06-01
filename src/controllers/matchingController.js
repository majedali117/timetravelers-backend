const TELLMatching = require('../models/TELLMatching');
const User = require('../models/User');
const AIMentor = require('../models/AIMentor');
const UserProfile = require('../models/UserProfile');
const CareerGoal = require('../models/CareerGoal');
const LearningAssessment = require('../models/LearningAssessment');
const { validationResult } = require('express-validator');

// Calculate TELL matching scores for a user
exports.calculateMatching = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;
    
    // Get user data
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get user profile
    const userProfile = await UserProfile.findOne({ user: userId });
    if (!userProfile) {
      return res.status(404).json({ message: 'User profile not found' });
    }
    
    // Get user learning assessment
    const learningAssessment = await LearningAssessment.findOne({ 
      user: userId,
      isActive: true
    }).sort({ createdAt: -1 });
    
    // Get user career goals
    const careerGoals = await CareerGoal.find({ user: userId });
    
    // Get all active mentors
    const mentors = await AIMentor.find({ isActive: true });
    
    const matchResults = [];
    
    // Calculate matching score for each mentor
    for (const mentor of mentors) {
      // Calculate career field match
      const careerFieldMatch = calculateCareerFieldMatch(user, mentor);
      
      // Calculate experience level match
      const experienceLevelMatch = calculateExperienceLevelMatch(user, mentor);
      
      // Calculate learning style match
      const learningStyleMatch = calculateLearningStyleMatch(learningAssessment, mentor);
      
      // Calculate skills match
      const skillsMatch = calculateSkillsMatch(userProfile, mentor);
      
      // Calculate career goals match
      const careerGoalsMatch = calculateCareerGoalsMatch(careerGoals, mentor);
      
      // Calculate overall compatibility score
      const compatibilityScore = calculateOverallScore({
        careerFieldMatch,
        experienceLevelMatch,
        learningStyleMatch,
        skillsMatch,
        careerGoalsMatch
      });
      
      // Create or update matching record
      let matching = await TELLMatching.findOne({ user: userId, mentor: mentor._id });
      
      if (matching) {
        matching.compatibilityScore = compatibilityScore;
        matching.matchFactors = {
          careerFieldMatch,
          experienceLevelMatch,
          learningStyleMatch,
          skillsMatch,
          careerGoalsMatch
        };
        matching.lastCalculated = Date.now();
        await matching.save();
      } else {
        matching = new TELLMatching({
          user: userId,
          mentor: mentor._id,
          compatibilityScore,
          matchFactors: {
            careerFieldMatch,
            experienceLevelMatch,
            learningStyleMatch,
            skillsMatch,
            careerGoalsMatch
          }
        });
        await matching.save();
      }
      
      matchResults.push({
        mentorId: mentor._id,
        mentorName: mentor.name,
        compatibilityScore,
        matchFactors: {
          careerFieldMatch,
          experienceLevelMatch,
          learningStyleMatch,
          skillsMatch,
          careerGoalsMatch
        }
      });
    }
    
    res.json({ 
      success: true, 
      matches: matchResults.sort((a, b) => b.compatibilityScore - a.compatibilityScore)
    });
  } catch (error) {
    console.error('Error calculating TELL matching:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get top mentor matches for a user
exports.getTopMatches = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;
    const { limit = 5 } = req.query;
    
    // Get top matches
    const matches = await TELLMatching.find({ user: userId, isActive: true })
      .sort({ compatibilityScore: -1 })
      .limit(parseInt(limit))
      .populate('mentor', 'name specialization bio profileImage experienceLevel skills rating');
    
    res.json({ success: true, matches });
  } catch (error) {
    console.error('Error getting top matches:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get matching details for a specific mentor
exports.getMentorMatch = async (req, res) => {
  try {
    const userId = req.user.id;
    const mentorId = req.params.mentorId;
    
    // Get matching details
    const match = await TELLMatching.findOne({ 
      user: userId, 
      mentor: mentorId,
      isActive: true
    }).populate('mentor', 'name specialization bio profileImage experienceLevel skills rating');
    
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }
    
    res.json({ success: true, match });
  } catch (error) {
    console.error('Error getting mentor match:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Run matching algorithm for all users (admin only)
exports.runBatchMatching = async (req, res) => {
  try {
    const { userIds } = req.body;
    
    let users;
    if (userIds && userIds.length > 0) {
      // Match specific users
      users = await User.find({ _id: { $in: userIds } });
    } else {
      // Match all users
      users = await User.find();
    }
    
    const results = {
      total: users.length,
      processed: 0,
      failed: 0
    };
    
    // Process each user in background
    process.nextTick(async () => {
      for (const user of users) {
        try {
          await processUserMatching(user._id);
          results.processed++;
        } catch (error) {
          console.error(`Error processing matching for user ${user._id}:`, error);
          results.failed++;
        }
      }
      
      console.log('Batch matching completed:', results);
    });
    
    res.json({ 
      success: true, 
      message: 'Batch matching started',
      totalUsers: users.length
    });
  } catch (error) {
    console.error('Error running batch matching:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Helper function to process matching for a single user
async function processUserMatching(userId) {
  // Get user data
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }
  
  // Get user profile
  const userProfile = await UserProfile.findOne({ user: userId });
  if (!userProfile) {
    throw new Error('User profile not found');
  }
  
  // Get user learning assessment
  const learningAssessment = await LearningAssessment.findOne({ 
    user: userId,
    isActive: true
  }).sort({ createdAt: -1 });
  
  // Get user career goals
  const careerGoals = await CareerGoal.find({ user: userId });
  
  // Get all active mentors
  const mentors = await AIMentor.find({ isActive: true });
  
  // Calculate matching score for each mentor
  for (const mentor of mentors) {
    // Calculate career field match
    const careerFieldMatch = calculateCareerFieldMatch(user, mentor);
    
    // Calculate experience level match
    const experienceLevelMatch = calculateExperienceLevelMatch(user, mentor);
    
    // Calculate learning style match
    const learningStyleMatch = calculateLearningStyleMatch(learningAssessment, mentor);
    
    // Calculate skills match
    const skillsMatch = calculateSkillsMatch(userProfile, mentor);
    
    // Calculate career goals match
    const careerGoalsMatch = calculateCareerGoalsMatch(careerGoals, mentor);
    
    // Calculate overall compatibility score
    const compatibilityScore = calculateOverallScore({
      careerFieldMatch,
      experienceLevelMatch,
      learningStyleMatch,
      skillsMatch,
      careerGoalsMatch
    });
    
    // Create or update matching record
    let matching = await TELLMatching.findOne({ user: userId, mentor: mentor._id });
    
    if (matching) {
      matching.compatibilityScore = compatibilityScore;
      matching.matchFactors = {
        careerFieldMatch,
        experienceLevelMatch,
        learningStyleMatch,
        skillsMatch,
        careerGoalsMatch
      };
      matching.lastCalculated = Date.now();
      await matching.save();
    } else {
      matching = new TELLMatching({
        user: userId,
        mentor: mentor._id,
        compatibilityScore,
        matchFactors: {
          careerFieldMatch,
          experienceLevelMatch,
          learningStyleMatch,
          skillsMatch,
          careerGoalsMatch
        }
      });
      await matching.save();
    }
  }
  
  return true;
}

// Helper function to calculate career field match
function calculateCareerFieldMatch(user, mentor) {
  if (!user.careerField || !mentor.careerFields || mentor.careerFields.length === 0) {
    return 50; // Neutral score if no data
  }
  
  // Check if user's career field is in mentor's fields
  const isExactMatch = mentor.careerFields.some(field => 
    field.toString() === user.careerField.toString()
  );
  
  return isExactMatch ? 100 : 30;
}

// Helper function to calculate experience level match
function calculateExperienceLevelMatch(user, mentor) {
  const careerStageToLevel = {
    'student': 1,
    'early_career': 2,
    'mid_career': 3,
    'senior': 4
  };
  
  const mentorLevelToScore = {
    'beginner': 1,
    'intermediate': 2,
    'advanced': 3,
    'expert': 4
  };
  
  const userLevel = careerStageToLevel[user.careerStage] || 1;
  const mentorLevel = mentorLevelToScore[mentor.experienceLevel] || 4;
  
  // Ideal mentor is 1-2 levels above user
  const levelDifference = mentorLevel - userLevel;
  
  if (levelDifference === 1 || levelDifference === 2) {
    return 100; // Perfect match
  } else if (levelDifference === 0) {
    return 70; // Same level
  } else if (levelDifference > 2) {
    return 50; // Mentor too advanced
  } else {
    return 30; // Mentor less experienced than user
  }
}

// Helper function to calculate learning style match
function calculateLearningStyleMatch(learningAssessment, mentor) {
  if (!learningAssessment || !mentor.learningStyleCompatibility) {
    return 50; // Neutral score if no data
  }
  
  const userStyles = learningAssessment.learningStyleResults;
  const mentorCompatibility = mentor.learningStyleCompatibility;
  
  // Calculate weighted score based on user's dominant style
  let totalScore = 0;
  let totalWeight = 0;
  
  for (const style of ['visual', 'auditory', 'reading', 'kinesthetic']) {
    const userScore = userStyles[style] || 0;
    const mentorScore = mentorCompatibility[style] || 5;
    
    // Weight by user's preference for this style
    const weight = userScore / 100;
    totalScore += (mentorScore / 10) * 100 * weight;
    totalWeight += weight;
  }
  
  // Normalize score
  return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 50;
}

// Helper function to calculate skills match
function calculateSkillsMatch(userProfile, mentor) {
  if (!userProfile.skills || userProfile.skills.length === 0 || 
      !mentor.skills || mentor.skills.length === 0) {
    return 50; // Neutral score if no data
  }
  
  const userSkills = userProfile.skills.map(skill => skill.name.toLowerCase());
  const mentorSkills = mentor.skills.map(skill => skill.toLowerCase());
  
  // Count matching skills
  let matchCount = 0;
  for (const skill of userSkills) {
    if (mentorSkills.includes(skill)) {
      matchCount++;
    }
  }
  
  // Calculate percentage of user skills covered by mentor
  const coverage = userSkills.length > 0 ? (matchCount / userSkills.length) : 0;
  
  return Math.round(coverage * 100);
}

// Helper function to calculate career goals match
function calculateCareerGoalsMatch(careerGoals, mentor) {
  if (!careerGoals || careerGoals.length === 0) {
    return 50; // Neutral score if no data
  }
  
  // Extract all skills from career goals
  const goalSkills = new Set();
  for (const goal of careerGoals) {
    if (goal.relatedSkills && goal.relatedSkills.length > 0) {
      goal.relatedSkills.forEach(skill => goalSkills.add(skill.toLowerCase()));
    }
  }
  
  // Convert to array
  const goalSkillsArray = Array.from(goalSkills);
  
  // Get mentor skills
  const mentorSkills = mentor.skills.map(skill => skill.toLowerCase());
  
  // Count matching skills
  let matchCount = 0;
  for (const skill of goalSkillsArray) {
    if (mentorSkills.includes(skill)) {
      matchCount++;
    }
  }
  
  // Calculate percentage of goal skills covered by mentor
  const coverage = goalSkillsArray.length > 0 ? (matchCount / goalSkillsArray.length) : 0;
  
  return Math.round(coverage * 100);
}

// Helper function to calculate overall compatibility score
function calculateOverallScore(factors) {
  // Weights for each factor (must sum to 1)
  const weights = {
    careerFieldMatch: 0.3,
    experienceLevelMatch: 0.2,
    learningStyleMatch: 0.2,
    skillsMatch: 0.15,
    careerGoalsMatch: 0.15
  };
  
  // Calculate weighted sum
  let score = 0;
  for (const [factor, value] of Object.entries(factors)) {
    score += value * weights[factor];
  }
  
  return Math.round(score);
}
