const mongoose = require('mongoose');

const missionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Mission title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Mission description is required']
  },
  type: {
    type: String,
    enum: ['learning', 'skill_building', 'networking', 'project', 'assessment', 'reflection'],
    default: 'learning'
  },
  difficulty: {
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
      enum: ['minutes', 'hours', 'days', 'weeks'],
      default: 'hours'
    }
  },
  careerFields: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CareerField'
  }],
  skills: [{
    type: String
  }],
  steps: [{
    order: Number,
    title: String,
    description: String,
    completionCriteria: String,
    resources: [{
      title: String,
      url: String,
      type: {
        type: String,
        enum: ['article', 'video', 'book', 'course', 'tool', 'other'],
        default: 'article'
      }
    }]
  }],
  rewards: {
    experience: {
      type: Number,
      default: 0
    },
    skillPoints: {
      type: Number,
      default: 0
    },
    badges: [{
      type: String
    }]
  },
  isTemplate: {
    type: Boolean,
    default: false
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
missionSchema.index({ title: 'text', description: 'text' });
missionSchema.index({ careerFields: 1 });
missionSchema.index({ difficulty: 1 });
missionSchema.index({ type: 1 });
missionSchema.index({ isTemplate: 1, isActive: 1 });

const Mission = mongoose.model('Mission', missionSchema);

module.exports = Mission;
