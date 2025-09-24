import puppeteer from "puppeteer";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Advanced Chrome Automation System
class ChromeAutomation {
  constructor(options = {}) {
    this.config = {
      headless: options.headless !== false,
      maxInstances: options.maxInstances || 5,
      defaultTimeout: options.timeout || 30000,
      enableStealth: options.enableStealth !== false,
      enableProxy: options.enableProxy || false,
      proxyList: options.proxyList || [],
      userDataDir: options.userDataDir || "./browser-profiles",
      screenshotsDir: options.screenshotsDir || "./screenshots",
      downloadsDir: options.downloadsDir || "./downloads",
      enableVideoRecording: options.enableVideo || false,
      enableHAR: options.enableHAR || false,
      userAgents: options.userAgents || [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      ],
    };

    this.instances = new Map();
    this.taskQueue = [];
    this.activeJobs = new Map();
    this.isProcessing = false;
  }

  // Initialize Chrome automation system
  async initialize() {
    try {
      await this.ensureDirectories();

      // Pre-launch some instances for faster task execution
      for (let i = 0; i < Math.min(2, this.config.maxInstances); i++) {
        await this.createInstance(`pre_${i}`);
      }

      this.startTaskProcessor();
      await this.log("Chrome Automation initialized");

      return true;
    } catch (error) {
      await this.log(`Failed to initialize: ${error.message}`, "error");
      return false;
    }
  }

  // Create new browser instance
  async createInstance(instanceId, customOptions = {}) {
    try {
      const profilePath = path.join(this.config.userDataDir, instanceId);
      await fs.mkdir(profilePath, { recursive: true });

      const args = [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--disable-gpu",
        "--disable-web-security",
        "--disable-features=VizDisplayCompositor",
        "--disable-blink-features=AutomationControlled",
        "--disable-plugins-discovery",
        "--disable-default-apps",
        `--user-data-dir=${profilePath}`,
      ];

      // Add proxy if configured
      if (this.config.enableProxy && this.config.proxyList.length > 0) {
        const proxy = this.getRandomProxy();
        args.push(`--proxy-server=${proxy}`);
      }

      const browser = await puppeteer.launch({
        headless: this.config.headless,
        args,
        defaultViewport: { width: 1366, height: 768 },
        ignoreDefaultArgs: ["--enable-automation"],
        executablePath: process.env.CHROME_PATH,
        ...customOptions,
      });

      const page = await browser.newPage();

      // Apply stealth techniques
      if (this.config.enableStealth) {
        await this.applyStealth(page);
      }

      // Set random user agent
      const userAgent = this.getRandomUserAgent();
      await page.setUserAgent(userAgent);

      const instance = {
        id: instanceId,
        browser,
        page,
        userAgent,
        createdAt: Date.now(),
        taskCount: 0,
        status: "idle",
      };

      this.instances.set(instanceId, instance);
      await this.log(`Browser instance created: ${instanceId}`);

      return instance;
    } catch (error) {
      await this.log(`Failed to create instance: ${error.message}`, "error");
      throw error;
    }
  }

  // Apply stealth techniques to page
  async applyStealth(page) {
    // Remove webdriver property
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, "webdriver", {
        get: () => undefined,
      });
    });

    // Mock plugins
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, "plugins", {
        get: () => [1, 2, 3, 4, 5],
      });
    });

    // Mock languages
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, "languages", {
        get: () => ["en-US", "en"],
      });
    });

    // Mock permissions
    await page.evaluateOnNewDocument(() => {
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters) =>
        parameters.name === "notifications"
          ? Promise.resolve({ state: Notification.permission })
          : originalQuery(parameters);
    });

    // Override chrome property
    await page.evaluateOnNewDocument(() => {
      if (!window.chrome) {
        window.chrome = {};
      }
      if (!window.chrome.runtime) {
        window.chrome.runtime = {};
      }
    });
  }

  // Add task to queue
  async addTask(taskType, params, options = {}) {
    const task = {
      id: this.generateTaskId(),
      type: taskType,
      params,
      options,
      createdAt: Date.now(),
      status: "queued",
      priority: options.priority || 0,
      retries: options.retries || 0,
      maxRetries: options.maxRetries || 3,
    };

    this.taskQueue.push(task);
    this.taskQueue.sort((a, b) => b.priority - a.priority);

    await this.log(`Task added to queue: ${task.id} (${taskType})`);
    return task.id;
  }

  // Process task queue
  startTaskProcessor() {
    if (this.isProcessing) return;

    this.isProcessing = true;

    setInterval(async () => {
      if (this.taskQueue.length === 0) return;
      if (this.activeJobs.size >= this.config.maxInstances) return;

      const task = this.taskQueue.shift();
      if (task) {
        this.processTask(task);
      }
    }, 1000);
  }

  // Process individual task
  async processTask(task) {
    let instance = null;

    try {
      task.status = "processing";
      task.startedAt = Date.now();
      this.activeJobs.set(task.id, task);

      // Get available instance
      instance = await this.getAvailableInstance();
      instance.status = "busy";
      instance.taskCount++;

      await this.log(
        `Processing task: ${task.id} with instance: ${instance.id}`
      );

      // Execute task based on type
      let result;
      switch (task.type) {
        case "navigate":
          result = await this.executeNavigate(instance, task.params);
          break;
        case "scrape":
          result = await this.executeScrape(instance, task.params);
          break;
        case "form_fill":
          result = await this.executeFormFill(instance, task.params);
          break;
        case "social_interaction":
          result = await this.executeSocialInteraction(instance, task.params);
          break;
        case "data_extraction":
          result = await this.executeDataExtraction(instance, task.params);
          break;
        case "automation_flow":
          result = await this.executeAutomationFlow(instance, task.params);
          break;
        default:
          throw new Error(`Unknown task type: ${task.type}`);
      }

      task.status = "completed";
      task.result = result;
      task.completedAt = Date.now();
      task.executionTime = task.completedAt - task.startedAt;

      await this.log(`Task completed: ${task.id} (${task.executionTime}ms)`);
    } catch (error) {
      task.status = "failed";
      task.error = error.message;
      task.completedAt = Date.now();

      // Retry if possible
      if (task.retries < task.maxRetries) {
        task.retries++;
        task.status = "queued";
        this.taskQueue.unshift(task);
        await this.log(`Task retry: ${task.id} (attempt ${task.retries})`);
      } else {
        await this.log(`Task failed: ${task.id} - ${error.message}`, "error");
      }
    } finally {
      if (instance) {
        instance.status = "idle";
      }
      this.activeJobs.delete(task.id);
    }
  }

  // Get available browser instance
  async getAvailableInstance() {
    // Find idle instance
    for (const instance of this.instances.values()) {
      if (instance.status === "idle") {
        return instance;
      }
    }

    // Create new instance if under limit
    if (this.instances.size < this.config.maxInstances) {
      const instanceId = `auto_${Date.now()}`;
      return await this.createInstance(instanceId);
    }

    // Wait for instance to become available
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        for (const instance of this.instances.values()) {
          if (instance.status === "idle") {
            clearInterval(checkInterval);
            resolve(instance);
            return;
          }
        }
      }, 1000);
    });
  }

  // Execute navigation task
  async executeNavigate(instance, params) {
    const { url, waitUntil = "networkidle2", timeout } = params;

    await instance.page.goto(url, {
      waitUntil,
      timeout: timeout || this.config.defaultTimeout,
    });

    return {
      url: instance.page.url(),
      title: await instance.page.title(),
      timestamp: new Date().toISOString(),
    };
  }

  // Execute scraping task
  async executeScrape(instance, params) {
    const { url, selectors, waitFor } = params;

    if (url) {
      await instance.page.goto(url, { waitUntil: "networkidle2" });
    }

    if (waitFor) {
      await instance.page.waitForSelector(waitFor, {
        timeout: this.config.defaultTimeout,
      });
    }

    const data = await instance.page.evaluate((selectors) => {
      const results = {};

      Object.entries(selectors).forEach(([key, selector]) => {
        if (typeof selector === "string") {
          const element = document.querySelector(selector);
          results[key] = element ? element.textContent.trim() : null;
        } else if (selector.multiple) {
          const elements = document.querySelectorAll(selector.selector);
          results[key] = Array.from(elements).map((el) =>
            selector.attribute
              ? el.getAttribute(selector.attribute)
              : el.textContent.trim()
          );
        } else {
          const element = document.querySelector(selector.selector);
          results[key] = element
            ? selector.attribute
              ? element.getAttribute(selector.attribute)
              : element.textContent.trim()
            : null;
        }
      });

      return results;
    }, selectors);

    return data;
  }

  // Execute form filling task
  async executeFormFill(instance, params) {
    const { url, form, submit = false } = params;

    if (url) {
      await instance.page.goto(url, { waitUntil: "networkidle2" });
    }

    // Fill form fields
    for (const [selector, value] of Object.entries(form)) {
      await instance.page.waitForSelector(selector, {
        timeout: this.config.defaultTimeout,
      });

      if (typeof value === "string") {
        await instance.page.type(selector, value, { delay: 100 });
      } else if (value.type === "select") {
        await instance.page.select(selector, value.value);
      } else if (value.type === "click") {
        await instance.page.click(selector);
      }
    }

    if (submit && params.submitButton) {
      await Promise.all([
        instance.page.click(params.submitButton),
        instance.page.waitForNavigation({ waitUntil: "networkidle2" }),
      ]);
    }

    return {
      url: instance.page.url(),
      submitted: submit,
      timestamp: new Date().toISOString(),
    };
  }

  // Execute social media interaction
  async executeSocialInteraction(instance, params) {
    const { platform, action, target, data } = params;

    const results = [];

    switch (platform) {
      case "facebook":
        results.push(
          await this.handleFacebookInteraction(instance, action, target, data)
        );
        break;
      case "instagram":
        results.push(
          await this.handleInstagramInteraction(instance, action, target, data)
        );
        break;
      case "twitter":
        results.push(
          await this.handleTwitterInteraction(instance, action, target, data)
        );
        break;
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }

    return results;
  }

  // Handle Facebook interactions
  async handleFacebookInteraction(instance, action, target, data) {
    switch (action) {
      case "post":
        await instance.page.goto("https://www.facebook.com/", {
          waitUntil: "networkidle2",
        });
        await instance.page.click(
          '[data-testid="status-attachment-mentions-input"]'
        );
        await instance.page.type(
          '[data-testid="status-attachment-mentions-input"]',
          data.message
        );
        await instance.page.click('[data-testid="react-composer-post-button"]');
        break;

      case "comment":
        await instance.page.goto(target);
        await instance.page.click('[data-testid="comment"]');
        await instance.page.type('[data-testid="comment"]', data.message);
        await instance.page.click('[data-testid="comment-submit-button"]');
        break;

      case "like":
        await instance.page.goto(target);
        await instance.page.click('[data-testid="like-button"]');
        break;
    }

    return { platform: "facebook", action, target, success: true };
  }

  // Execute data extraction task
  async executeDataExtraction(instance, params) {
    const { urls, extractors, options = {} } = params;
    const results = [];

    for (const url of urls) {
      try {
        await instance.page.goto(url, { waitUntil: "networkidle2" });

        const extracted = {};

        for (const [key, extractor] of Object.entries(extractors)) {
          if (extractor.waitFor) {
            await instance.page.waitForSelector(extractor.waitFor, {
              timeout: 5000,
            });
          }

          extracted[key] = await instance.page.evaluate((ext) => {
            const elements = document.querySelectorAll(ext.selector);

            if (ext.multiple) {
              return Array.from(elements).map((el) =>
                ext.attribute
                  ? el.getAttribute(ext.attribute)
                  : el.textContent.trim()
              );
            } else {
              const element = elements[0];
              return element
                ? ext.attribute
                  ? element.getAttribute(ext.attribute)
                  : element.textContent.trim()
                : null;
            }
          }, extractor);
        }

        results.push({
          url,
          data: extracted,
          timestamp: new Date().toISOString(),
        });

        // Delay between requests
        if (options.delay) {
          await this.delay(options.delay);
        }
      } catch (error) {
        results.push({
          url,
          error: error.message,
          timestamp: new Date().toISOString(),
        });
      }
    }

    return results;
  }

  // Execute automation flow (sequence of actions)
  async executeAutomationFlow(instance, params) {
    const { steps, options = {} } = params;
    const results = [];

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];

      try {
        let result;

        switch (step.action) {
          case "navigate":
            result = await this.executeNavigate(instance, step.params);
            break;
          case "click":
            await instance.page.click(step.selector);
            result = { clicked: step.selector };
            break;
          case "type":
            await instance.page.type(step.selector, step.text, {
              delay: step.delay || 100,
            });
            result = { typed: step.text, selector: step.selector };
            break;
          case "wait":
            await instance.page.waitForSelector(step.selector, {
              timeout: step.timeout || this.config.defaultTimeout,
            });
            result = { waited: step.selector };
            break;
          case "screenshot":
            const screenshotPath = path.join(
              this.config.screenshotsDir,
              `step_${i}_${Date.now()}.png`
            );
            await instance.page.screenshot({
              path: screenshotPath,
              fullPage: true,
            });
            result = { screenshot: screenshotPath };
            break;
          case "extract":
            result = await this.executeScrape(instance, step.params);
            break;
        }

        results.push({
          step: i,
          action: step.action,
          result,
          success: true,
          timestamp: new Date().toISOString(),
        });

        // Delay between steps
        if (step.delay || options.stepDelay) {
          await this.delay(step.delay || options.stepDelay);
        }
      } catch (error) {
        results.push({
          step: i,
          action: step.action,
          error: error.message,
          success: false,
          timestamp: new Date().toISOString(),
        });

        // Stop on error if configured
        if (options.stopOnError) {
          break;
        }
      }
    }

    return results;
  }

  // Utility methods
  getRandomProxy() {
    return this.config.proxyList[
      Math.floor(Math.random() * this.config.proxyList.length)
    ];
  }

  getRandomUserAgent() {
    return this.config.userAgents[
      Math.floor(Math.random() * this.config.userAgents.length)
    ];
  }

  generateTaskId() {
    return `task_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 6)}`;
  }

  async delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async ensureDirectories() {
    const dirs = [
      this.config.userDataDir,
      this.config.screenshotsDir,
      this.config.downloadsDir,
      "./logs",
    ];

    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  // Get system status
  async getStatus() {
    return {
      instances: {
        total: this.instances.size,
        idle: Array.from(this.instances.values()).filter(
          (i) => i.status === "idle"
        ).length,
        busy: Array.from(this.instances.values()).filter(
          (i) => i.status === "busy"
        ).length,
      },
      tasks: {
        queued: this.taskQueue.length,
        active: this.activeJobs.size,
        totalProcessed: Array.from(this.instances.values()).reduce(
          (sum, i) => sum + i.taskCount,
          0
        ),
      },
      timestamp: new Date().toISOString(),
    };
  }

  // Cleanup and shutdown
  async shutdown() {
    try {
      // Stop processing new tasks
      this.isProcessing = false;

      // Wait for active jobs to complete
      while (this.activeJobs.size > 0) {
        await this.delay(1000);
      }

      // Close all browser instances
      for (const instance of this.instances.values()) {
        try {
          await instance.browser.close();
        } catch (error) {
          await this.log(
            `Error closing instance ${instance.id}: ${error.message}`,
            "error"
          );
        }
      }

      this.instances.clear();
      await this.log("Chrome Automation shutdown completed");
    } catch (error) {
      await this.log(`Shutdown error: ${error.message}`, "error");
    }
  }

  async log(message, level = "info") {
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp} [CHROME-AUTOMATION] [${level.toUpperCase()}] ${message}`;

    console.log(logMessage);

    try {
      await fs.appendFile("./logs/chrome-automation.log", logMessage + "\n");
    } catch (error) {
      // Logging failed
    }
  }
}

export default ChromeAutomation;
