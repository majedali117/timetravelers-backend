const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const adminController = require('../controllers/adminController');
const auth = require('../middleware/authorize');

// All routes require admin role
const adminAuth = auth('admin');

// @route   POST /api/v1/admin/dashboards
// @desc    Create admin dashboard
// @access  Private (Admin only)
router.post('/dashboards',
  adminAuth,
  [
    check('title', 'Title is required').notEmpty(),
    check('layout', 'Layout must be valid').optional().isIn(['grid', 'list', 'custom'])
  ],
  adminController.createDashboard
);

// @route   GET /api/v1/admin/dashboards
// @desc    Get all admin dashboards
// @access  Private (Admin only)
router.get('/dashboards', adminAuth, adminController.getAllDashboards);

// @route   GET /api/v1/admin/dashboards/:id
// @desc    Get admin dashboard by ID
// @access  Private (Admin only)
router.get('/dashboards/:id', adminAuth, adminController.getDashboard);

// @route   PUT /api/v1/admin/dashboards/:id
// @desc    Update admin dashboard
// @access  Private (Admin only)
router.put('/dashboards/:id',
  adminAuth,
  [
    check('title', 'Title is required').optional().notEmpty(),
    check('layout', 'Layout must be valid').optional().isIn(['grid', 'list', 'custom'])
  ],
  adminController.updateDashboard
);

// @route   DELETE /api/v1/admin/dashboards/:id
// @desc    Delete admin dashboard
// @access  Private (Admin only)
router.delete('/dashboards/:id', adminAuth, adminController.deleteDashboard);

// @route   GET /api/v1/admin/widget-data
// @desc    Get admin dashboard widget data
// @access  Private (Admin only)
router.get('/widget-data', adminAuth, adminController.getWidgetData);

// @route   GET /api/v1/admin/system-overview
// @desc    Get system overview
// @access  Private (Admin only)
router.get('/system-overview', adminAuth, adminController.getSystemOverview);

module.exports = router;
