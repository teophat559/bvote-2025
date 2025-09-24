/**
 * Chrome Automation Service
 * Handles Chrome DevTools Protocol for automated login
 */

import { spawn } from 'child_process';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

class ChromeAutomationService {
  constructor() {
    this.profiles = new Map();
    this.activeProfiles = new Set();
    this.chromeProcesses = new Map();
    this.debugPorts = new Map();
    this.basePort = 9222;
  }

  // Initialize Chrome profile
  async initializeProfile(profileId, config = {}) {
    const profileData = {
      id: profileId,
      name: config.name || `Profile-${profileId}`,
      userDataDir: join(__dirname, 'chrome-profiles', profileId),
      debugPort: this.basePort + this.profiles.size,
      platform: config.platform || 'facebook',
      status: 'inactive',
      createdAt: new Date().toISOString(),
      lastUsed: null
    };

    this.profiles.set(profileId, profileData);
    this.debugPorts.set(profileId, profileData.debugPort);

    return profileData;
  }

  // Open Chrome profile with DevTools
  async openProfile(profileId, options = {}) {
    const profile = this.profiles.get(profileId);
    if (!profile) {
      throw new Error(`Profile ${profileId} not found`);
    }

    if (this.activeProfiles.has(profileId)) {
      return { success: false, error: 'Profile already active' };
    }

    try {
      const chromeArgs = [
        `--user-data-dir=${profile.userDataDir}`,
        `--remote-debugging-port=${profile.debugPort}`,
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-extensions',
        '--disable-plugins',
        '--disable-images',
        '--disable-javascript', // Will enable selectively
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--headless=new' // Use new headless mode
      ];

      if (options.visible) {
        chromeArgs.pop(); // Remove headless
        chromeArgs.push('--window-size=1280,720');
      }

      const chromeProcess = spawn('chrome', chromeArgs, {
        stdio: 'pipe',
        detached: false
      });

      this.chromeProcesses.set(profileId, chromeProcess);
      this.activeProfiles.add(profileId);

      profile.status = 'active';
      profile.lastUsed = new Date().toISOString();
      profile.pid = chromeProcess.pid;

      // Wait for Chrome to start
      await this.waitForDebugger(profile.debugPort);

      console.log(`🔧 Chrome profile ${profileId} opened on port ${profile.debugPort}`);

      return {
        success: true,
        profileId,
        debugPort: profile.debugPort,
        pid: chromeProcess.pid
      };

    } catch (error) {
      console.error(`Failed to open Chrome profile ${profileId}:`, error);
      return { success: false, error: error.message };
    }
  }

  // Close Chrome profile
  async closeProfile(profileId) {
    const profile = this.profiles.get(profileId);
    if (!profile) {
      return { success: false, error: 'Profile not found' };
    }

    const chromeProcess = this.chromeProcesses.get(profileId);
    if (chromeProcess) {
      try {
        chromeProcess.kill('SIGTERM');

        // Wait for graceful shutdown
        setTimeout(() => {
          if (!chromeProcess.killed) {
            chromeProcess.kill('SIGKILL');
          }
        }, 5000);

        this.chromeProcesses.delete(profileId);
        this.activeProfiles.delete(profileId);

        profile.status = 'inactive';
        profile.pid = null;

        console.log(`🔧 Chrome profile ${profileId} closed`);
        return { success: true, profileId };

      } catch (error) {
        console.error(`Failed to close Chrome profile ${profileId}:`, error);
        return { success: false, error: error.message };
      }
    }

    return { success: false, error: 'Profile not active' };
  }

  // Batch operations
  async openProfiles(profileIds, options = {}) {
    const results = [];

    for (const profileId of profileIds) {
      const result = await this.openProfile(profileId, options);
      results.push({ profileId, ...result });

      // Stagger profile opening to avoid resource conflicts
      if (results.length < profileIds.length) {
        await this.sleep(2000);
      }
    }

    return {
      success: true,
      results,
      totalOpened: results.filter(r => r.success).length
    };
  }

  async closeProfiles(profileIds) {
    const results = [];

    for (const profileId of profileIds) {
      const result = await this.closeProfile(profileId);
      results.push({ profileId, ...result });
    }

    return {
      success: true,
      results,
      totalClosed: results.filter(r => r.success).length
    };
  }

  // Clear cookies and data
  async clearProfileData(profileId) {
    const profile = this.profiles.get(profileId);
    if (!profile) {
      return { success: false, error: 'Profile not found' };
    }

    try {
      // If profile is active, send DevTools command
      if (this.activeProfiles.has(profileId)) {
        await this.sendDevToolsCommand(profileId, 'Network.clearBrowserCookies');
        await this.sendDevToolsCommand(profileId, 'Storage.clearDataForOrigin', {
          origin: '*',
          storageTypes: 'all'
        });
      }

      console.log(`🧹 Cleared data for profile ${profileId}`);
      return { success: true, profileId };

    } catch (error) {
      console.error(`Failed to clear profile ${profileId}:`, error);
      return { success: false, error: error.message };
    }
  }

  // Execute automated login
  async executeAutoLogin(profileId, platform, credentials) {
    const profile = this.profiles.get(profileId);
    if (!profile) {
      return { success: false, error: 'Profile not found' };
    }

    if (!this.activeProfiles.has(profileId)) {
      const openResult = await this.openProfile(profileId);
      if (!openResult.success) {
        return openResult;
      }
    }

    try {
      // Platform-specific login automation
      const loginResult = await this.performLogin(profileId, platform, credentials);

      return {
        success: loginResult.success,
        profileId,
        platform,
        result: loginResult,
        completedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error(`Auto login failed for ${profileId}:`, error);
      return {
        success: false,
        profileId,
        platform,
        error: error.message
      };
    }
  }

  // Platform-specific login implementations
  async performLogin(profileId, platform, credentials) {
    const loginStrategies = {
      facebook: () => this.loginFacebook(profileId, credentials),
      google: () => this.loginGoogle(profileId, credentials),
      instagram: () => this.loginInstagram(profileId, credentials),
      zalo: () => this.loginZalo(profileId, credentials),
      yahoo: () => this.loginYahoo(profileId, credentials),
      microsoft: () => this.loginMicrosoft(profileId, credentials)
    };

    const strategy = loginStrategies[platform.toLowerCase()];
    if (!strategy) {
      throw new Error(`Unsupported platform: ${platform}`);
    }

    return await strategy();
  }

  // Facebook login automation
  async loginFacebook(profileId, credentials) {
    try {
      // Navigate to Facebook login
      await this.navigateToUrl(profileId, 'https://www.facebook.com/login');

      // Wait for page load
      await this.sleep(3000);

      // Fill credentials
      await this.fillInput(profileId, '#email', credentials.email || credentials.username);
      await this.fillInput(profileId, '#pass', credentials.password);

      // Click login button
      await this.clickElement(profileId, '#loginbutton');

      // Wait for login result
      await this.sleep(5000);

      // Check if login successful (look for home page elements)
      const isLoggedIn = await this.checkElement(profileId, '[role="main"]');

      return {
        success: isLoggedIn,
        platform: 'facebook',
        message: isLoggedIn ? 'Login successful' : 'Login failed'
      };

    } catch (error) {
      return {
        success: false,
        platform: 'facebook',
        error: error.message
      };
    }
  }

  // Google login automation
  async loginGoogle(profileId, credentials) {
    try {
      await this.navigateToUrl(profileId, 'https://accounts.google.com/signin');
      await this.sleep(3000);

      await this.fillInput(profileId, '#identifierId', credentials.email);
      await this.clickElement(profileId, '#identifierNext');
      await this.sleep(3000);

      await this.fillInput(profileId, 'input[type="password"]', credentials.password);
      await this.clickElement(profileId, '#passwordNext');
      await this.sleep(5000);

      const isLoggedIn = await this.checkElement(profileId, '[data-ogsr-up=""]');

      return {
        success: isLoggedIn,
        platform: 'google',
        message: isLoggedIn ? 'Login successful' : 'Login failed'
      };

    } catch (error) {
      return {
        success: false,
        platform: 'google',
        error: error.message
      };
    }
  }

  // DevTools helper methods
  async sendDevToolsCommand(profileId, method, params = {}) {
    const debugPort = this.debugPorts.get(profileId);
    if (!debugPort) {
      throw new Error(`No debug port found for profile ${profileId}`);
    }

    // Implementation would use CDP (Chrome DevTools Protocol)
    // For now, return mock success
    console.log(`DevTools command: ${method} for profile ${profileId}`);
    return { success: true };
  }

  async navigateToUrl(profileId, url) {
    return await this.sendDevToolsCommand(profileId, 'Page.navigate', { url });
  }

  async fillInput(profileId, selector, value) {
    // Mock implementation - would use CDP to fill input
    console.log(`Filling input ${selector} with value for profile ${profileId}`);
    return { success: true };
  }

  async clickElement(profileId, selector) {
    // Mock implementation - would use CDP to click element
    console.log(`Clicking element ${selector} for profile ${profileId}`);
    return { success: true };
  }

  async checkElement(profileId, selector) {
    // Mock implementation - would check if element exists
    console.log(`Checking element ${selector} for profile ${profileId}`);
    return Math.random() > 0.3; // Mock success rate
  }

  async waitForDebugger(port, timeout = 30000) {
    // Mock implementation - would wait for Chrome DevTools to be ready
    await this.sleep(2000);
    return true;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Get profile status
  getProfileStatus(profileId) {
    const profile = this.profiles.get(profileId);
    if (!profile) {
      return null;
    }

    return {
      id: profile.id,
      name: profile.name,
      status: profile.status,
      platform: profile.platform,
      debugPort: profile.debugPort,
      pid: profile.pid,
      isActive: this.activeProfiles.has(profileId),
      lastUsed: profile.lastUsed
    };
  }

  // Get all profiles status
  getAllProfilesStatus() {
    const profiles = [];
    for (const [profileId] of this.profiles) {
      profiles.push(this.getProfileStatus(profileId));
    }
    return profiles;
  }

  // Cleanup on shutdown
  async cleanup() {
    console.log('🧹 Cleaning up Chrome automation service...');

    const activeProfileIds = Array.from(this.activeProfiles);
    if (activeProfileIds.length > 0) {
      await this.closeProfiles(activeProfileIds);
    }

    console.log('✅ Chrome automation cleanup completed');
  }
}

export default ChromeAutomationService;
