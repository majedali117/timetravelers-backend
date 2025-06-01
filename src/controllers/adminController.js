const AdminDashboard = require('../models/AdminDashboard');
const User = require('../models/User');
const Mission = require('../models/Mission');
const Protocol = require('../models/Protocol');
const AIMentor = require('../models/AIMentor');
const AnalyticsEvent = require('../models/AnalyticsEvent');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

// Create admin dashboard
exports.createDashboard = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const {
      title,
      description,
      layout,
      widgets,
      isDefault
    } = req.body;
    
    // If setting as default, unset any existing default
    if (isDefault) {
      await AdminDashboard.updateMany(
        { isDefault: true },
        { $set: { isDefault: false } }
      );
    }
    
    // Create new dashboard
    const newDashboard = new AdminDashboard({
      title,
      description,
      layout,
      widgets,
      isDefault,
      createdBy: req.user.id
    });
    
    await newDashboard.save();
    
    res.json({ success: true, dashboard: newDashboard });
  } catch (error) {
    console.error('Error creating admin dashboard:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all admin dashboards
exports.getAllDashboards = async (req, res) => {
  try {
    const dashboards = await AdminDashboard.find()
      .sort({ isDefault: -1, createdAt: -1 })
      .populate('createdBy', 'firstName lastName email');
    
    res.json({ success: true, dashboards });
  } catch (error) {
    console.error('Error getting admin dashboards:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get admin dashboard by ID
exports.getDashboard = async (req, res) => {
  try {
    const dashboard = await AdminDashboard.findById(req.params.id)
      .populate('createdBy', 'firstName lastName email');
    
    if (!dashboard) {
      return res.status(404).json({ message: 'Dashboard not found' });
    }
    
    res.json({ success: true, dashboard });
  } catch (error) {
    console.error('Error getting admin dashboard:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update admin dashboard
exports.updateDashboard = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const dashboard = await AdminDashboard.findById(req.params.id);
    
    if (!dashboard) {
      return res.status(404).json({ message: 'Dashboard not found' });
    }
    
    const {
      title,
      description,
      layout,
      widgets,
      isDefault
    } = req.body;
    
    // If setting as default, unset any existing default
    if (isDefault && !dashboard.isDefault) {
      await AdminDashboard.updateMany(
        { isDefault: true },
        { $set: { isDefault: false } }
      );
    }
    
    // Update fields
    if (title) dashboard.title = title;
    if (description !== undefined) dashboard.description = description;
    if (layout) dashboard.layout = layout;
    if (widgets) dashboard.widgets = widgets;
    if (isDefault !== undefined) dashboard.isDefault = isDefault;
    
    await dashboard.save();
    
    res.json({ success: true, dashboard });
  } catch (error) {
    console.error('Error updating admin dashboard:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete admin dashboard
exports.deleteDashboard = async (req, res) => {
  try {
    const dashboard = await AdminDashboard.findById(req.params.id);
    
    if (!dashboard) {
      return res.status(404).json({ message: 'Dashboard not found' });
    }
    
    await dashboard.remove();
    
    // If deleted dashboard was default, set another one as default
    if (dashboard.isDefault) {
      const anotherDashboard = await AdminDashboard.findOne().sort({ createdAt: -1 });
      if (anotherDashboard) {
        anotherDashboard.isDefault = true;
        await anotherDashboard.save();
      }
    }
    
    res.json({ success: true, message: 'Dashboard deleted' });
  } catch (error) {
    console.error('Error deleting admin dashboard:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get admin dashboard widget data
exports.getWidgetData = async (req, res) => {
  try {
    const { widgetType, dataSource, timeRange } = req.query;
    
    if (!widgetType) {
      return res.status(400).json({ message: 'Widget type is required' });
    }
    
    // Parse time range
    const now = new Date();
    let startDate;
    
    switch (timeRange) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'yesterday':
        startDate = new Date(now.setDate(now.getDate() - 1));
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'last7days':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'last30days':
        startDate = new Date(now.setDate(now.getDate() - 30));
        break;
      case 'thisMonth':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'lastMonth':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        break;
      default:
        startDate = new Date(now.setDate(now.getDate() - 30)); // Default to last 30 days
    }
    
    const endDate = new Date();
    
    let data;
    
    switch (widgetType) {
      case 'userStats':
        data = await getUserStats(startDate, endDate);
        break;
      case 'missionStats':
        data = await getMissionStats(startDate, endDate);
        break;
      case 'protocolStats':
        data = await getProtocolStats(startDate, endDate);
        break;
      case 'mentorStats':
        data = await getMentorStats(startDate, endDate);
        break;
      case 'userActivity':
        data = await getUserActivity(startDate, endDate);
        break;
      case 'recentUsers':
        data = await getRecentUsers();
        break;
      case 'recentMissions':
        data = await getRecentMissions();
        break;
      case 'systemStatus':
        data = await getSystemStatus();
        break;
      default:
        return res.status(400).json({ message: 'Invalid widget type' });
    }
    
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error getting widget data:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get system overview
exports.getSystemOverview = async (req, res) => {
  try {
    // Get counts
    const userCount = await User.countDocuments();
    const missionCount = await Mission.countDocuments();
    const protocolCount = await Protocol.countDocuments();
    const mentorCount = await AIMentor.countDocuments();
    
    // Get recent activity
    const recentActivity = await AnalyticsEvent.find()
      .sort({ timestamp: -1 })
      .limit(10)
      .populate('user', 'firstName lastName email');
    
    // Get active users today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const activeUsersToday = await AnalyticsEvent.distinct('user', {
      timestamp: { $gte: today }
    });
    
    res.json({
      success: true,
      overview: {
        counts: {
          users: userCount,
          missions: missionCount,
          protocols: protocolCount,
          mentors: mentorCount,
          activeUsersToday: activeUsersToday.length
        },
        recentActivity
      }
    });
  } catch (error) {
    console.error('Error getting system overview:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Helper function to get user stats
async function getUserStats(startDate, endDate) {
  // Get total users
  const totalUsers = await User.countDocuments();
  
  // Get new users in period
  const newUsers = await User.countDocuments({
    createdAt: { $gte: startDate, $lte: endDate }
  });
  
  // Get active users in period
  const activeUsers = await AnalyticsEvent.distinct('user', {
    timestamp: { $gte: startDate, $lte: endDate }
  });
  
  // Get user registration trend
  const userTrend = await User.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);
  
  return {
    totalUsers,
    newUsers,
    activeUsers: activeUsers.length,
    userTrend
  };
}

// Helper function to get mission stats
async function getMissionStats(startDate, endDate) {
  // Get mission counts by status
  const missionStats = await Mission.aggregate([
    {
      $lookup: {
        from: 'usermissions',
        localField: '_id',
        foreignField: 'mission',
        as: 'userMissions'
      }
    },
    {
      $project: {
        title: 1,
        type: 1,
        difficulty: 1,
        assignedCount: { $size: '$userMissions' },
        completedCount: {
          $size: {
            $filter: {
              input: '$userMissions',
              as: 'mission',
              cond: { $eq: ['$$mission.status', 'completed'] }
            }
          }
        }
      }
    },
    {
      $group: {
        _id: null,
        totalMissions: { $sum: 1 },
        totalAssigned: { $sum: '$assignedCount' },
        totalCompleted: { $sum: '$completedCount' },
        byDifficulty: {
          $push: {
            difficulty: '$difficulty',
            count: 1,
            assignedCount: '$assignedCount',
            completedCount: '$completedCount'
          }
        },
        byType: {
          $push: {
            type: '$type',
            count: 1,
            assignedCount: '$assignedCount',
            completedCount: '$completedCount'
          }
        }
      }
    }
  ]);
  
  // Process difficulty and type stats
  let difficultyStats = {};
  let typeStats = {};
  
  if (missionStats.length > 0) {
    // Process difficulty stats
    missionStats[0].byDifficulty.forEach(item => {
      if (!difficultyStats[item.difficulty]) {
        difficultyStats[item.difficulty] = {
          count: 0,
          assignedCount: 0,
          completedCount: 0
        };
      }
      difficultyStats[item.difficulty].count += item.count;
      difficultyStats[item.difficulty].assignedCount += item.assignedCount;
      difficultyStats[item.difficulty].completedCount += item.completedCount;
    });
    
    // Process type stats
    missionStats[0].byType.forEach(item => {
      if (!typeStats[item.type]) {
        typeStats[item.type] = {
          count: 0,
          assignedCount: 0,
          completedCount: 0
        };
      }
      typeStats[item.type].count += item.count;
      typeStats[item.type].assignedCount += item.assignedCount;
      typeStats[item.type].completedCount += item.completedCount;
    });
  }
  
  return {
    totalMissions: missionStats[0]?.totalMissions || 0,
    totalAssigned: missionStats[0]?.totalAssigned || 0,
    totalCompleted: missionStats[0]?.totalCompleted || 0,
    completionRate: missionStats[0]?.totalAssigned > 0 
      ? (missionStats[0].totalCompleted / missionStats[0].totalAssigned) * 100 
      : 0,
    byDifficulty: Object.entries(difficultyStats).map(([difficulty, stats]) => ({
      difficulty,
      ...stats
    })),
    byType: Object.entries(typeStats).map(([type, stats]) => ({
      type,
      ...stats
    }))
  };
}

// Helper function to get protocol stats
async function getProtocolStats(startDate, endDate) {
  // Get protocol counts by status
  const protocolStats = await Protocol.aggregate([
    {
      $lookup: {
        from: 'userprotocols',
        localField: '_id',
        foreignField: 'protocol',
        as: 'userProtocols'
      }
    },
    {
      $project: {
        title: 1,
        targetLevel: 1,
        assignedCount: { $size: '$userProtocols' },
        completedCount: {
          $size: {
            $filter: {
              input: '$userProtocols',
              as: 'protocol',
              cond: { $eq: ['$$protocol.status', 'completed'] }
            }
          }
        },
        averageProgress: {
          $avg: '$userProtocols.progress'
        }
      }
    },
    {
      $group: {
        _id: null,
        totalProtocols: { $sum: 1 },
        totalAssigned: { $sum: '$assignedCount' },
        totalCompleted: { $sum: '$completedCount' },
        byLevel: {
          $push: {
            level: '$targetLevel',
            count: 1,
            assignedCount: '$assignedCount',
            completedCount: '$completedCount'
          }
        }
      }
    }
  ]);
  
  // Process level stats
  let levelStats = {};
  
  if (protocolStats.length > 0) {
    protocolStats[0].byLevel.forEach(item => {
      if (!levelStats[item.level]) {
        levelStats[item.level] = {
          count: 0,
          assignedCount: 0,
          completedCount: 0
        };
      }
      levelStats[item.level].count += item.count;
      levelStats[item.level].assignedCount += item.assignedCount;
      levelStats[item.level].completedCount += item.completedCount;
    });
  }
  
  return {
    totalProtocols: protocolStats[0]?.totalProtocols || 0,
    totalAssigned: protocolStats[0]?.totalAssigned || 0,
    totalCompleted: protocolStats[0]?.totalCompleted || 0,
    completionRate: protocolStats[0]?.totalAssigned > 0 
      ? (protocolStats[0].totalCompleted / protocolStats[0].totalAssigned) * 100 
      : 0,
    byLevel: Object.entries(levelStats).map(([level, stats]) => ({
      level,
      ...stats
    }))
  };
}

// Helper function to get mentor stats
async function getMentorStats(startDate, endDate) {
  // Get mentor counts and usage
  const mentorStats = await AIMentor.aggregate([
    {
      $lookup: {
        from: 'usermissions',
        localField: '_id',
        foreignField: 'mentor',
        as: 'missions'
      }
    },
    {
      $lookup: {
        from: 'userprotocols',
        localField: '_id',
        foreignField: 'mentor',
        as: 'protocols'
      }
    },
    {
      $project: {
        name: 1,
        careerField: 1,
        isActive: 1,
        missionCount: { $size: '$missions' },
        protocolCount: { $size: '$protocols' },
        totalAssignments: { $add: [{ $size: '$missions' }, { $size: '$protocols' }] }
      }
    },
    {
      $group: {
        _id: null,
        totalMentors: { $sum: 1 },
        activeMentors: {
          $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
        },
        totalAssignments: { $sum: '$totalAssignments' },
        mentors: { $push: '$$ROOT' }
      }
    }
  ]);
  
  // Get top mentors by assignment count
  const topMentors = mentorStats.length > 0 
    ? mentorStats[0].mentors
        .sort((a, b) => b.totalAssignments - a.totalAssignments)
        .slice(0, 5)
    : [];
  
  return {
    totalMentors: mentorStats[0]?.totalMentors || 0,
    activeMentors: mentorStats[0]?.activeMentors || 0,
    totalAssignments: mentorStats[0]?.totalAssignments || 0,
    averageAssignmentsPerMentor: mentorStats[0]?.totalMentors > 0 
      ? mentorStats[0].totalAssignments / mentorStats[0].totalMentors 
      : 0,
    topMentors
  };
}

// Helper function to get user activity
async function getUserActivity(startDate, endDate) {
  // Get daily active users
  const dailyActiveUsers = await AnalyticsEvent.aggregate([
    {
      $match: {
        timestamp: { $gte: startDate, $lte: endDate },
        eventType: 'login'
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
        uniqueUsers: { $addToSet: '$user' }
      }
    },
    {
      $project: {
        date: '$_id',
        count: { $size: '$uniqueUsers' },
        _id: 0
      }
    },
    {
      $sort: { date: 1 }
    }
  ]);
  
  // Get event distribution
  const eventDistribution = await AnalyticsEvent.aggregate([
    {
      $match: {
        timestamp: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$eventType',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
  
  return {
    dailyActiveUsers,
    eventDistribution
  };
}

// Helper function to get recent users
async function getRecentUsers(limit = 10) {
  return await User.find()
    .select('firstName lastName email createdAt lastLogin')
    .sort({ createdAt: -1 })
    .limit(limit);
}

// Helper function to get recent missions
async function getRecentMissions(limit = 10) {
  return await Mission.find()
    .select('title description type difficulty createdAt')
    .sort({ createdAt: -1 })
    .limit(limit);
}

// Helper function to get system status
async function getSystemStatus() {
  // This would typically include server metrics, but for this implementation
  // we'll return some mock data
  return {
    status: 'healthy',
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    lastBackup: new Date(Date.now() - 24 * 60 * 60 * 1000), // Mock: 1 day ago
    databaseSize: '1.2 GB', // Mock value
    apiRequests: {
      total: 15420, // Mock value
      lastHour: 342, // Mock value
      avgResponseTime: 120 // Mock value in ms
    }
  };
}
