const AnalyticsEvent = require('../models/AnalyticsEvent');
const AnalyticsReport = require('../models/AnalyticsReport');
const User = require('../models/User');
const Mission = require('../models/Mission');
const UserMission = require('../models/UserMission');
const Protocol = require('../models/Protocol');
const UserProtocol = require('../models/UserProtocol');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

// Track analytics event
exports.trackEvent = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const {
      eventType,
      metadata,
      sessionId,
      deviceInfo,
      location
    } = req.body;
    
    // Create new analytics event
    const newEvent = new AnalyticsEvent({
      user: req.user.id,
      eventType,
      metadata,
      sessionId,
      deviceInfo,
      location
    });
    
    await newEvent.save();
    
    res.json({ success: true, event: newEvent });
  } catch (error) {
    console.error('Error tracking analytics event:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user engagement metrics
exports.getUserEngagementMetrics = async (req, res) => {
  try {
    const { userId, startDate, endDate } = req.query;
    
    // Validate user ID if provided
    if (userId) {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
    }
    
    // Parse date range
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default to last 30 days
    const end = endDate ? new Date(endDate) : new Date();
    
    // Build query
    const query = {
      timestamp: { $gte: start, $lte: end }
    };
    
    if (userId) {
      query.user = userId;
    }
    
    // Get event counts by type
    const eventCounts = await AnalyticsEvent.aggregate([
      { $match: query },
      { $group: { _id: '$eventType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Get daily active users
    const dailyActiveUsers = await AnalyticsEvent.aggregate([
      { $match: { ...query, eventType: 'login' } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }, users: { $addToSet: '$user' } } },
      { $project: { date: '$_id', count: { $size: '$users' }, _id: 0 } },
      { $sort: { date: 1 } }
    ]);
    
    // Get session duration metrics
    const sessionMetrics = await calculateSessionMetrics(query);
    
    // Get feature usage
    const featureUsage = await AnalyticsEvent.aggregate([
      { $match: { ...query, eventType: 'feature_used' } },
      { $group: { _id: '$metadata.feature', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    res.json({
      success: true,
      metrics: {
        eventCounts,
        dailyActiveUsers,
        sessionMetrics,
        featureUsage
      }
    });
  } catch (error) {
    console.error('Error getting user engagement metrics:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get mission completion metrics
exports.getMissionMetrics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Parse date range
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default to last 30 days
    const end = endDate ? new Date(endDate) : new Date();
    
    // Get mission completion rate
    const missionStats = await UserMission.aggregate([
      { 
        $match: { 
          createdAt: { $gte: start, $lte: end } 
        } 
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Calculate completion rate
    const totalMissions = missionStats.reduce((sum, stat) => sum + stat.count, 0);
    const completedMissions = missionStats.find(stat => stat._id === 'completed')?.count || 0;
    const abandonedMissions = missionStats.find(stat => stat._id === 'abandoned')?.count || 0;
    
    const completionRate = totalMissions > 0 ? (completedMissions / totalMissions) * 100 : 0;
    const abandonmentRate = totalMissions > 0 ? (abandonedMissions / totalMissions) * 100 : 0;
    
    // Get average time to complete missions
    const completionTimeMetrics = await UserMission.aggregate([
      {
        $match: {
          status: 'completed',
          startedAt: { $gte: start, $lte: end },
          completedAt: { $exists: true }
        }
      },
      {
        $project: {
          completionTime: { $subtract: ['$completedAt', '$startedAt'] }
        }
      },
      {
        $group: {
          _id: null,
          averageTime: { $avg: '$completionTime' },
          minTime: { $min: '$completionTime' },
          maxTime: { $max: '$completionTime' }
        }
      }
    ]);
    
    // Get mission popularity
    const missionPopularity = await UserMission.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$mission',
          count: { $sum: 1 },
          completions: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      },
      {
        $lookup: {
          from: 'missions',
          localField: '_id',
          foreignField: '_id',
          as: 'missionDetails'
        }
      },
      {
        $unwind: '$missionDetails'
      },
      {
        $project: {
          _id: 1,
          title: '$missionDetails.title',
          count: 1,
          completions: 1,
          completionRate: {
            $cond: [
              { $gt: ['$count', 0] },
              { $multiply: [{ $divide: ['$completions', '$count'] }, 100] },
              0
            ]
          }
        }
      }
    ]);
    
    res.json({
      success: true,
      metrics: {
        totalMissions,
        completedMissions,
        abandonedMissions,
        completionRate,
        abandonmentRate,
        completionTimeMetrics: completionTimeMetrics[0] || {
          averageTime: 0,
          minTime: 0,
          maxTime: 0
        },
        missionPopularity
      }
    });
  } catch (error) {
    console.error('Error getting mission metrics:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get protocol progress metrics
exports.getProtocolMetrics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Parse date range
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default to last 30 days
    const end = endDate ? new Date(endDate) : new Date();
    
    // Get protocol stats
    const protocolStats = await UserProtocol.aggregate([
      { 
        $match: { 
          createdAt: { $gte: start, $lte: end } 
        } 
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Calculate completion rate
    const totalProtocols = protocolStats.reduce((sum, stat) => sum + stat.count, 0);
    const completedProtocols = protocolStats.find(stat => stat._id === 'completed')?.count || 0;
    const abandonedProtocols = protocolStats.find(stat => stat._id === 'abandoned')?.count || 0;
    
    const completionRate = totalProtocols > 0 ? (completedProtocols / totalProtocols) * 100 : 0;
    const abandonmentRate = totalProtocols > 0 ? (abandonedProtocols / totalProtocols) * 100 : 0;
    
    // Get average progress
    const progressMetrics = await UserProtocol.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: null,
          averageProgress: { $avg: '$progress' }
        }
      }
    ]);
    
    // Get protocol popularity
    const protocolPopularity = await UserProtocol.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$protocol',
          count: { $sum: 1 },
          completions: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          averageProgress: { $avg: '$progress' }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      },
      {
        $lookup: {
          from: 'protocols',
          localField: '_id',
          foreignField: '_id',
          as: 'protocolDetails'
        }
      },
      {
        $unwind: '$protocolDetails'
      },
      {
        $project: {
          _id: 1,
          title: '$protocolDetails.title',
          count: 1,
          completions: 1,
          averageProgress: 1,
          completionRate: {
            $cond: [
              { $gt: ['$count', 0] },
              { $multiply: [{ $divide: ['$completions', '$count'] }, 100] },
              0
            ]
          }
        }
      }
    ]);
    
    res.json({
      success: true,
      metrics: {
        totalProtocols,
        completedProtocols,
        abandonedProtocols,
        completionRate,
        abandonmentRate,
        averageProgress: progressMetrics[0]?.averageProgress || 0,
        protocolPopularity
      }
    });
  } catch (error) {
    console.error('Error getting protocol metrics:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user growth metrics
exports.getUserGrowthMetrics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Parse date range
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // Default to last 90 days
    const end = endDate ? new Date(endDate) : new Date();
    
    // Get new user signups by day
    const newUsersByDay = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end }
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
    
    // Get total user count
    const totalUsers = await User.countDocuments({
      createdAt: { $lte: end }
    });
    
    // Get new users in period
    const newUsers = await User.countDocuments({
      createdAt: { $gte: start, $lte: end }
    });
    
    // Get user retention
    const retentionData = await calculateUserRetention(start, end);
    
    res.json({
      success: true,
      metrics: {
        totalUsers,
        newUsers,
        newUsersByDay,
        retentionData
      }
    });
  } catch (error) {
    console.error('Error getting user growth metrics:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create analytics report
exports.createReport = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const {
      title,
      description,
      reportType,
      dateRange,
      filters,
      isScheduled,
      schedule,
      isPublic
    } = req.body;
    
    // Create new report
    const newReport = new AnalyticsReport({
      title,
      description,
      reportType,
      dateRange,
      filters,
      isScheduled,
      schedule,
      isPublic,
      createdBy: req.user.id
    });
    
    // Generate report data
    await generateReportData(newReport);
    
    await newReport.save();
    
    res.json({ success: true, report: newReport });
  } catch (error) {
    console.error('Error creating analytics report:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get analytics report by ID
exports.getReport = async (req, res) => {
  try {
    const report = await AnalyticsReport.findById(req.params.id)
      .populate('createdBy', 'firstName lastName email');
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    // Check if user has access to report
    const isAdmin = req.user.role === 'admin';
    const isOwner = report.createdBy && report.createdBy._id.toString() === req.user.id;
    
    if (!isAdmin && !isOwner && !report.isPublic) {
      return res.status(403).json({ message: 'Not authorized to access this report' });
    }
    
    res.json({ success: true, report });
  } catch (error) {
    console.error('Error getting analytics report:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all analytics reports
exports.getAllReports = async (req, res) => {
  try {
    const { limit = 20, page = 1 } = req.query;
    
    // Build query based on user role
    const isAdmin = req.user.role === 'admin';
    const query = isAdmin ? {} : {
      $or: [
        { createdBy: req.user.id },
        { isPublic: true }
      ]
    };
    
    const skip = (page - 1) * limit;
    
    const reports = await AnalyticsReport.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('createdBy', 'firstName lastName email');
    
    const total = await AnalyticsReport.countDocuments(query);
    
    res.json({
      success: true,
      reports,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error getting analytics reports:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update analytics report
exports.updateReport = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const report = await AnalyticsReport.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    // Check if user has permission to update report
    const isAdmin = req.user.role === 'admin';
    const isOwner = report.createdBy && report.createdBy.toString() === req.user.id;
    
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: 'Not authorized to update this report' });
    }
    
    // Update fields
    const updateFields = {};
    for (const [key, value] of Object.entries(req.body)) {
      if (key !== 'createdBy') {
        updateFields[key] = value;
      }
    }
    
    // If date range changed, regenerate report data
    if (req.body.dateRange && 
        (report.dateRange.start.toString() !== new Date(req.body.dateRange.start).toString() ||
         report.dateRange.end.toString() !== new Date(req.body.dateRange.end).toString())) {
      report.dateRange = req.body.dateRange;
      await generateReportData(report);
    }
    
    const updatedReport = await AnalyticsReport.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true }
    );
    
    res.json({ success: true, report: updatedReport });
  } catch (error) {
    console.error('Error updating analytics report:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete analytics report
exports.deleteReport = async (req, res) => {
  try {
    const report = await AnalyticsReport.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    // Check if user has permission to delete report
    const isAdmin = req.user.role === 'admin';
    const isOwner = report.createdBy && report.createdBy.toString() === req.user.id;
    
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: 'Not authorized to delete this report' });
    }
    
    await report.remove();
    
    res.json({ success: true, message: 'Report deleted' });
  } catch (error) {
    console.error('Error deleting analytics report:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Export analytics data
exports.exportData = async (req, res) => {
  try {
    const { dataType, format, startDate, endDate } = req.query;
    
    // Validate data type
    const validDataTypes = ['events', 'users', 'missions', 'protocols', 'sessions'];
    if (!validDataTypes.includes(dataType)) {
      return res.status(400).json({ message: 'Invalid data type' });
    }
    
    // Validate format
    const validFormats = ['json', 'csv'];
    if (!validFormats.includes(format)) {
      return res.status(400).json({ message: 'Invalid format' });
    }
    
    // Parse date range
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default to last 30 days
    const end = endDate ? new Date(endDate) : new Date();
    
    // Get data based on type
    let data;
    switch (dataType) {
      case 'events':
        data = await AnalyticsEvent.find({
          timestamp: { $gte: start, $lte: end }
        }).populate('user', 'firstName lastName email');
        break;
      case 'users':
        data = await User.find({
          createdAt: { $gte: start, $lte: end }
        }).select('-password');
        break;
      case 'missions':
        data = await UserMission.find({
          createdAt: { $gte: start, $lte: end }
        }).populate('user', 'firstName lastName email')
          .populate('mission', 'title description');
        break;
      case 'protocols':
        data = await UserProtocol.find({
          createdAt: { $gte: start, $lte: end }
        }).populate('user', 'firstName lastName email')
          .populate('protocol', 'title description');
        break;
      case 'sessions':
        // Get session data from events
        data = await getSessionData(start, end);
        break;
    }
    
    // Format data
    let formattedData;
    if (format === 'json') {
      formattedData = JSON.stringify(data, null, 2);
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=${dataType}_${start.toISOString().split('T')[0]}_to_${end.toISOString().split('T')[0]}.json`);
    } else if (format === 'csv') {
      formattedData = convertToCSV(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${dataType}_${start.toISOString().split('T')[0]}_to_${end.toISOString().split('T')[0]}.csv`);
    }
    
    res.send(formattedData);
  } catch (error) {
    console.error('Error exporting analytics data:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Helper function to calculate session metrics
async function calculateSessionMetrics(query) {
  // Get login and logout events
  const loginEvents = await AnalyticsEvent.find({
    ...query,
    eventType: 'login'
  }).sort({ timestamp: 1 });
  
  const logoutEvents = await AnalyticsEvent.find({
    ...query,
    eventType: 'logout'
  }).sort({ timestamp: 1 });
  
  // Group events by user and session
  const sessions = [];
  const userSessions = {};
  
  // Process login events
  for (const login of loginEvents) {
    const userId = login.user.toString();
    const sessionId = login.sessionId;
    
    if (!userSessions[userId]) {
      userSessions[userId] = {};
    }
    
    userSessions[userId][sessionId] = {
      start: login.timestamp,
      end: null
    };
  }
  
  // Process logout events
  for (const logout of logoutEvents) {
    const userId = logout.user.toString();
    const sessionId = logout.sessionId;
    
    if (userSessions[userId] && userSessions[userId][sessionId]) {
      userSessions[userId][sessionId].end = logout.timestamp;
    }
  }
  
  // Calculate session durations
  for (const userId in userSessions) {
    for (const sessionId in userSessions[userId]) {
      const session = userSessions[userId][sessionId];
      
      // If no logout event, use current time or max 4 hours
      if (!session.end) {
        const fourHoursLater = new Date(session.start.getTime() + 4 * 60 * 60 * 1000);
        const now = new Date();
        session.end = now < fourHoursLater ? now : fourHoursLater;
      }
      
      // Calculate duration in minutes
      const durationMs = session.end - session.start;
      const durationMinutes = durationMs / (1000 * 60);
      
      // Only count sessions longer than 1 minute
      if (durationMinutes >= 1) {
        sessions.push({
          userId,
          sessionId,
          start: session.start,
          end: session.end,
          durationMinutes
        });
      }
    }
  }
  
  // Calculate metrics
  const totalSessions = sessions.length;
  const totalDuration = sessions.reduce((sum, session) => sum + session.durationMinutes, 0);
  const averageDuration = totalSessions > 0 ? totalDuration / totalSessions : 0;
  
  // Get unique users with sessions
  const uniqueUsers = new Set(sessions.map(session => session.userId)).size;
  
  // Get sessions per user
  const sessionsPerUser = uniqueUsers > 0 ? totalSessions / uniqueUsers : 0;
  
  return {
    totalSessions,
    uniqueUsers,
    averageDuration,
    sessionsPerUser,
    totalDuration
  };
}

// Helper function to calculate user retention
async function calculateUserRetention(start, end) {
  // Get all users created before the end date
  const users = await User.find({
    createdAt: { $lte: end }
  }).select('_id createdAt');
  
  // Get login events in the period
  const loginEvents = await AnalyticsEvent.find({
    eventType: 'login',
    timestamp: { $gte: start, $lte: end }
  });
  
  // Group login events by user
  const userLogins = {};
  for (const event of loginEvents) {
    const userId = event.user.toString();
    if (!userLogins[userId]) {
      userLogins[userId] = [];
    }
    userLogins[userId].push(event.timestamp);
  }
  
  // Calculate retention by cohort (weekly)
  const cohorts = {};
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  
  for (const user of users) {
    // Determine user's cohort (week of registration)
    const cohortDate = new Date(Math.floor(user.createdAt.getTime() / weekMs) * weekMs);
    const cohortKey = cohortDate.toISOString().split('T')[0];
    
    if (!cohorts[cohortKey]) {
      cohorts[cohortKey] = {
        totalUsers: 0,
        activeUsers: {}
      };
    }
    
    cohorts[cohortKey].totalUsers++;
    
    // Check activity in subsequent weeks
    const userLoginDates = userLogins[user._id.toString()] || [];
    
    for (const loginDate of userLoginDates) {
      const weeksAfterRegistration = Math.floor((loginDate - user.createdAt) / weekMs);
      
      if (weeksAfterRegistration >= 0) {
        if (!cohorts[cohortKey].activeUsers[weeksAfterRegistration]) {
          cohorts[cohortKey].activeUsers[weeksAfterRegistration] = 0;
        }
        cohorts[cohortKey].activeUsers[weeksAfterRegistration]++;
      }
    }
  }
  
  // Format retention data
  const retentionData = [];
  for (const [cohortKey, cohort] of Object.entries(cohorts)) {
    const cohortData = {
      cohort: cohortKey,
      totalUsers: cohort.totalUsers,
      retention: {}
    };
    
    // Calculate retention percentages
    for (const [week, activeCount] of Object.entries(cohort.activeUsers)) {
      cohortData.retention[`week${week}`] = Math.round((activeCount / cohort.totalUsers) * 100);
    }
    
    retentionData.push(cohortData);
  }
  
  return retentionData.sort((a, b) => a.cohort.localeCompare(b.cohort));
}

// Helper function to get session data
async function getSessionData(start, end) {
  // Get login and logout events
  const events = await AnalyticsEvent.find({
    eventType: { $in: ['login', 'logout'] },
    timestamp: { $gte: start, $lte: end }
  }).sort({ timestamp: 1 }).populate('user', 'firstName lastName email');
  
  // Group events by session
  const sessions = {};
  
  for (const event of events) {
    const userId = event.user._id.toString();
    const sessionId = event.sessionId;
    const key = `${userId}_${sessionId}`;
    
    if (!sessions[key]) {
      sessions[key] = {
        userId,
        userEmail: event.user.email,
        userName: `${event.user.firstName} ${event.user.lastName}`,
        sessionId,
        start: null,
        end: null,
        deviceInfo: event.deviceInfo || {}
      };
    }
    
    if (event.eventType === 'login') {
      sessions[key].start = event.timestamp;
    } else if (event.eventType === 'logout') {
      sessions[key].end = event.timestamp;
    }
  }
  
  // Calculate durations and format data
  const sessionData = [];
  for (const key in sessions) {
    const session = sessions[key];
    
    // Skip sessions with no start time
    if (!session.start) continue;
    
    // If no end time, use current time or max 4 hours
    if (!session.end) {
      const fourHoursLater = new Date(session.start.getTime() + 4 * 60 * 60 * 1000);
      const now = new Date();
      session.end = now < fourHoursLater ? now : fourHoursLater;
    }
    
    // Calculate duration in minutes
    const durationMs = session.end - session.start;
    const durationMinutes = Math.round(durationMs / (1000 * 60));
    
    sessionData.push({
      ...session,
      durationMinutes
    });
  }
  
  return sessionData;
}

// Helper function to generate report data
async function generateReportData(report) {
  const { reportType, dateRange, filters } = report;
  const start = new Date(dateRange.start);
  const end = new Date(dateRange.end);
  
  switch (reportType) {
    case 'user_engagement':
      await generateUserEngagementReport(report, start, end, filters);
      break;
    case 'mission_completion':
      await generateMissionCompletionReport(report, start, end, filters);
      break;
    case 'protocol_progress':
      await generateProtocolProgressReport(report, start, end, filters);
      break;
    case 'mentor_effectiveness':
      await generateMentorEffectivenessReport(report, start, end, filters);
      break;
    case 'user_retention':
      await generateUserRetentionReport(report, start, end, filters);
      break;
    // Add other report types as needed
  }
}

// Helper function to generate user engagement report
async function generateUserEngagementReport(report, start, end, filters) {
  // Build query based on filters
  const query = {
    timestamp: { $gte: start, $lte: end }
  };
  
  if (filters && filters.userId) {
    query.user = filters.userId;
  }
  
  // Get session metrics
  const sessionMetrics = await calculateSessionMetrics(query);
  
  // Get daily active users
  const dailyActiveUsers = await AnalyticsEvent.aggregate([
    { $match: { ...query, eventType: 'login' } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }, users: { $addToSet: '$user' } } },
    { $project: { date: '$_id', count: { $size: '$users' }, _id: 0 } },
    { $sort: { date: 1 } }
  ]);
  
  // Get feature usage
  const featureUsage = await AnalyticsEvent.aggregate([
    { $match: { ...query, eventType: 'feature_used' } },
    { $group: { _id: '$metadata.feature', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);
  
  // Calculate metrics
  const totalUsers = await User.countDocuments({
    createdAt: { $lte: end }
  });
  
  const newUsers = await User.countDocuments({
    createdAt: { $gte: start, $lte: end }
  });
  
  const activeUsers = new Set(
    (await AnalyticsEvent.find({
      ...query,
      eventType: 'login'
    }).distinct('user')).map(id => id.toString())
  ).size;
  
  const activeUserPercentage = totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0;
  
  // Add metrics to report
  report.metrics = [
    { name: 'Total Users', value: totalUsers },
    { name: 'New Users', value: newUsers },
    { name: 'Active Users', value: activeUsers },
    { name: 'Active User Percentage', value: activeUserPercentage.toFixed(2) + '%' },
    { name: 'Average Session Duration', value: sessionMetrics.averageDuration.toFixed(2) + ' minutes' },
    { name: 'Sessions Per User', value: sessionMetrics.sessionsPerUser.toFixed(2) }
  ];
  
  // Add segments
  report.segments = [
    {
      name: 'Feature Usage',
      data: featureUsage.map(item => ({
        feature: item._id,
        count: item.count
      }))
    }
  ];
  
  // Add charts
  report.charts = [
    {
      title: 'Daily Active Users',
      type: 'line',
      data: {
        labels: dailyActiveUsers.map(day => day.date),
        datasets: [{
          label: 'Active Users',
          data: dailyActiveUsers.map(day => day.count)
        }]
      }
    },
    {
      title: 'Feature Usage',
      type: 'bar',
      data: {
        labels: featureUsage.map(item => item._id),
        datasets: [{
          label: 'Usage Count',
          data: featureUsage.map(item => item.count)
        }]
      }
    }
  ];
  
  // Add insights
  report.insights = [
    {
      title: 'User Engagement Summary',
      description: `${activeUsers} out of ${totalUsers} users (${activeUserPercentage.toFixed(2)}%) were active during this period. The average session duration was ${sessionMetrics.averageDuration.toFixed(2)} minutes.`,
      importance: 'high'
    }
  ];
  
  // Add recommendations
  report.recommendations = [
    {
      title: 'Improve User Retention',
      description: activeUserPercentage < 50 
        ? 'User engagement is low. Consider implementing re-engagement campaigns or improving onboarding experience.'
        : 'User engagement is good. Continue monitoring and optimizing the most used features.',
      priority: activeUserPercentage < 50 ? 'high' : 'medium'
    }
  ];
}

// Helper function to generate mission completion report
async function generateMissionCompletionReport(report, start, end, filters) {
  // Build query based on filters
  const query = {
    createdAt: { $gte: start, $lte: end }
  };
  
  if (filters && filters.userId) {
    query.user = filters.userId;
  }
  
  if (filters && filters.missionType) {
    query['mission.type'] = filters.missionType;
  }
  
  // Get mission stats
  const missionStats = await UserMission.aggregate([
    { 
      $match: query
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
  
  // Calculate completion rate
  const totalMissions = missionStats.reduce((sum, stat) => sum + stat.count, 0);
  const completedMissions = missionStats.find(stat => stat._id === 'completed')?.count || 0;
  const abandonedMissions = missionStats.find(stat => stat._id === 'abandoned')?.count || 0;
  
  const completionRate = totalMissions > 0 ? (completedMissions / totalMissions) * 100 : 0;
  const abandonmentRate = totalMissions > 0 ? (abandonedMissions / totalMissions) * 100 : 0;
  
  // Get mission popularity
  const missionPopularity = await UserMission.aggregate([
    {
      $match: query
    },
    {
      $group: {
        _id: '$mission',
        count: { $sum: 1 },
        completions: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        }
      }
    },
    {
      $sort: { count: -1 }
    },
    {
      $limit: 10
    },
    {
      $lookup: {
        from: 'missions',
        localField: '_id',
        foreignField: '_id',
        as: 'missionDetails'
      }
    },
    {
      $unwind: '$missionDetails'
    },
    {
      $project: {
        _id: 1,
        title: '$missionDetails.title',
        count: 1,
        completions: 1,
        completionRate: {
          $cond: [
            { $gt: ['$count', 0] },
            { $multiply: [{ $divide: ['$completions', '$count'] }, 100] },
            0
          ]
        }
      }
    }
  ]);
  
  // Add metrics to report
  report.metrics = [
    { name: 'Total Missions', value: totalMissions },
    { name: 'Completed Missions', value: completedMissions },
    { name: 'Abandoned Missions', value: abandonedMissions },
    { name: 'Completion Rate', value: completionRate.toFixed(2) + '%' },
    { name: 'Abandonment Rate', value: abandonmentRate.toFixed(2) + '%' }
  ];
  
  // Add segments
  report.segments = [
    {
      name: 'Mission Status',
      data: missionStats.map(item => ({
        status: item._id,
        count: item.count
      }))
    },
    {
      name: 'Popular Missions',
      data: missionPopularity
    }
  ];
  
  // Add charts
  report.charts = [
    {
      title: 'Mission Status Distribution',
      type: 'pie',
      data: {
        labels: missionStats.map(item => item._id),
        datasets: [{
          data: missionStats.map(item => item.count)
        }]
      }
    },
    {
      title: 'Mission Popularity',
      type: 'bar',
      data: {
        labels: missionPopularity.map(item => item.title),
        datasets: [{
          label: 'Assigned Count',
          data: missionPopularity.map(item => item.count)
        }, {
          label: 'Completion Count',
          data: missionPopularity.map(item => item.completions)
        }]
      }
    }
  ];
  
  // Add insights
  report.insights = [
    {
      title: 'Mission Completion Summary',
      description: `${completedMissions} out of ${totalMissions} missions (${completionRate.toFixed(2)}%) were completed during this period.`,
      importance: 'high'
    }
  ];
  
  // Add recommendations
  report.recommendations = [
    {
      title: 'Improve Mission Completion Rate',
      description: completionRate < 50 
        ? 'Mission completion rate is low. Consider reviewing mission difficulty and providing more guidance.'
        : 'Mission completion rate is good. Continue monitoring and optimizing the most popular missions.',
      priority: completionRate < 50 ? 'high' : 'medium'
    }
  ];
}

// Helper function to convert data to CSV
function convertToCSV(data) {
  if (!data || data.length === 0) {
    return '';
  }
  
  // Get headers
  const headers = Object.keys(data[0].toObject ? data[0].toObject() : data[0]);
  
  // Create CSV rows
  const csvRows = [];
  
  // Add header row
  csvRows.push(headers.join(','));
  
  // Add data rows
  for (const item of data) {
    const values = headers.map(header => {
      const value = item[header];
      
      // Handle different value types
      if (value === null || value === undefined) {
        return '';
      } else if (typeof value === 'object') {
        if (value instanceof Date) {
          return value.toISOString();
        } else {
          return JSON.stringify(value).replace(/"/g, '""');
        }
      } else {
        return String(value).replace(/"/g, '""');
      }
    });
    
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}
