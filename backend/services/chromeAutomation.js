/**
 * Chrome Automation Service
 * Quản lý Chrome profiles và automation
 */

import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import logger from './logger.js';

const execAsync = promisify(exec);

class ChromeAutomationService {
  constructor() {
    this.browsers = new Map(); // Store active browser instances
    this.profiles = new Map(); // Store profile configurations
    this.profilesPath = process.env.CHROME_PROFILES_PATH || './chrome-profiles';
    this.defaultUserAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    
    this.initializeProfilesDirectory();
  }

  async initializeProfilesDirectory() {
    try {
      await fs.mkdir(this.profilesPath, { recursive: true });
      logger.info('Chrome profiles directory initialized');
    } catch (error) {
      logger.error('Failed to initialize profiles directory:', error);
    }
  }

  /**
   * Tạo Chrome profile mới
   */
  async createProfile(profileName, options = {}) {
    try {
      const profilePath = path.join(this.profilesPath, profileName);
      
      // Tạo thư mục profile
      await fs.mkdir(profilePath, { recursive: true });
      
      // Cấu hình profile
      const profileConfig = {
        name: profileName,
        path: profilePath,
        userAgent: options.userAgent || this.defaultUserAgent,
        viewport: options.viewport || { width: 1366, height: 768 },
        proxy: options.proxy || null,
        extensions: options.extensions || [],
        cookies: options.cookies || [],
        localStorage: options.localStorage || {},
        created: new Date().toISOString(),
        lastUsed: null,
        settings: {
          clearCookiesOnStart: options.clearCookiesOnStart || false,
          clearHistoryOnStart: options.clearHistoryOnStart || false,
          incognito: options.incognito || false,
          headless: options.headless || false,
          ...options.settings
        }
      };

      // Lưu cấu hình profile
      const configPath = path.join(profilePath, 'profile-config.json');
      await fs.writeFile(configPath, JSON.stringify(profileConfig, null, 2));
      
      this.profiles.set(profileName, profileConfig);
      
      logger.info(`Chrome profile created: ${profileName}`);
      return { success: true, profileName, path: profilePath };
      
    } catch (error) {
      logger.error(`Failed to create profile ${profileName}:`, error);
      throw error;
    }
  }

  /**
   * Mở Chrome profile
   */
  async openProfile(profileName, website = null) {
    try {
      if (this.browsers.has(profileName)) {
        logger.info(`Profile ${profileName} already open`);
        const browser = this.browsers.get(profileName);
        
        if (website) {
          const pages = await browser.pages();
          const page = pages[0] || await browser.newPage();
          await page.goto(website);
        }
        
        return { success: true, message: 'Profile already open' };
      }

      const profileConfig = await this.loadProfileConfig(profileName);
      if (!profileConfig) {
        throw new Error(`Profile ${profileName} not found`);
      }

      // Launch browser với profile
      const browser = await puppeteer.launch({
        headless: profileConfig.settings.headless,
        userDataDir: profileConfig.path,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu',
          `--user-agent=${profileConfig.userAgent}`,
          ...(profileConfig.proxy ? [`--proxy-server=${profileConfig.proxy}`] : [])
        ],
        defaultViewport: profileConfig.viewport
      });

      this.browsers.set(profileName, browser);
      
      // Mở trang web nếu được chỉ định
      if (website) {
        const page = await browser.newPage();
        
        // Set cookies nếu có
        if (profileConfig.cookies.length > 0) {
          await page.setCookie(...profileConfig.cookies);
        }
        
        // Set localStorage nếu có
        if (Object.keys(profileConfig.localStorage).length > 0) {
          await page.evaluateOnNewDocument((localStorage) => {
            for (const [key, value] of Object.entries(localStorage)) {
              window.localStorage.setItem(key, value);
            }
          }, profileConfig.localStorage);
        }
        
        await page.goto(website, { waitUntil: 'networkidle2' });
      }

      // Cập nhật lastUsed
      profileConfig.lastUsed = new Date().toISOString();
      await this.saveProfileConfig(profileName, profileConfig);
      
      logger.info(`Chrome profile opened: ${profileName}`);
      return { success: true, profileName, website };
      
    } catch (error) {
      logger.error(`Failed to open profile ${profileName}:`, error);
      throw error;
    }
  }

  /**
   * Đóng Chrome profile
   */
  async closeProfile(profileName) {
    try {
      if (!this.browsers.has(profileName)) {
        return { success: true, message: 'Profile not open' };
      }

      const browser = this.browsers.get(profileName);
      await browser.close();
      this.browsers.delete(profileName);
      
      logger.info(`Chrome profile closed: ${profileName}`);
      return { success: true, profileName };
      
    } catch (error) {
      logger.error(`Failed to close profile ${profileName}:`, error);
      throw error;
    }
  }

  /**
   * Cấu hình Chrome profile
   */
  async configureProfile(profileName, settings) {
    try {
      const profileConfig = await this.loadProfileConfig(profileName);
      if (!profileConfig) {
        throw new Error(`Profile ${profileName} not found`);
      }

      // Cập nhật settings
      profileConfig.settings = { ...profileConfig.settings, ...settings };
      
      // Xử lý các settings đặc biệt
      if (settings.clearCookies) {
        await this.clearProfileCookies(profileName);
      }
      
      if (settings.clearHistory) {
        await this.clearProfileHistory(profileName);
      }
      
      if (settings.userAgent) {
        profileConfig.userAgent = settings.userAgent;
      }
      
      if (settings.viewport) {
        profileConfig.viewport = settings.viewport;
      }

      await this.saveProfileConfig(profileName, profileConfig);
      
      logger.info(`Profile configured: ${profileName}`);
      return { success: true, profileName, settings };
      
    } catch (error) {
      logger.error(`Failed to configure profile ${profileName}:`, error);
      throw error;
    }
  }

  /**
   * Lấy danh sách profiles
   */
  async getProfiles() {
    try {
      const profiles = [];
      const profileDirs = await fs.readdir(this.profilesPath);
      
      for (const dir of profileDirs) {
        const configPath = path.join(this.profilesPath, dir, 'profile-config.json');
        try {
          const config = await fs.readFile(configPath, 'utf8');
          const profileConfig = JSON.parse(config);
          profiles.push({
            name: profileConfig.name,
            created: profileConfig.created,
            lastUsed: profileConfig.lastUsed,
            isOpen: this.browsers.has(profileConfig.name),
            settings: profileConfig.settings
          });
        } catch (error) {
          // Skip invalid profiles
          continue;
        }
      }
      
      return profiles;
      
    } catch (error) {
      logger.error('Failed to get profiles:', error);
      throw error;
    }
  }

  /**
   * Xóa profile
   */
  async deleteProfile(profileName) {
    try {
      // Đóng browser nếu đang mở
      if (this.browsers.has(profileName)) {
        await this.closeProfile(profileName);
      }
      
      // Xóa thư mục profile
      const profilePath = path.join(this.profilesPath, profileName);
      await fs.rm(profilePath, { recursive: true, force: true });
      
      this.profiles.delete(profileName);
      
      logger.info(`Profile deleted: ${profileName}`);
      return { success: true, profileName };
      
    } catch (error) {
      logger.error(`Failed to delete profile ${profileName}:`, error);
      throw error;
    }
  }

  /**
   * Thực hiện automation task
   */
  async executeAutomationTask(profileName, task) {
    try {
      if (!this.browsers.has(profileName)) {
        throw new Error(`Profile ${profileName} not open`);
      }

      const browser = this.browsers.get(profileName);
      const pages = await browser.pages();
      const page = pages[0] || await browser.newPage();

      let result;
      
      switch (task.type) {
        case 'navigate':
          await page.goto(task.url, { waitUntil: 'networkidle2' });
          result = { success: true, action: 'navigate', url: task.url };
          break;
          
        case 'fill_form':
          for (const field of task.fields) {
            await page.waitForSelector(field.selector);
            await page.type(field.selector, field.value);
          }
          result = { success: true, action: 'fill_form', fields: task.fields.length };
          break;
          
        case 'click':
          await page.waitForSelector(task.selector);
          await page.click(task.selector);
          result = { success: true, action: 'click', selector: task.selector };
          break;
          
        case 'screenshot':
          const screenshot = await page.screenshot({ 
            fullPage: task.fullPage || false,
            encoding: 'base64'
          });
          result = { success: true, action: 'screenshot', data: screenshot };
          break;
          
        case 'get_cookies':
          const cookies = await page.cookies();
          result = { success: true, action: 'get_cookies', cookies };
          break;
          
        case 'set_cookies':
          await page.setCookie(...task.cookies);
          result = { success: true, action: 'set_cookies', count: task.cookies.length };
          break;
          
        default:
          throw new Error(`Unknown task type: ${task.type}`);
      }
      
      logger.info(`Automation task executed: ${task.type} on ${profileName}`);
      return result;
      
    } catch (error) {
      logger.error(`Failed to execute automation task:`, error);
      throw error;
    }
  }

  /**
   * Load profile configuration
   */
  async loadProfileConfig(profileName) {
    try {
      const configPath = path.join(this.profilesPath, profileName, 'profile-config.json');
      const config = await fs.readFile(configPath, 'utf8');
      return JSON.parse(config);
    } catch (error) {
      return null;
    }
  }

  /**
   * Save profile configuration
   */
  async saveProfileConfig(profileName, config) {
    const configPath = path.join(this.profilesPath, profileName, 'profile-config.json');
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    this.profiles.set(profileName, config);
  }

  /**
   * Clear profile cookies
   */
  async clearProfileCookies(profileName) {
    try {
      if (this.browsers.has(profileName)) {
        const browser = this.browsers.get(profileName);
        const pages = await browser.pages();
        for (const page of pages) {
          const cookies = await page.cookies();
          await page.deleteCookie(...cookies);
        }
      }
      
      // Also clear from profile directory
      const cookiesPath = path.join(this.profilesPath, profileName, 'Default', 'Cookies');
      try {
        await fs.unlink(cookiesPath);
      } catch (error) {
        // File might not exist, ignore
      }
      
    } catch (error) {
      logger.error(`Failed to clear cookies for ${profileName}:`, error);
    }
  }

  /**
   * Clear profile history
   */
  async clearProfileHistory(profileName) {
    try {
      const historyPath = path.join(this.profilesPath, profileName, 'Default', 'History');
      try {
        await fs.unlink(historyPath);
      } catch (error) {
        // File might not exist, ignore
      }
      
    } catch (error) {
      logger.error(`Failed to clear history for ${profileName}:`, error);
    }
  }

  /**
   * Cleanup - đóng tất cả browsers
   */
  async cleanup() {
    try {
      const promises = [];
      for (const [profileName, browser] of this.browsers) {
        promises.push(browser.close());
      }
      await Promise.all(promises);
      this.browsers.clear();
      
      logger.info('Chrome automation cleanup completed');
    } catch (error) {
      logger.error('Failed to cleanup Chrome automation:', error);
    }
  }
}

export default new ChromeAutomationService();
