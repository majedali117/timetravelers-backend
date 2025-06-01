const mongoose = require('mongoose');

const analyticsReportSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Report title is required'],
    trim: true
  },
  description: {
    type: String
  },
  reportType: {
    type: String,
    enum: [
      'user_engagement',
      'mission_completion',
      'protocol_progress',
      'mentor_effectiveness',
      'skill_development',
      'user_retention',
      'feature_usage',
      'user_growth',
      'learning_outcomes',
      'custom'
    ],
    required: true
  },
  dateRange: {
    start: {
      type: Date,
      required: true
    },
    end: {
      type: Date,
      required: true
    }
  },
  filters: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  metrics: [{
    name: String,
    value: mongoose.Schema.Types.Mixed,
    previousValue: mongoose.Schema.Types.Mixed,
    change: Number,
    changePercentage: Number
  }],
  segments: [{
    name: String,
    data: mongoose.Schema.Types.Mixed
  }],
  charts: [{
    title: String,
    type: {
      type: String,
      enum: ['line', 'bar', 'pie', 'table', 'number', 'heatmap', 'scatter']
    },
    data: mongoose.Schema.Types.Mixed,
    options: mongoose.Schema.Types.Mixed
  }],
  insights: [{
    title: String,
    description: String,
    importance: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    }
  }],
  recommendations: [{
    title: String,
    description: String,
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isScheduled: {
    type: Boolean,
    default: false
  },
  schedule: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'quarterly'],
    },
    nextRun: Date,
    recipients: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  isPublic: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for faster queries
analyticsReportSchema.index({ reportType: 1 });
analyticsReportSchema.index({ 'dateRange.start': 1, 'dateRange.end': 1 });
analyticsReportSchema.index({ createdBy: 1 });
analyticsReportSchema.index({ isScheduled: 1, 'schedule.nextRun': 1 });

const AnalyticsReport = mongoose.model('AnalyticsReport', analyticsReportSchema);

module.exports = AnalyticsReport;
