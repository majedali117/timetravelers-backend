const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const careerFieldSchema = new mongoose.Schema({
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
  icon: {
    type: String,
    default: '',
  },
  skills: [{
    name: String,
    description: String,
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    }
  }],
  subFields: [{
    name: String,
    description: String,
  }],
  resources: [{
    title: String,
    type: {
      type: String,
      enum: ['article', 'video', 'course', 'book', 'tool', 'other'],
    },
    url: String,
    description: String,
  }],
  careerPaths: [{
    title: String,
    description: String,
    averageSalary: Number,
    growthRate: Number,
    requiredSkills: [String],
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
careerFieldSchema.plugin(uniqueValidator, { message: '{PATH} already exists' });

// Pre-save hook to update the updatedAt field
careerFieldSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const CareerField = mongoose.model('CareerField', careerFieldSchema);

module.exports = CareerField;
