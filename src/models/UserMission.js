const mongoose = require('mongoose');

const userMissionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  mission: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mission',
    required: true
  },
  status: {
    type: String,
    enum: ['assigned', 'in_progress', 'completed', 'failed', 'abandoned'],
    default: 'assigned'
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  stepProgress: [{
    stepIndex: Number,
    completed: {
      type: Boolean,
      default: false
    },
    completedAt: Date,
    notes: String,
    evidence: String
  }],
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comments: String,
    submittedAt: Date
  },
  mentor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AIMentor'
  },
  mentorFeedback: {
    content: String,
    submittedAt: Date
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index for faster lookups
userMissionSchema.index({ user: 1, mission: 1 }, { unique: true });
userMissionSchema.index({ user: 1, status: 1 });
userMissionSchema.index({ user: 1, isActive: 1 });

const UserMission = mongoose.model('UserMission', userMissionSchema);

module.exports = UserMission;
