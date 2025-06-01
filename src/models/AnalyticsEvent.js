const mongoose = require('mongoose');

const analyticsEventSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  eventType: {
    type: String,
    required: true,
    enum: [
      'login', 
      'registration', 
      'profile_update', 
      'mission_start', 
      'mission_complete',
      'mission_abandon',
      'protocol_start',
      'protocol_milestone_complete',
      'protocol_complete',
      'protocol_abandon',
      'mentor_session_start',
      'mentor_session_end',
      'assessment_complete',
      'skill_added',
      'goal_created',
      'goal_completed',
      'resource_accessed',
      'feedback_submitted',
      'search_performed',
      'recommendation_clicked',
      'feature_used',
      'error_encountered'
    ]
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  sessionId: {
    type: String
  },
  deviceInfo: {
    type: {
      type: String,
      enum: ['mobile', 'tablet', 'desktop', 'unknown'],
      default: 'unknown'
    },
    browser: String,
    os: String,
    screenSize: String
  },
  location: {
    page: String,
    component: String,
    section: String
  }
}, {
  timestamps: true
});

// Indexes for faster queries
analyticsEventSchema.index({ user: 1, eventType: 1 });
analyticsEventSchema.index({ eventType: 1, timestamp: 1 });
analyticsEventSchema.index({ timestamp: 1 });
analyticsEventSchema.index({ sessionId: 1 });

const AnalyticsEvent = mongoose.model('AnalyticsEvent', analyticsEventSchema);

module.exports = AnalyticsEvent;
