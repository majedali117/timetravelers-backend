const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Skill name is required'],
    trim: true
  },
  category: {
    type: String,
    enum: ['technical', 'soft', 'domain', 'tool', 'language', 'certification', 'other'],
    default: 'technical'
  },
  description: String,
  careerFields: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CareerField'
  }],
  popularity: {
    type: Number,
    default: 0,
    min: 0
  },
  isVerified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for faster searches
skillSchema.index({ name: 1, category: 1 });
skillSchema.index({ name: 'text', description: 'text' });

const Skill = mongoose.model('Skill', skillSchema);

module.exports = Skill;
