const mongoose = require('mongoose');

const careerGoalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Goal title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Goal description is required']
  },
  timeframe: {
    type: String,
    enum: ['short_term', 'mid_term', 'long_term'],
    default: 'short_term'
  },
  targetDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed', 'deferred'],
    default: 'not_started'
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  milestones: [{
    title: String,
    description: String,
    targetDate: Date,
    completed: {
      type: Boolean,
      default: false
    },
    completedDate: Date
  }],
  relatedSkills: [{
    type: String
  }],
  relatedCareerFields: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CareerField'
  }],
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  notes: String,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Method to update progress based on milestones
careerGoalSchema.methods.updateProgress = function() {
  if (!this.milestones || this.milestones.length === 0) {
    return this.progress;
  }
  
  const completedMilestones = this.milestones.filter(milestone => milestone.completed).length;
  this.progress = Math.round((completedMilestones / this.milestones.length) * 100);
  
  return this.progress;
};

// Pre-save hook to update progress
careerGoalSchema.pre('save', function(next) {
  if (this.isModified('milestones')) {
    this.updateProgress();
  }
  next();
});

const CareerGoal = mongoose.model('CareerGoal', careerGoalSchema);

module.exports = CareerGoal;
