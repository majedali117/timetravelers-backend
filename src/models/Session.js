const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required'],
  },
  aiMentor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AIMentor',
    required: [true, 'AI Mentor is required'],
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
    default: 'scheduled',
  },
  startTime: {
    type: Date,
    required: [true, 'Start time is required'],
  },
  endTime: {
    type: Date,
  },
  duration: {
    type: Number, // in minutes
    default: 30,
  },
  topics: [String],
  messages: [{
    sender: {
      type: String,
      enum: ['user', 'ai_mentor'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    attachments: [{
      type: String,
      url: String,
    }],
  }],
  resources: [{
    title: String,
    type: {
      type: String,
      enum: ['article', 'video', 'exercise', 'assessment', 'other'],
    },
    url: String,
    description: String,
  }],
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    comments: String,
    submittedAt: Date,
  },
  learningOutcomes: [String],
  nextSteps: [String],
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Pre-save hook to update the updatedAt field
sessionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to add a message to the session
sessionSchema.methods.addMessage = function(sender, content, attachments = []) {
  this.messages.push({
    sender,
    content,
    timestamp: Date.now(),
    attachments,
  });
  return this.save();
};

// Method to complete a session
sessionSchema.methods.complete = function(learningOutcomes = [], nextSteps = []) {
  this.status = 'completed';
  this.endTime = Date.now();
  this.learningOutcomes = learningOutcomes;
  this.nextSteps = nextSteps;
  return this.save();
};

// Method to add feedback
sessionSchema.methods.addFeedback = function(rating, comments) {
  this.feedback = {
    rating,
    comments,
    submittedAt: Date.now(),
  };
  return this.save();
};

const Session = mongoose.model('Session', sessionSchema);

module.exports = Session;
