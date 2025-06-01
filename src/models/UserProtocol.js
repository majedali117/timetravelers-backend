const mongoose = require('mongoose');

const userProtocolSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  protocol: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Protocol',
    required: true
  },
  status: {
    type: String,
    enum: ['assigned', 'in_progress', 'completed', 'abandoned'],
    default: 'assigned'
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  phaseProgress: [{
    phaseIndex: Number,
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    milestoneProgress: [{
      milestoneIndex: Number,
      completed: {
        type: Boolean,
        default: false
      },
      completedAt: Date
    }]
  }],
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,
  mentor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AIMentor'
  },
  customizations: {
    focusAreas: [String],
    excludedMissions: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mission'
    }],
    additionalMissions: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mission'
    }],
    pacePreference: {
      type: String,
      enum: ['relaxed', 'standard', 'accelerated'],
      default: 'standard'
    }
  },
  notes: String,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index for faster lookups
userProtocolSchema.index({ user: 1, protocol: 1 }, { unique: true });
userProtocolSchema.index({ user: 1, status: 1 });
userProtocolSchema.index({ user: 1, isActive: 1 });

const UserProtocol = mongoose.model('UserProtocol', userProtocolSchema);

module.exports = UserProtocol;
