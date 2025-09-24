/**
 * Chrome Automation API Routes
 * Endpoints cho quản lý Chrome profiles và automation
 */

import express from 'express';
import chromeAutomation from '../services/chromeAutomation.js';
import { validateInput, commonSchemas } from '../middleware/validation.js';
import logger from '../services/logger.js';

const router = express.Router();

/**
 * GET /api/chrome/profiles
 * Lấy danh sách tất cả Chrome profiles
 */
router.get('/profiles', async (req, res) => {
  try {
    const profiles = await chromeAutomation.getProfiles();
    res.json({
      success: true,
      data: profiles,
      count: profiles.length
    });
  } catch (error) {
    logger.error('Failed to get Chrome profiles:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get Chrome profiles',
      message: error.message
    });
  }
});

/**
 * POST /api/chrome/profiles
 * Tạo Chrome profile mới
 */
router.post('/profiles', validateInput({
  name: { type: 'string', required: true, minLength: 1 },
  userAgent: { type: 'string', required: false },
  viewport: { type: 'object', required: false },
  proxy: { type: 'string', required: false },
  settings: { type: 'object', required: false }
}), async (req, res) => {
  try {
    const { name, ...options } = req.body;
    const result = await chromeAutomation.createProfile(name, options);
    
    res.json({
      success: true,
      data: result,
      message: `Profile ${name} created successfully`
    });
  } catch (error) {
    logger.error('Failed to create Chrome profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create Chrome profile',
      message: error.message
    });
  }
});

/**
 * POST /api/chrome/profiles/:name/open
 * Mở Chrome profile
 */
router.post('/profiles/:name/open', validateInput({
  website: { type: 'string', required: false }
}), async (req, res) => {
  try {
    const { name } = req.params;
    const { website } = req.body;
    
    const result = await chromeAutomation.openProfile(name, website);
    
    res.json({
      success: true,
      data: result,
      message: `Profile ${name} opened successfully`
    });
  } catch (error) {
    logger.error(`Failed to open Chrome profile ${req.params.name}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to open Chrome profile',
      message: error.message
    });
  }
});

/**
 * POST /api/chrome/profiles/:name/close
 * Đóng Chrome profile
 */
router.post('/profiles/:name/close', async (req, res) => {
  try {
    const { name } = req.params;
    const result = await chromeAutomation.closeProfile(name);
    
    res.json({
      success: true,
      data: result,
      message: `Profile ${name} closed successfully`
    });
  } catch (error) {
    logger.error(`Failed to close Chrome profile ${req.params.name}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to close Chrome profile',
      message: error.message
    });
  }
});

/**
 * PUT /api/chrome/profiles/:name/config
 * Cấu hình Chrome profile
 */
router.put('/profiles/:name/config', validateInput({
  settings: { type: 'object', required: true }
}), async (req, res) => {
  try {
    const { name } = req.params;
    const { settings } = req.body;
    
    const result = await chromeAutomation.configureProfile(name, settings);
    
    res.json({
      success: true,
      data: result,
      message: `Profile ${name} configured successfully`
    });
  } catch (error) {
    logger.error(`Failed to configure Chrome profile ${req.params.name}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to configure Chrome profile',
      message: error.message
    });
  }
});

/**
 * DELETE /api/chrome/profiles/:name
 * Xóa Chrome profile
 */
router.delete('/profiles/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const result = await chromeAutomation.deleteProfile(name);
    
    res.json({
      success: true,
      data: result,
      message: `Profile ${name} deleted successfully`
    });
  } catch (error) {
    logger.error(`Failed to delete Chrome profile ${req.params.name}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete Chrome profile',
      message: error.message
    });
  }
});

/**
 * POST /api/chrome/profiles/:name/automation
 * Thực hiện automation task
 */
router.post('/profiles/:name/automation', validateInput({
  task: { type: 'object', required: true }
}), async (req, res) => {
  try {
    const { name } = req.params;
    const { task } = req.body;
    
    const result = await chromeAutomation.executeAutomationTask(name, task);
    
    res.json({
      success: true,
      data: result,
      message: `Automation task executed on profile ${name}`
    });
  } catch (error) {
    logger.error(`Failed to execute automation task on ${req.params.name}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to execute automation task',
      message: error.message
    });
  }
});

/**
 * POST /api/chrome/profiles/:name/screenshot
 * Chụp screenshot của profile
 */
router.post('/profiles/:name/screenshot', validateInput({
  fullPage: { type: 'boolean', required: false }
}), async (req, res) => {
  try {
    const { name } = req.params;
    const { fullPage = false } = req.body;
    
    const result = await chromeAutomation.executeAutomationTask(name, {
      type: 'screenshot',
      fullPage
    });
    
    res.json({
      success: true,
      data: result,
      message: `Screenshot taken for profile ${name}`
    });
  } catch (error) {
    logger.error(`Failed to take screenshot for ${req.params.name}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to take screenshot',
      message: error.message
    });
  }
});

/**
 * GET /api/chrome/profiles/:name/cookies
 * Lấy cookies của profile
 */
router.get('/profiles/:name/cookies', async (req, res) => {
  try {
    const { name } = req.params;
    
    const result = await chromeAutomation.executeAutomationTask(name, {
      type: 'get_cookies'
    });
    
    res.json({
      success: true,
      data: result.cookies,
      message: `Cookies retrieved for profile ${name}`
    });
  } catch (error) {
    logger.error(`Failed to get cookies for ${req.params.name}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to get cookies',
      message: error.message
    });
  }
});

/**
 * POST /api/chrome/profiles/:name/cookies
 * Set cookies cho profile
 */
router.post('/profiles/:name/cookies', validateInput({
  cookies: { type: 'array', required: true }
}), async (req, res) => {
  try {
    const { name } = req.params;
    const { cookies } = req.body;
    
    const result = await chromeAutomation.executeAutomationTask(name, {
      type: 'set_cookies',
      cookies
    });
    
    res.json({
      success: true,
      data: result,
      message: `Cookies set for profile ${name}`
    });
  } catch (error) {
    logger.error(`Failed to set cookies for ${req.params.name}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to set cookies',
      message: error.message
    });
  }
});

/**
 * POST /api/chrome/cleanup
 * Cleanup tất cả Chrome processes
 */
router.post('/cleanup', async (req, res) => {
  try {
    await chromeAutomation.cleanup();
    
    res.json({
      success: true,
      message: 'Chrome automation cleanup completed'
    });
  } catch (error) {
    logger.error('Failed to cleanup Chrome automation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cleanup Chrome automation',
      message: error.message
    });
  }
});

export default router;
