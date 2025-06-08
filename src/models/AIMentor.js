const mongoose = require('mongoose');

const aiMentorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Mentor name is required'],
    trim: true
  },
  specialization: {
    type: String,
    required: [true, 'Specialization is required'],
    trim: true
  },
  bio: {
    type: String,
    required: [true, 'Bio is required']
  },
  profileImage: {
    type: String,
    default: '/assets/default-mentor.png'
  },
  careerFields: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CareerField'
  }],
  experienceLevel: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    default: 'expert'
  },
  skills: [{
    type: String
  }],
  teachingStyle: {
    type: String,
    enum: ['practical', 'theoretical', 'socratic', 'coaching', 'mentoring'],
    default: 'mentoring'
  },
  communicationStyle: {
    type: String,
    enum: ['direct', 'supportive', 'analytical', 'expressive'],
    default: 'supportive'
  },
  learningStyleCompatibility: {
    visual: {
      type: Number,
      min: 1,
      max: 10,
      default: 5
    },
    auditory: {
      type: Number,
      min: 1,
      max: 10,
      default: 5
    },
    reading: {
      type: Number,
      min: 1,
      max: 10,
      default: 5
    },
    kinesthetic: {
      type: Number,
      min: 1,
      max: 10,
      default: 5
    }
  },
  geminiMentorId: {
    type: String,
    required: [true, 'Gemini Mentor ID is required'],
    unique: true
  },
  manusAIMentorId: {
    type: String,
    required: [true, 'Gemini Mentor ID is required'],
    unique: true
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 4.5
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastSyncedAt: {
    type: Date,
    default: Date.now
  },
  aiProvider: {
    type: String,
    default: 'gemini',
    enum: ['gemini', 'openai', 'anthropic', 'other']
  },
  sessionCount: {
    type: Number,
    default: 0
  },
  totalInteractions: {
    type: Number,
    default: 0
  },
  averageSessionDuration: {
    type: Number, // in minutes
    default: 0
  },
  tags: [{
    type: String
  }],
  availability: {
    type: String,
    enum: ['always', 'business_hours', 'limited', 'unavailable'],
    default: 'always'
  },
  languages: [{
    type: String,
    default: ['English']
  }],
  responseTime: {
    type: String,
    enum: ['instant', 'fast', 'moderate', 'slow'],
    default: 'instant'
  }
}, {
  timestamps: true
});

// Index for faster searches
aiMentorSchema.index({ name: 'text', specialization: 'text', bio: 'text', skills: 'text' });
aiMentorSchema.index({ careerFields: 1 });
aiMentorSchema.index({ experienceLevel: 1 });
aiMentorSchema.index({ isActive: 1 });
aiMentorSchema.index({ geminiMentorId: 1 });
aiMentorSchema.index({ specialization: 1 });
aiMentorSchema.index({ teachingStyle: 1 });
aiMentorSchema.index({ rating: -1 });
aiMentorSchema.index({ reviewCount: -1 });
aiMentorSchema.index({ tags: 1 });

// Virtual for full name display
aiMentorSchema.virtual('displayName').get(function() {
  return `${this.name} - ${this.specialization}`;
});

// Method to update session statistics
aiMentorSchema.methods.updateSessionStats = function(sessionDuration) {
  this.sessionCount += 1;
  this.totalInteractions += 1;
  
  // Calculate new average session duration
  const totalDuration = (this.averageSessionDuration * (this.sessionCount - 1)) + sessionDuration;
  this.averageSessionDuration = totalDuration / this.sessionCount;
  
  return this.save();
};

// Method to add a review and update rating
aiMentorSchema.methods.addReview = function(rating) {
  const totalRating = (this.rating * this.reviewCount) + rating;
  this.reviewCount += 1;
  this.rating = totalRating / this.reviewCount;
  
  return this.save();
};

// Static method to find mentors by specialization
aiMentorSchema.statics.findBySpecialization = function(specialization) {
  return this.find({ 
    specialization: { $regex: specialization, $options: 'i' },
    isActive: true 
  }).sort({ rating: -1, reviewCount: -1 });
};

// Static method to find top-rated mentors
aiMentorSchema.statics.findTopRated = function(limit = 10) {
  return this.find({ isActive: true })
    .sort({ rating: -1, reviewCount: -1 })
    .limit(limit);
};

const AIMentor = mongoose.model('AIMentor', aiMentorSchema);

module.exports = AIMentor;

