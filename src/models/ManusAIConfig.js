const mongoose = require('mongoose');

const manusAIConfigSchema = new mongoose.Schema({
  apiKey: {
    type: String,
    required: [true, 'API key is required'],
    select: false // Don't return API key in queries by default
  },
  apiEndpoint: {
    type: String,
    required: [true, 'API endpoint is required'],
    default: 'https://api.manus.ai/v1'
  },
  rateLimit: {
    requestsPerMinute: {
      type: Number,
      default: 60
    },
    requestsPerDay: {
      type: Number,
      default: 10000
    }
  },
  quotaSettings: {
    maxTokensPerRequest: {
      type: Number,
      default: 4000
    },
    maxTokensPerDay: {
      type: Number,
      default: 1000000
    }
  },
  cacheSettings: {
    enabled: {
      type: Boolean,
      default: true
    },
    ttl: {
      type: Number,
      default: 3600 // 1 hour in seconds
    }
  },
  retrySettings: {
    maxRetries: {
      type: Number,
      default: 3
    },
    initialDelayMs: {
      type: Number,
      default: 1000
    },
    maxDelayMs: {
      type: Number,
      default: 10000
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const ManusAIConfig = mongoose.model('ManusAIConfig', manusAIConfigSchema);

module.exports = ManusAIConfig;
