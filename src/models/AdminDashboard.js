const mongoose = require('mongoose');

const adminDashboardSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Dashboard title is required'],
    trim: true
  },
  description: {
    type: String
  },
  layout: {
    type: String,
    enum: ['grid', 'list', 'custom'],
    default: 'grid'
  },
  widgets: [{
    title: String,
    type: {
      type: String,
      enum: ['chart', 'metric', 'table', 'list', 'alert', 'custom'],
      required: true
    },
    size: {
      width: {
        type: Number,
        default: 1
      },
      height: {
        type: Number,
        default: 1
      }
    },
    position: {
      x: Number,
      y: Number
    },
    dataSource: {
      type: {
        type: String,
        enum: ['api', 'collection', 'static', 'function'],
        required: true
      },
      endpoint: String,
      collection: String,
      query: mongoose.Schema.Types.Mixed,
      refreshInterval: Number // in seconds
    },
    config: mongoose.Schema.Types.Mixed,
    permissions: {
      roles: [{
        type: String,
        enum: ['admin', 'manager', 'user']
      }]
    }
  }],
  isDefault: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for faster queries
adminDashboardSchema.index({ createdBy: 1 });
adminDashboardSchema.index({ isDefault: 1 });

const AdminDashboard = mongoose.model('AdminDashboard', adminDashboardSchema);

module.exports = AdminDashboard;
