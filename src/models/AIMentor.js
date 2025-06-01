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
  manusAIMentorId: {
    type: String,
    required: [true, 'Manus AI Mentor ID is required'],
    unique: true
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 5
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for faster searches
aiMentorSchema.index({ name: 'text', specialization: 'text', bio: 'text' });
aiMentorSchema.index({ careerFields: 1 });
aiMentorSchema.index({ experienceLevel: 1 });
aiMentorSchema.index({ isActive: 1 });

const AIMentor = mongoose.model('AIMentor', aiMentorSchema);

module.exports = AIMentor;
