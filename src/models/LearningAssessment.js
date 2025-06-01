const mongoose = require('mongoose');

const learningAssessmentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  learningStyleResults: {
    visual: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    auditory: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    reading: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    kinesthetic: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    }
  },
  dominantStyle: {
    type: String,
    enum: ['visual', 'auditory', 'reading', 'kinesthetic', 'multimodal'],
    default: 'multimodal'
  },
  secondaryStyle: {
    type: String,
    enum: ['visual', 'auditory', 'reading', 'kinesthetic', 'none'],
    default: 'none'
  },
  learningPreferences: {
    pacePreference: {
      type: String,
      enum: ['slow', 'moderate', 'fast'],
      default: 'moderate'
    },
    structurePreference: {
      type: String,
      enum: ['highly_structured', 'moderately_structured', 'flexible'],
      default: 'moderately_structured'
    },
    socialPreference: {
      type: String,
      enum: ['individual', 'pair', 'small_group', 'large_group'],
      default: 'individual'
    },
    contentFormatPreference: [{
      type: String,
      enum: ['text', 'video', 'audio', 'interactive', 'project_based']
    }],
    feedbackPreference: {
      type: String,
      enum: ['immediate', 'delayed', 'detailed', 'summary'],
      default: 'immediate'
    }
  },
  assessmentDate: {
    type: Date,
    default: Date.now
  },
  assessmentVersion: {
    type: String,
    default: '1.0'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  notes: String
}, {
  timestamps: true
});

// Method to determine dominant learning style
learningAssessmentSchema.methods.calculateDominantStyle = function() {
  const styles = this.learningStyleResults;
  const scores = [
    { style: 'visual', score: styles.visual },
    { style: 'auditory', score: styles.auditory },
    { style: 'reading', score: styles.reading },
    { style: 'kinesthetic', score: styles.kinesthetic }
  ];
  
  // Sort by score in descending order
  scores.sort((a, b) => b.score - a.score);
  
  // If highest score is significantly higher than others (>10 points difference)
  if (scores[0].score > 0 && (scores[0].score - scores[1].score) > 10) {
    this.dominantStyle = scores[0].style;
    this.secondaryStyle = scores[1].style;
  } else {
    // If two highest scores are close, consider it multimodal
    this.dominantStyle = 'multimodal';
    this.secondaryStyle = scores[0].style;
  }
  
  return this.dominantStyle;
};

// Pre-save hook to calculate dominant learning style
learningAssessmentSchema.pre('save', function(next) {
  if (this.isModified('learningStyleResults')) {
    this.calculateDominantStyle();
  }
  next();
});

const LearningAssessment = mongoose.model('LearningAssessment', learningAssessmentSchema);

module.exports = LearningAssessment;
