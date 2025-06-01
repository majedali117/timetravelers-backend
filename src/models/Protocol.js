const mongoose = require('mongoose');

const protocolSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Protocol title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Protocol description is required']
  },
  careerFields: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CareerField'
  }],
  targetLevel: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    default: 'beginner'
  },
  estimatedDuration: {
    value: {
      type: Number,
      min: 1,
      required: true
    },
    unit: {
      type: String,
      enum: ['days', 'weeks', 'months'],
      default: 'weeks'
    }
  },
  phases: [{
    title: String,
    description: String,
    order: Number,
    milestones: [{
      title: String,
      description: String,
      order: Number,
      missions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Mission'
      }]
    }]
  }],
  learningOutcomes: [{
    type: String
  }],
  skillsGained: [{
    name: String,
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      default: 'beginner'
    }
  }],
  prerequisites: {
    skills: [{
      name: String,
      level: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced', 'expert'],
        default: 'beginner'
      }
    }],
    experience: String,
    other: String
  },
  isTemplate: {
    type: Boolean,
    default: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for faster searches
protocolSchema.index({ title: 'text', description: 'text' });
protocolSchema.index({ careerFields: 1 });
protocolSchema.index({ targetLevel: 1 });
protocolSchema.index({ isTemplate: 1, isActive: 1 });

const Protocol = mongoose.model('Protocol', protocolSchema);

module.exports = Protocol;
