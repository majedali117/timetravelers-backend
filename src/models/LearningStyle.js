const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const learningStyleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    unique: true,
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
  },
  characteristics: [String],
  recommendedApproaches: [String],
  icon: {
    type: String,
    default: '',
  },
  assessmentQuestions: [{
    question: String,
    options: [{
      text: String,
      value: Number,
    }],
  }],
  compatibleStyles: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LearningStyle',
  }],
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

// Apply the uniqueValidator plugin
learningStyleSchema.plugin(uniqueValidator, { message: '{PATH} already exists' });

// Pre-save hook to update the updatedAt field
learningStyleSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const LearningStyle = mongoose.model('LearningStyle', learningStyleSchema);

module.exports = LearningStyle;
