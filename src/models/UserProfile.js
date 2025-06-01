const mongoose = require('mongoose');

const userProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot be more than 500 characters']
  },
  location: {
    city: String,
    country: String,
    timezone: String
  },
  education: [{
    institution: String,
    degree: String,
    fieldOfStudy: String,
    startDate: Date,
    endDate: Date,
    current: Boolean,
    description: String
  }],
  workExperience: [{
    company: String,
    position: String,
    startDate: Date,
    endDate: Date,
    current: Boolean,
    description: String,
    skills: [String]
  }],
  careerGoals: {
    shortTerm: [String],
    longTerm: [String],
    preferredIndustries: [String],
    preferredRoles: [String]
  },
  learningPreferences: {
    preferredLearningMethods: [{
      type: String,
      enum: ['visual', 'auditory', 'reading', 'kinesthetic', 'social', 'solitary']
    }],
    preferredContentTypes: [{
      type: String,
      enum: ['articles', 'videos', 'podcasts', 'books', 'courses', 'mentoring', 'projects']
    }],
    learningPace: {
      type: String,
      enum: ['slow', 'moderate', 'fast']
    }
  },
  skills: [{
    name: String,
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert']
    },
    yearsOfExperience: Number,
    endorsed: {
      type: Boolean,
      default: false
    }
  }],
  interests: [String],
  languages: [{
    name: String,
    proficiency: {
      type: String,
      enum: ['basic', 'conversational', 'fluent', 'native']
    }
  }],
  socialProfiles: {
    linkedin: String,
    github: String,
    twitter: String,
    portfolio: String,
    other: [{ platform: String, url: String }]
  },
  preferences: {
    emailNotifications: {
      type: Boolean,
      default: true
    },
    pushNotifications: {
      type: Boolean,
      default: true
    },
    sessionReminders: {
      type: Boolean,
      default: true
    },
    missionUpdates: {
      type: Boolean,
      default: true
    },
    mentorMessages: {
      type: Boolean,
      default: true
    },
    weeklyDigest: {
      type: Boolean,
      default: true
    }
  },
  profileCompleteness: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  visibility: {
    type: String,
    enum: ['public', 'private', 'connections'],
    default: 'public'
  }
}, {
  timestamps: true
});

// Method to calculate profile completeness
userProfileSchema.methods.calculateProfileCompleteness = function() {
  let completeness = 0;
  const totalFields = 10; // Total number of major profile sections
  
  // Basic info
  if (this.bio) completeness += 1;
  if (this.location && (this.location.city || this.location.country)) completeness += 1;
  
  // Education
  if (this.education && this.education.length > 0) completeness += 1;
  
  // Work experience
  if (this.workExperience && this.workExperience.length > 0) completeness += 1;
  
  // Career goals
  if (this.careerGoals && 
      ((this.careerGoals.shortTerm && this.careerGoals.shortTerm.length > 0) || 
       (this.careerGoals.longTerm && this.careerGoals.longTerm.length > 0))) {
    completeness += 1;
  }
  
  // Learning preferences
  if (this.learningPreferences && 
      ((this.learningPreferences.preferredLearningMethods && this.learningPreferences.preferredLearningMethods.length > 0) || 
       (this.learningPreferences.preferredContentTypes && this.learningPreferences.preferredContentTypes.length > 0))) {
    completeness += 1;
  }
  
  // Skills
  if (this.skills && this.skills.length > 0) completeness += 1;
  
  // Interests
  if (this.interests && this.interests.length > 0) completeness += 1;
  
  // Languages
  if (this.languages && this.languages.length > 0) completeness += 1;
  
  // Social profiles
  if (this.socialProfiles && 
      (this.socialProfiles.linkedin || this.socialProfiles.github || 
       this.socialProfiles.twitter || this.socialProfiles.portfolio)) {
    completeness += 1;
  }
  
  // Calculate percentage
  this.profileCompleteness = Math.round((completeness / totalFields) * 100);
  return this.profileCompleteness;
};

// Pre-save hook to calculate profile completeness
userProfileSchema.pre('save', function(next) {
  this.calculateProfileCompleteness();
  next();
});

const UserProfile = mongoose.model('UserProfile', userProfileSchema);

module.exports = UserProfile;
