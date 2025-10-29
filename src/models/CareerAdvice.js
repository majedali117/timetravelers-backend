const mongoose = require('mongoose');

const careerAdviceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  aiMentor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AIMentor',
    // Not required, as advice might be generated without a specific mentor context
  },
  userProfileSnapshot: {
    type: Object,
    required: true,
    // Store a snapshot of the user profile used for generating advice
  },
  adviceContent: {
    type: String,
    required: true,
  },
  generatedAt: {
    type: Date,
    default: Date.now,
  },
  modelUsed: {
    type: String,
    required: true,
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    // Optional, if advice is generated within a specific session
  },
  // You can add more fields as needed, e.g., feedback, rating for the advice
});

const CareerAdvice = mongoose.model('CareerAdvice', careerAdviceSchema);

module.exports = CareerAdvice;
