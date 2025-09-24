/**
 * Enhanced 2FA Manager
 * Improved workflow cho 2FA trong auto-login system
 */

import { EventEmitter } from "events";
import crypto from "crypto";

class Enhanced2FAManager extends EventEmitter {
  constructor(eventBus, securityManager) {
    super();
    this.eventBus = eventBus;
    this.securityManager = securityManager;

    // 2FA Sessions management
    this.twoFASessions = new Map();
    this.retryAttempts = new Map();
    this.timeoutHandlers = new Map();

    // Configuration
    this.config = {
      maxRetries: 3,
      sessionTimeout: 10 * 60 * 1000, // 10 minutes
      retryDelay: 2000, // 2 seconds
      methods: {
        SMS: {
          enabled: true,
          timeout: 5 * 60 * 1000, // 5 minutes
          codeLength: 6,
          resendDelay: 60000, // 1 minute
        },
        EMAIL: {
          enabled: true,
          timeout: 5 * 60 * 1000,
          codeLength: 6,
          resendDelay: 60000,
        },
        APP: {
          enabled: true,
          timeout: 3 * 60 * 1000, // 3 minutes
          codeLength: 6,
          resendDelay: 30000, // 30 seconds
        },
        BACKUP: {
          enabled: true,
          timeout: 10 * 60 * 1000,
          codeLength: 8,
          resendDelay: 0,
        },
      },
    };
  }

  /**
   * Initialize 2FA session
   */
  async initialize2FASession(
    sessionId,
    platform,
    accountId,
    detectedMethod = null
  ) {
    const twoFASessionId = `2fa_${sessionId}_${Date.now()}`;

    // Detect available 2FA methods from platform response
    const availableMethods = await this.detectAvailable2FAMethods(
      platform,
      detectedMethod
    );

    const session = {
      id: twoFASessionId,
      originalSessionId: sessionId,
      platform,
      accountId,
      status: "waiting_method_selection",
      availableMethods,
      selectedMethod: availableMethods[0] || "SMS",
      attempts: 0,
      maxAttempts: this.config.maxRetries,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(
        Date.now() + this.config.sessionTimeout
      ).toISOString(),
      lastActivity: new Date().toISOString(),
      codes: new Map(), // Track different codes for different methods
      metadata: {
        userAgent: null,
        ipAddress: null,
        deviceInfo: null,
      },
    };

    this.twoFASessions.set(twoFASessionId, session);
    this.setupSessionTimeout(twoFASessionId);

    // Emit event to notify UI
    await this.eventBus.publish(
      "2fa.session_created",
      {
        sessionId: twoFASessionId,
        originalSessionId: sessionId,
        platform,
        accountId,
        availableMethods,
        recommendedMethod: session.selectedMethod,
      },
      true
    );

    return session;
  }

  /**
   * Detect available 2FA methods from platform response
   */
  async detectAvailable2FAMethods(platform, detectedMethod = null) {
    const methods = [];

    // Platform-specific 2FA method detection
    switch (platform.toLowerCase()) {
      case "facebook":
        methods.push("SMS", "APP", "BACKUP");
        break;
      case "google":
      case "gmail":
        methods.push("SMS", "EMAIL", "APP", "BACKUP");
        break;
      case "instagram":
        methods.push("SMS", "APP");
        break;
      case "twitter":
        methods.push("SMS", "APP");
        break;
      default:
        methods.push("SMS", "EMAIL");
    }

    // If specific method detected, prioritize it
    if (detectedMethod && methods.includes(detectedMethod)) {
      methods.splice(methods.indexOf(detectedMethod), 1);
      methods.unshift(detectedMethod);
    }

    return methods.filter((method) => this.config.methods[method]?.enabled);
  }

  /**
   * Select 2FA method
   */
  async select2FAMethod(sessionId, method, userChoice = false) {
    const session = this.twoFASessions.get(sessionId);
    if (!session) {
      throw new Error("2FA session not found");
    }

    if (!session.availableMethods.includes(method)) {
      throw new Error("2FA method not available for this session");
    }

    session.selectedMethod = method;
    session.status = "waiting_code";
    session.lastActivity = new Date().toISOString();
    session.userSelectedMethod = userChoice;

    // Request code for selected method
    await this.request2FACode(sessionId, method);

    await this.eventBus.publish(
      "2fa.method_selected",
      {
        sessionId,
        method,
        userChoice,
        accountId: session.accountId,
        platform: session.platform,
      },
      true
    );

    return { success: true, method, status: "waiting_code" };
  }

  /**
   * Request 2FA code for specific method
   */
  async request2FACode(sessionId, method) {
    const session = this.twoFASessions.get(sessionId);
    if (!session) {
      throw new Error("2FA session not found");
    }

    const methodConfig = this.config.methods[method];
    const requestId = crypto.randomUUID();

    try {
      // Simulate requesting code (replace with real implementation)
      const codeRequest = await this.sendCodeRequest(
        session,
        method,
        requestId
      );

      // Track the request
      session.codes.set(method, {
        requestId,
        requestedAt: new Date().toISOString(),
        status: "sent",
        expiresAt: new Date(Date.now() + methodConfig.timeout).toISOString(),
        canResendAt: new Date(
          Date.now() + methodConfig.resendDelay
        ).toISOString(),
      });

      await this.eventBus.publish(
        "2fa.code_requested",
        {
          sessionId,
          method,
          requestId,
          accountId: session.accountId,
          platform: session.platform,
          expiresIn: methodConfig.timeout / 1000,
        },
        true
      );

      return {
        success: true,
        requestId,
        expiresIn: methodConfig.timeout / 1000,
      };
    } catch (error) {
      console.error(`Failed to request ${method} code:`, error);

      await this.eventBus.publish(
        "2fa.code_request_failed",
        {
          sessionId,
          method,
          error: error.message,
          accountId: session.accountId,
        },
        true
      );

      throw error;
    }
  }

  /**
   * Verify 2FA code
   */
  async verify2FACode(sessionId, code, method = null) {
    const session = this.twoFASessions.get(sessionId);
    if (!session) {
      throw new Error("2FA session not found");
    }

    const verificationMethod = method || session.selectedMethod;
    const methodConfig = this.config.methods[verificationMethod];

    // Check if session expired
    if (new Date() > new Date(session.expiresAt)) {
      await this.expire2FASession(sessionId, "session_timeout");
      throw new Error("2FA session expired");
    }

    // Check code format
    if (!this.validateCodeFormat(code, verificationMethod)) {
      session.attempts++;
      await this.eventBus.publish(
        "2fa.code_invalid_format",
        {
          sessionId,
          method: verificationMethod,
          attempts: session.attempts,
          maxAttempts: session.maxAttempts,
        },
        true
      );

      if (session.attempts >= session.maxAttempts) {
        await this.expire2FASession(sessionId, "max_attempts");
        throw new Error("Maximum verification attempts exceeded");
      }

      throw new Error("Invalid code format");
    }

    session.attempts++;
    session.lastActivity = new Date().toISOString();

    try {
      // Verify code (implement real verification logic)
      const isValid = await this.verifyCode(session, code, verificationMethod);

      if (isValid) {
        // Success
        session.status = "verified";
        session.verifiedAt = new Date().toISOString();
        session.verifiedMethod = verificationMethod;
        session.verifiedCode = this.hashCode(code); // Store hash, not actual code

        // Clear timeout
        this.clearSessionTimeout(sessionId);

        await this.eventBus.publish(
          "2fa.verification_success",
          {
            sessionId,
            originalSessionId: session.originalSessionId,
            method: verificationMethod,
            accountId: session.accountId,
            platform: session.platform,
            attempts: session.attempts,
          },
          true
        );

        // Continue auto-login process
        await this.eventBus.publish(
          "auto_login.2fa_completed",
          {
            sessionId: session.originalSessionId,
            twoFASessionId: sessionId,
            success: true,
          },
          true
        );

        return {
          success: true,
          method: verificationMethod,
          attempts: session.attempts,
        };
      } else {
        // Invalid code
        await this.eventBus.publish(
          "2fa.code_invalid",
          {
            sessionId,
            method: verificationMethod,
            attempts: session.attempts,
            maxAttempts: session.maxAttempts,
            remainingAttempts: session.maxAttempts - session.attempts,
          },
          true
        );

        if (session.attempts >= session.maxAttempts) {
          await this.expire2FASession(sessionId, "max_attempts");
          throw new Error("Maximum verification attempts exceeded");
        }

        throw new Error("Invalid 2FA code");
      }
    } catch (error) {
      console.error("2FA verification error:", error);

      if (session.attempts >= session.maxAttempts) {
        await this.expire2FASession(sessionId, "verification_failed");
      }

      throw error;
    }
  }

  /**
   * Resend 2FA code
   */
  async resend2FACode(sessionId, method = null) {
    const session = this.twoFASessions.get(sessionId);
    if (!session) {
      throw new Error("2FA session not found");
    }

    const resendMethod = method || session.selectedMethod;
    const codeInfo = session.codes.get(resendMethod);

    if (codeInfo && new Date() < new Date(codeInfo.canResendAt)) {
      const waitTime = Math.ceil(
        (new Date(codeInfo.canResendAt) - new Date()) / 1000
      );
      throw new Error(
        `Please wait ${waitTime} seconds before requesting new code`
      );
    }

    return await this.request2FACode(sessionId, resendMethod);
  }

  /**
   * Switch 2FA method
   */
  async switch2FAMethod(sessionId, newMethod) {
    const session = this.twoFASessions.get(sessionId);
    if (!session) {
      throw new Error("2FA session not found");
    }

    if (!session.availableMethods.includes(newMethod)) {
      throw new Error("2FA method not available");
    }

    // Reset attempts for new method
    session.attempts = 0;
    session.selectedMethod = newMethod;
    session.status = "waiting_code";
    session.lastActivity = new Date().toISOString();

    await this.request2FACode(sessionId, newMethod);

    await this.eventBus.publish(
      "2fa.method_switched",
      {
        sessionId,
        newMethod,
        accountId: session.accountId,
        platform: session.platform,
      },
      true
    );

    return { success: true, method: newMethod };
  }

  /**
   * Get 2FA session info
   */
  get2FASession(sessionId) {
    const session = this.twoFASessions.get(sessionId);
    if (!session) {
      return null;
    }

    return {
      id: session.id,
      originalSessionId: session.originalSessionId,
      platform: session.platform,
      accountId: session.accountId,
      status: session.status,
      availableMethods: session.availableMethods,
      selectedMethod: session.selectedMethod,
      attempts: session.attempts,
      maxAttempts: session.maxAttempts,
      expiresAt: session.expiresAt,
      lastActivity: session.lastActivity,
      canResend: this.canResend(session),
    };
  }

  /**
   * Cancel 2FA session
   */
  async cancel2FASession(sessionId, reason = "user_cancelled") {
    const session = this.twoFASessions.get(sessionId);
    if (!session) {
      return false;
    }

    session.status = "cancelled";
    session.cancelledAt = new Date().toISOString();
    session.cancelReason = reason;

    this.clearSessionTimeout(sessionId);

    await this.eventBus.publish(
      "2fa.session_cancelled",
      {
        sessionId,
        originalSessionId: session.originalSessionId,
        reason,
        accountId: session.accountId,
        platform: session.platform,
      },
      true
    );

    // Continue auto-login with failure
    await this.eventBus.publish(
      "auto_login.2fa_completed",
      {
        sessionId: session.originalSessionId,
        twoFASessionId: sessionId,
        success: false,
        reason: "cancelled",
      },
      true
    );

    this.twoFASessions.delete(sessionId);
    return true;
  }

  /**
   * Private methods
   */

  async sendCodeRequest(session, method, requestId) {
    // Simulate sending code (replace with real implementation)
    console.log(
      `📱 Sending ${method} code to ${session.accountId} (${requestId})`
    );

    // Add audit log
    await this.securityManager.addAuditLog("2fa.code_requested", null, {
      sessionId: session.id,
      method,
      platform: session.platform,
      accountId: session.accountId,
      requestId,
    });

    return { success: true, requestId };
  }

  async verifyCode(session, code, method) {
    // Mock verification - replace with real implementation
    const mockCodes = {
      SMS: "123456",
      EMAIL: "654321",
      APP: "789012",
      BACKUP: "12345678",
    };

    const isValid =
      code === mockCodes[method] ||
      code.length === this.config.methods[method].codeLength;

    // Add audit log
    await this.securityManager.addAuditLog("2fa.code_verified", null, {
      sessionId: session.id,
      method,
      platform: session.platform,
      accountId: session.accountId,
      success: isValid,
    });

    return isValid;
  }

  validateCodeFormat(code, method) {
    const methodConfig = this.config.methods[method];
    return (
      code && code.length === methodConfig.codeLength && /^\d+$/.test(code)
    );
  }

  hashCode(code) {
    return crypto
      .createHash("sha256")
      .update(code)
      .digest("hex");
  }

  canResend(session) {
    const codeInfo = session.codes.get(session.selectedMethod);
    if (!codeInfo) return true;
    return new Date() >= new Date(codeInfo.canResendAt);
  }

  setupSessionTimeout(sessionId) {
    const session = this.twoFASessions.get(sessionId);
    if (!session) return;

    const timeoutId = setTimeout(async () => {
      await this.expire2FASession(sessionId, "timeout");
    }, this.config.sessionTimeout);

    this.timeoutHandlers.set(sessionId, timeoutId);
  }

  clearSessionTimeout(sessionId) {
    const timeoutId = this.timeoutHandlers.get(sessionId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.timeoutHandlers.delete(sessionId);
    }
  }

  async expire2FASession(sessionId, reason) {
    const session = this.twoFASessions.get(sessionId);
    if (!session) return;

    session.status = "expired";
    session.expiredAt = new Date().toISOString();
    session.expiredReason = reason;

    this.clearSessionTimeout(sessionId);

    await this.eventBus.publish(
      "2fa.session_expired",
      {
        sessionId,
        originalSessionId: session.originalSessionId,
        reason,
        accountId: session.accountId,
        platform: session.platform,
        attempts: session.attempts,
      },
      true
    );

    // Continue auto-login with failure
    await this.eventBus.publish(
      "auto_login.2fa_completed",
      {
        sessionId: session.originalSessionId,
        twoFASessionId: sessionId,
        success: false,
        reason: "expired",
      },
      true
    );

    this.twoFASessions.delete(sessionId);
  }

  /**
   * Get all active 2FA sessions
   */
  getActive2FASessions() {
    const sessions = [];
    for (const [sessionId, session] of this.twoFASessions) {
      if (session.status !== "expired" && session.status !== "cancelled") {
        sessions.push(this.get2FASession(sessionId));
      }
    }
    return sessions;
  }

  /**
   * Cleanup expired sessions
   */
  cleanupExpiredSessions() {
    const now = new Date();
    for (const [sessionId, session] of this.twoFASessions) {
      if (new Date(session.expiresAt) < now) {
        this.expire2FASession(sessionId, "cleanup");
      }
    }
  }
}

export default Enhanced2FAManager;
