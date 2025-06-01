const mongoose = require('mongoose');

const tellMatchingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  mentor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AIMentor',
    required: true
  },
  compatibilityScore: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
  matchFactors: {
    careerFieldMatch: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    experienceLevelMatch: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    learningStyleMatch: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    skillsMatch: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    careerGoalsMatch: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastCalculated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index for faster lookups
tellMatchingSchema.index({ user: 1, mentor: 1 }, { unique: true });
tellMatchingSchema.index({ user: 1, compatibilityScore: -1 });

const TELLMatching = mongoose.model('TELLMatching', tellMatchingSchema);

module.exports = TELLMatching;
