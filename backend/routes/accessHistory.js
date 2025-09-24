/**
 * Access History API Routes
 * Handles access history tracking and management
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// Mock access history data
let accessHistory = new Map();

// Initialize with sample data
const sampleHistory = [
  {
    id: 1,
    time: new Date(Date.now() - 2 * 60 * 60 * 1000),
    link: 'banking.vietcombank.com.vn',
    account: 'nguyenvana@gmail.com',
    password: '********',
    otp: '123456',
    ip: '192.168.1.50',
    status: 'success',
    profile: 'Profile_001',
    notification: 'Đăng nhập thành công',
    browser: 'Chrome 120',
    device: 'Windows 11',
    location: 'Hà Nội, VN',
    duration: '00:02:45',
    dataExtracted: '2.1MB',
    notes: 'Login successful, data extracted'
  },
  {
    id: 2,
    time: new Date(Date.now() - 4 * 60 * 60 * 1000),
    link: 'facebook.com',
    account: 'user.test@gmail.com',
    password: '********',
    otp: null,
    ip: '192.168.1.51',
    status: 'failed',
    profile: 'Profile_002',
    notification: 'Captcha required',
    browser: 'Firefox 121',
    device: 'Windows 10',
    location: 'TP.HCM, VN',
    duration: '00:01:20',
    dataExtracted: '0MB',
    notes: 'Failed due to captcha challenge'
  },
  {
    id: 3,
    time: new Date(Date.now() - 6 * 60 * 60 * 1000),
    link: 'gmail.com',
    account: 'testuser123@gmail.com',
    password: '********',
    otp: '789012',
    ip: '192.168.1.52',
    status: 'success',
    profile: 'Profile_003',
    notification: 'Email access granted',
    browser: 'Edge 119',
    device: 'Windows 11',
    location: 'Đà Nẵng, VN',
    duration: '00:03:15',
    dataExtracted: '5.7MB',
    notes: 'Email data successfully extracted'
  }
];

sampleHistory.forEach(item => {
  accessHistory.set(item.id, item);
});

// Get access history with filtering and pagination
router.get('/', (req, res) => {
  const {
    page = 1,
    limit = 50,
    status,
    website,
    profile,
    startDate,
    endDate,
    search
  } = req.query;

  let filteredHistory = Array.from(accessHistory.values());

  // Apply filters
  if (status) {
    filteredHistory = filteredHistory.filter(item => item.status === status);
  }

  if (website) {
    filteredHistory = filteredHistory.filter(item => 
      item.link.toLowerCase().includes(website.toLowerCase())
    );
  }

  if (profile) {
    filteredHistory = filteredHistory.filter(item => item.profile === profile);
  }

  if (startDate) {
    const start = new Date(startDate);
    filteredHistory = filteredHistory.filter(item => new Date(item.time) >= start);
  }

  if (endDate) {
    const end = new Date(endDate);
    filteredHistory = filteredHistory.filter(item => new Date(item.time) <= end);
  }

  if (search) {
    const searchLower = search.toLowerCase();
    filteredHistory = filteredHistory.filter(item =>
      item.link.toLowerCase().includes(searchLower) ||
      item.account.toLowerCase().includes(searchLower) ||
      item.notification.toLowerCase().includes(searchLower) ||
      item.notes.toLowerCase().includes(searchLower)
    );
  }

  // Sort by time (newest first)
  filteredHistory.sort((a, b) => new Date(b.time) - new Date(a.time));

  // Pagination
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const startIndex = (pageNum - 1) * limitNum;
  const endIndex = startIndex + limitNum;
  const paginatedHistory = filteredHistory.slice(startIndex, endIndex);

  res.json({
    success: true,
    data: paginatedHistory,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: filteredHistory.length,
      pages: Math.ceil(filteredHistory.length / limitNum)
    },
    timestamp: new Date().toISOString()
  });
});

// Get specific access history entry
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const entry = accessHistory.get(parseInt(id));

  if (!entry) {
    return res.status(404).json({
      success: false,
      message: 'Access history entry not found'
    });
  }

  res.json({
    success: true,
    data: entry,
    timestamp: new Date().toISOString()
  });
});

// Create new access history entry
router.post('/', [
  body('link').isURL().withMessage('Valid URL is required'),
  body('account').notEmpty().withMessage('Account is required'),
  body('status').isIn(['success', 'failed', 'pending']).withMessage('Invalid status'),
  body('profile').notEmpty().withMessage('Profile is required')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const {
    link,
    account,
    password,
    otp,
    ip,
    status,
    profile,
    notification,
    browser,
    device,
    location,
    duration,
    dataExtracted,
    notes
  } = req.body;

  const newId = Math.max(...Array.from(accessHistory.keys())) + 1;
  const newEntry = {
    id: newId,
    time: new Date(),
    link,
    account,
    password: password || '********',
    otp: otp || null,
    ip: ip || '192.168.1.1',
    status,
    profile,
    notification: notification || 'Access attempt recorded',
    browser: browser || 'Unknown',
    device: device || 'Unknown',
    location: location || 'Unknown',
    duration: duration || '00:00:00',
    dataExtracted: dataExtracted || '0MB',
    notes: notes || ''
  };

  accessHistory.set(newId, newEntry);

  res.json({
    success: true,
    data: newEntry,
    message: 'Access history entry created successfully'
  });
});

// Update access history entry
router.put('/:id', [
  body('status').optional().isIn(['success', 'failed', 'pending']).withMessage('Invalid status'),
  body('notes').optional().isString()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { id } = req.params;
  const entry = accessHistory.get(parseInt(id));

  if (!entry) {
    return res.status(404).json({
      success: false,
      message: 'Access history entry not found'
    });
  }

  // Update allowed fields
  const allowedUpdates = ['status', 'notes', 'notification', 'duration', 'dataExtracted'];
  allowedUpdates.forEach(field => {
    if (req.body[field] !== undefined) {
      entry[field] = req.body[field];
    }
  });

  entry.updatedAt = new Date();
  accessHistory.set(parseInt(id), entry);

  res.json({
    success: true,
    data: entry,
    message: 'Access history entry updated successfully'
  });
});

// Delete access history entry
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const entry = accessHistory.get(parseInt(id));

  if (!entry) {
    return res.status(404).json({
      success: false,
      message: 'Access history entry not found'
    });
  }

  accessHistory.delete(parseInt(id));

  res.json({
    success: true,
    message: 'Access history entry deleted successfully'
  });
});

// Get access statistics
router.get('/stats/summary', (req, res) => {
  const entries = Array.from(accessHistory.values());
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const stats = {
    total: entries.length,
    successful: entries.filter(e => e.status === 'success').length,
    failed: entries.filter(e => e.status === 'failed').length,
    pending: entries.filter(e => e.status === 'pending').length,
    today: entries.filter(e => new Date(e.time) >= today).length,
    thisWeek: entries.filter(e => new Date(e.time) >= thisWeek).length,
    thisMonth: entries.filter(e => new Date(e.time) >= thisMonth).length,
    byWebsite: {},
    byProfile: {},
    byStatus: {
      success: entries.filter(e => e.status === 'success').length,
      failed: entries.filter(e => e.status === 'failed').length,
      pending: entries.filter(e => e.status === 'pending').length
    }
  };

  // Count by website
  entries.forEach(entry => {
    const domain = entry.link.split('/')[0];
    stats.byWebsite[domain] = (stats.byWebsite[domain] || 0) + 1;
  });

  // Count by profile
  entries.forEach(entry => {
    stats.byProfile[entry.profile] = (stats.byProfile[entry.profile] || 0) + 1;
  });

  res.json({
    success: true,
    data: stats,
    timestamp: new Date().toISOString()
  });
});

// Bulk operations
router.post('/bulk', [
  body('action').isIn(['delete', 'update_status']).withMessage('Invalid bulk action'),
  body('ids').isArray().withMessage('IDs array is required'),
  body('data').optional().isObject()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { action, ids, data = {} } = req.body;
  const results = [];

  ids.forEach(id => {
    const entry = accessHistory.get(parseInt(id));
    if (entry) {
      if (action === 'delete') {
        accessHistory.delete(parseInt(id));
        results.push({ id, status: 'deleted' });
      } else if (action === 'update_status' && data.status) {
        entry.status = data.status;
        entry.updatedAt = new Date();
        accessHistory.set(parseInt(id), entry);
        results.push({ id, status: 'updated' });
      }
    } else {
      results.push({ id, status: 'not_found' });
    }
  });

  res.json({
    success: true,
    data: results,
    message: `Bulk ${action} completed`,
    timestamp: new Date().toISOString()
  });
});

export default router;
