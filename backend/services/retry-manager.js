/**
 * Retry Manager for Auto-Login System
 * Advanced retry mechanisms with exponential backoff, circuit breaker pattern
 */

import { EventEmitter } from "events";
import crypto from "crypto";

class RetryManager extends EventEmitter {
  constructor(eventBus, logger) {
    super();
    this.eventBus = eventBus;
    this.logger = logger;

    // Retry sessions management
    this.retrySessions = new Map();
    this.circuitBreakers = new Map();
    this.failurePatterns = new Map();

    // Configuration
    this.config = {
      maxRetries: 5,
      baseDelay: 1000, // 1 second
      maxDelay: 60000, // 60 seconds
      backoffMultiplier: 2,
      jitterFactor: 0.1,

      // Circuit breaker settings
      circuitBreakerThreshold: 5, // failures before opening circuit
      circuitBreakerTimeout: 300000, // 5 minutes
      halfOpenAttempts: 3,

      // Failure analysis
      patternDetectionWindow: 3600000, // 1 hour
      minPatternOccurrences: 3,

      // Retry strategies per error type
      strategies: {
        network_timeout: {
          maxRetries: 3,
          backoffMultiplier: 1.5,
          baseDelay: 2000,
        },
        credentials_invalid: { maxRetries: 1, baseDelay: 5000 },
        "2fa_required": { maxRetries: 0 }, // Don't retry 2FA, handle separately
        captcha_required: { maxRetries: 2, baseDelay: 10000 },
        rate_limited: { maxRetries: 5, baseDelay: 30000, backoffMultiplier: 2 },
        page_load_timeout: { maxRetries: 4, backoffMultiplier: 1.8 },
        element_not_found: { maxRetries: 3, baseDelay: 3000 },
        browser_crash: { maxRetries: 2, baseDelay: 5000 },
        session_expired: { maxRetries: 1, baseDelay: 1000 },
        unknown: { maxRetries: 2, backoffMultiplier: 2 },
      },
    };

    // Start background tasks
    this.startBackgroundTasks();
  }

  /**
   * Initialize retry session for a failed login attempt
   */
  async initializeRetrySession(
    originalSessionId,
    platform,
    accountId,
    errorType,
    errorDetails = {}
  ) {
    const retrySessionId = `retry_${originalSessionId}_${Date.now()}`;

    const strategy = this.getRetryStrategy(errorType, platform);
    const circuitBreakerKey = `${platform}_${accountId}`;

    // Check circuit breaker
    if (!this.canAttempt(circuitBreakerKey)) {
      throw new Error("Circuit breaker is open - too many recent failures");
    }

    const session = {
      id: retrySessionId,
      originalSessionId,
      platform,
      accountId,
      errorType,
      errorDetails,
      strategy,

      // Retry state
      attemptCount: 0,
      maxAttempts: strategy.maxRetries,
      nextAttemptAt: null,

      // Timing
      createdAt: new Date(),
      lastAttemptAt: null,
      completedAt: null,

      // Results
      attempts: [],
      status: "pending",
      finalResult: null,

      // Metadata
      metadata: {
        userAgent: errorDetails.userAgent,
        ipAddress: errorDetails.ipAddress,
        originalError: errorDetails.originalError,
      },
    };

    this.retrySessions.set(retrySessionId, session);

    // Schedule first retry
    await this.scheduleRetry(retrySessionId);

    // Emit event
    await this.eventBus?.publish("retry.session_created", {
      retrySessionId,
      originalSessionId,
      platform,
      accountId,
      errorType,
      strategy,
      nextAttemptAt: session.nextAttemptAt,
    });

    this.logger?.info(
      `Retry session initialized: ${retrySessionId} for ${accountId} on ${platform} (${errorType})`
    );

    return session;
  }

  /**
   * Get retry strategy based on error type and platform
   */
  getRetryStrategy(errorType, platform) {
    let baseStrategy =
      this.config.strategies[errorType] || this.config.strategies.unknown;

    // Platform-specific adjustments
    const platformAdjustments = {
      facebook: {
        rate_limited: { baseDelay: 60000, maxRetries: 3 },
        captcha_required: { baseDelay: 20000, maxRetries: 1 },
      },
      google: {
        rate_limited: { baseDelay: 45000, maxRetries: 4 },
      },
      instagram: {
        rate_limited: { baseDelay: 90000, maxRetries: 2 },
      },
    };

    const adjustment = platformAdjustments[platform]?.[errorType] || {};

    return {
      ...this.config,
      ...baseStrategy,
      ...adjustment,
    };
  }

  /**
   * Execute retry attempt
   */
  async executeRetryAttempt(retrySessionId) {
    const session = this.retrySessions.get(retrySessionId);
    if (!session || session.status !== "pending") {
      return false;
    }

    session.attemptCount++;
    session.lastAttemptAt = new Date();
    session.status = "executing";

    const attempt = {
      attemptNumber: session.attemptCount,
      startedAt: new Date(),
      completedAt: null,
      success: false,
      error: null,
      duration: null,
      metadata: {},
    };

    try {
      this.logger?.info(
        `Executing retry attempt ${session.attemptCount}/${session.maxAttempts} for ${session.accountId}`
      );

      // Pre-attempt checks
      await this.preAttemptChecks(session, attempt);

      // Execute the retry
      const result = await this.performRetryAttempt(session, attempt);

      attempt.success = result.success;
      attempt.completedAt = new Date();
      attempt.duration = attempt.completedAt - attempt.startedAt;
      attempt.metadata = result.metadata || {};

      if (result.success) {
        // Success!
        session.status = "completed";
        session.completedAt = new Date();
        session.finalResult = result;

        // Reset circuit breaker
        this.recordSuccess(session.platform, session.accountId);

        await this.eventBus?.publish("retry.attempt_success", {
          retrySessionId,
          originalSessionId: session.originalSessionId,
          attemptNumber: session.attemptCount,
          result,
        });

        this.logger?.info(
          `Retry successful for ${session.accountId} on attempt ${session.attemptCount}`
        );
      } else {
        // Attempt failed
        attempt.error = result.error;

        // Record failure for circuit breaker and pattern analysis
        this.recordFailure(
          session.platform,
          session.accountId,
          result.errorType || session.errorType
        );

        await this.eventBus?.publish("retry.attempt_failed", {
          retrySessionId,
          originalSessionId: session.originalSessionId,
          attemptNumber: session.attemptCount,
          error: result.error,
          errorType: result.errorType,
        });

        // Check if we should continue retrying
        if (
          session.attemptCount < session.maxAttempts &&
          this.shouldContinueRetrying(session, result)
        ) {
          // Schedule next retry
          await this.scheduleRetry(retrySessionId);
          session.status = "pending";
        } else {
          // Max attempts reached or should not retry
          session.status = "failed";
          session.completedAt = new Date();
          session.finalResult = result;

          await this.eventBus?.publish("retry.session_failed", {
            retrySessionId,
            originalSessionId: session.originalSessionId,
            totalAttempts: session.attemptCount,
            finalError: result.error,
          });

          this.logger?.warn(
            `Retry failed permanently for ${session.accountId} after ${session.attemptCount} attempts`
          );
        }
      }
    } catch (error) {
      attempt.error = error.message;
      attempt.completedAt = new Date();
      attempt.duration = attempt.completedAt - attempt.startedAt;

      // Handle unexpected errors
      session.status = "error";
      session.completedAt = new Date();

      this.logger?.error(`Retry attempt failed with error: ${error.message}`);

      await this.eventBus?.publish("retry.attempt_error", {
        retrySessionId,
        error: error.message,
      });
    }

    session.attempts.push(attempt);
    return attempt.success;
  }

  /**
   * Schedule next retry attempt
   */
  async scheduleRetry(retrySessionId) {
    const session = this.retrySessions.get(retrySessionId);
    if (!session) return;

    // Calculate delay with exponential backoff and jitter
    const delay = this.calculateDelay(session);
    session.nextAttemptAt = new Date(Date.now() + delay);

    setTimeout(async () => {
      await this.executeRetryAttempt(retrySessionId);
    }, delay);

    this.logger?.debug(
      `Next retry scheduled in ${Math.round(delay / 1000)}s for ${
        session.accountId
      }`
    );
  }

  /**
   * Calculate retry delay with exponential backoff and jitter
   */
  calculateDelay(session) {
    const strategy = session.strategy;
    const attemptNumber = session.attemptCount;

    // Base delay with exponential backoff
    let delay =
      strategy.baseDelay * Math.pow(strategy.backoffMultiplier, attemptNumber);

    // Apply maximum delay limit
    delay = Math.min(delay, strategy.maxDelay);

    // Add jitter to prevent thundering herd
    const jitter = delay * strategy.jitterFactor * (Math.random() - 0.5);
    delay += jitter;

    // Platform-specific additional delays
    if (
      session.platform === "facebook" &&
      session.errorType === "rate_limited"
    ) {
      delay *= 1.5; // Facebook is stricter
    }

    return Math.max(delay, 1000); // Minimum 1 second
  }

  /**
   * Pre-attempt checks before executing retry
   */
  async preAttemptChecks(session, attempt) {
    // Check if account is temporarily blocked
    const circuitBreakerKey = `${session.platform}_${session.accountId}`;
    if (!this.canAttempt(circuitBreakerKey)) {
      throw new Error("Account temporarily blocked due to repeated failures");
    }

    // Check for maintenance windows or rate limits
    await this.checkMaintenanceWindow(session.platform);

    // Add any platform-specific checks
    await this.performPlatformChecks(session);
  }

  /**
   * Perform the actual retry attempt
   */
  async performRetryAttempt(session, attempt) {
    // This would integrate with the actual auto-login system
    // For now, we'll simulate the retry attempt

    // Emit event to trigger actual auto-login retry
    await this.eventBus?.publish("auto_login.retry_attempt", {
      originalSessionId: session.originalSessionId,
      retrySessionId: session.id,
      platform: session.platform,
      accountId: session.accountId,
      attemptNumber: session.attemptCount,
      errorType: session.errorType,
      strategy: session.strategy,
    });

    // Return a promise that will be resolved when the auto-login attempt completes
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve({
          success: false,
          error: "Retry attempt timeout",
          errorType: "timeout",
        });
      }, 60000); // 60 second timeout

      // Listen for completion event
      const handleCompletion = (data) => {
        if (data.retrySessionId === session.id) {
          clearTimeout(timeout);
          this.eventBus.off("auto_login.retry_completed", handleCompletion);
          resolve(data.result);
        }
      };

      this.eventBus?.on("auto_login.retry_completed", handleCompletion);
    });
  }

  /**
   * Check if retry should continue based on the result
   */
  shouldContinueRetrying(session, result) {
    // Don't retry certain error types
    const nonRetryableErrors = [
      "credentials_invalid",
      "2fa_required",
      "account_disabled",
      "account_locked",
    ];
    if (nonRetryableErrors.includes(result.errorType)) {
      return false;
    }

    // Don't retry if circuit breaker is open
    const circuitBreakerKey = `${session.platform}_${session.accountId}`;
    if (!this.canAttempt(circuitBreakerKey)) {
      return false;
    }

    // Check for escalating failures
    if (session.attempts.length >= 2) {
      const lastTwo = session.attempts.slice(-2);
      if (lastTwo.every((a) => a.error && a.error.includes("rate_limited"))) {
        // If last two attempts were rate limited, increase delay significantly
        return true;
      }
    }

    return true;
  }

  /**
   * Circuit breaker implementation
   */
  canAttempt(key) {
    const breaker = this.circuitBreakers.get(key);
    if (!breaker) {
      return true; // No breaker exists, allow attempt
    }

    const now = Date.now();

    switch (breaker.state) {
      case "closed":
        return true;

      case "open":
        if (
          now - breaker.lastFailureTime >=
          this.config.circuitBreakerTimeout
        ) {
          // Transition to half-open
          breaker.state = "half-open";
          breaker.halfOpenAttempts = 0;
          return true;
        }
        return false;

      case "half-open":
        return breaker.halfOpenAttempts < this.config.halfOpenAttempts;

      default:
        return true;
    }
  }

  /**
   * Record successful attempt for circuit breaker
   */
  recordSuccess(platform, accountId) {
    const key = `${platform}_${accountId}`;
    const breaker = this.circuitBreakers.get(key);

    if (breaker) {
      if (breaker.state === "half-open") {
        // Reset circuit breaker
        breaker.state = "closed";
        breaker.failureCount = 0;
        breaker.halfOpenAttempts = 0;
      }
    }
  }

  /**
   * Record failed attempt for circuit breaker
   */
  recordFailure(platform, accountId, errorType) {
    const key = `${platform}_${accountId}`;
    let breaker = this.circuitBreakers.get(key);

    if (!breaker) {
      breaker = {
        state: "closed",
        failureCount: 0,
        lastFailureTime: null,
        halfOpenAttempts: 0,
      };
      this.circuitBreakers.set(key, breaker);
    }

    breaker.failureCount++;
    breaker.lastFailureTime = Date.now();

    if (breaker.state === "half-open") {
      breaker.halfOpenAttempts++;
      if (breaker.halfOpenAttempts >= this.config.halfOpenAttempts) {
        breaker.state = "open";
      }
    } else if (
      breaker.state === "closed" &&
      breaker.failureCount >= this.config.circuitBreakerThreshold
    ) {
      breaker.state = "open";

      this.logger?.warn(
        `Circuit breaker opened for ${platform}:${accountId} after ${breaker.failureCount} failures`
      );

      this.eventBus?.publish("retry.circuit_breaker_opened", {
        platform,
        accountId,
        failureCount: breaker.failureCount,
      });
    }

    // Record failure pattern
    this.recordFailurePattern(platform, errorType);
  }

  /**
   * Record failure pattern for analysis
   */
  recordFailurePattern(platform, errorType) {
    const key = `${platform}_${errorType}`;
    let pattern = this.failurePatterns.get(key);

    if (!pattern) {
      pattern = {
        platform,
        errorType,
        occurrences: [],
        count: 0,
        firstSeen: Date.now(),
        lastSeen: Date.now(),
      };
      this.failurePatterns.set(key, pattern);
    }

    const now = Date.now();
    pattern.occurrences.push(now);
    pattern.count++;
    pattern.lastSeen = now;

    // Keep only recent occurrences
    pattern.occurrences = pattern.occurrences.filter(
      (time) => now - time < this.config.patternDetectionWindow
    );

    // Detect patterns
    if (pattern.occurrences.length >= this.config.minPatternOccurrences) {
      const recentCount = pattern.occurrences.length;
      const timeSpan = now - pattern.occurrences[0];

      if (
        timeSpan < this.config.patternDetectionWindow &&
        recentCount >= this.config.minPatternOccurrences
      ) {
        this.eventBus?.publish("retry.failure_pattern_detected", {
          platform,
          errorType,
          occurrences: recentCount,
          timeSpan,
          pattern,
        });

        this.logger?.warn(
          `Failure pattern detected: ${platform} - ${errorType} (${recentCount} occurrences)`
        );
      }
    }
  }

  /**
   * Check maintenance window
   */
  async checkMaintenanceWindow(platform) {
    // Platform-specific maintenance windows
    const maintenanceWindows = {
      facebook: [{ start: "02:00", end: "04:00" }], // 2-4 AM
      instagram: [{ start: "01:30", end: "03:30" }], // 1:30-3:30 AM
    };

    const windows = maintenanceWindows[platform];
    if (!windows) return;

    const now = new Date();
    const currentTime = `${now
      .getHours()
      .toString()
      .padStart(2, "0")}:${now
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;

    for (const window of windows) {
      if (currentTime >= window.start && currentTime <= window.end) {
        throw new Error(
          `Platform ${platform} is in maintenance window (${window.start} - ${window.end})`
        );
      }
    }
  }

  /**
   * Platform-specific checks
   */
  async performPlatformChecks(session) {
    switch (session.platform) {
      case "facebook":
        // Check if account might be temporarily restricted
        if (session.errorType === "rate_limited" && session.attemptCount >= 2) {
          await this.delay(30000); // Wait 30 seconds for Facebook
        }
        break;

      case "instagram":
        // Instagram is more sensitive to rapid attempts
        if (session.attemptCount >= 2) {
          await this.delay(45000); // Wait 45 seconds
        }
        break;

      default:
        // Default checks
        break;
    }
  }

  /**
   * Utility delay function
   */
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Start background tasks
   */
  startBackgroundTasks() {
    // Cleanup old retry sessions
    setInterval(() => {
      this.cleanupOldSessions();
    }, 300000); // Every 5 minutes

    // Circuit breaker maintenance
    setInterval(() => {
      this.maintainCircuitBreakers();
    }, 60000); // Every minute

    // Pattern analysis
    setInterval(() => {
      this.analyzeFailurePatterns();
    }, 600000); // Every 10 minutes
  }

  /**
   * Cleanup old retry sessions
   */
  cleanupOldSessions() {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    for (const [sessionId, session] of this.retrySessions) {
      const age = now - session.createdAt.getTime();

      if (
        age > maxAge ||
        (session.completedAt && now - session.completedAt.getTime() > 3600000)
      ) {
        this.retrySessions.delete(sessionId);
        this.logger?.debug(`Cleaned up old retry session: ${sessionId}`);
      }
    }
  }

  /**
   * Maintain circuit breakers
   */
  maintainCircuitBreakers() {
    const now = Date.now();

    for (const [key, breaker] of this.circuitBreakers) {
      // Auto-reset old open circuit breakers
      if (
        breaker.state === "open" &&
        breaker.lastFailureTime &&
        now - breaker.lastFailureTime > this.config.circuitBreakerTimeout * 2
      ) {
        breaker.state = "closed";
        breaker.failureCount = 0;

        this.logger?.info(`Circuit breaker auto-reset: ${key}`);
      }
    }
  }

  /**
   * Analyze failure patterns
   */
  analyzeFailurePatterns() {
    // Generate insights from failure patterns
    const insights = [];

    for (const [key, pattern] of this.failurePatterns) {
      const recentOccurrences = pattern.occurrences.filter(
        (time) => Date.now() - time < this.config.patternDetectionWindow
      );

      if (recentOccurrences.length >= this.config.minPatternOccurrences) {
        insights.push({
          platform: pattern.platform,
          errorType: pattern.errorType,
          frequency: recentOccurrences.length,
          severity: this.calculatePatternSeverity(pattern),
          recommendation: this.generateRecommendation(pattern),
        });
      }
    }

    if (insights.length > 0) {
      this.eventBus?.publish("retry.pattern_analysis", {
        insights,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Calculate pattern severity
   */
  calculatePatternSeverity(pattern) {
    const recentCount = pattern.occurrences.filter(
      (time) => Date.now() - time < 3600000 // Last hour
    ).length;

    if (recentCount >= 10) return "critical";
    if (recentCount >= 5) return "high";
    if (recentCount >= 3) return "medium";
    return "low";
  }

  /**
   * Generate recommendation based on pattern
   */
  generateRecommendation(pattern) {
    const recommendations = {
      rate_limited:
        "Consider implementing longer delays between attempts or reducing concurrent operations",
      captcha_required:
        "Implement CAPTCHA solving service or reduce automation frequency",
      network_timeout: "Check network connectivity and increase timeout values",
      element_not_found:
        "Update selectors or add more robust element waiting logic",
      browser_crash:
        "Check system resources and consider browser stability improvements",
    };

    return (
      recommendations[pattern.errorType] ||
      "Monitor this error pattern and investigate root cause"
    );
  }

  /**
   * Get retry session information
   */
  getRetrySession(retrySessionId) {
    const session = this.retrySessions.get(retrySessionId);
    if (!session) return null;

    return {
      id: session.id,
      originalSessionId: session.originalSessionId,
      platform: session.platform,
      accountId: session.accountId,
      errorType: session.errorType,
      status: session.status,
      attemptCount: session.attemptCount,
      maxAttempts: session.maxAttempts,
      nextAttemptAt: session.nextAttemptAt,
      createdAt: session.createdAt,
      completedAt: session.completedAt,
      attempts: session.attempts.map((a) => ({
        attemptNumber: a.attemptNumber,
        startedAt: a.startedAt,
        completedAt: a.completedAt,
        success: a.success,
        error: a.error,
        duration: a.duration,
      })),
    };
  }

  /**
   * Get retry statistics
   */
  getRetryStats() {
    const sessions = Array.from(this.retrySessions.values());

    return {
      totalSessions: sessions.length,
      pendingSessions: sessions.filter((s) => s.status === "pending").length,
      completedSessions: sessions.filter((s) => s.status === "completed")
        .length,
      failedSessions: sessions.filter((s) => s.status === "failed").length,
      executingSessions: sessions.filter((s) => s.status === "executing")
        .length,

      averageAttempts:
        sessions.length > 0
          ? sessions.reduce((sum, s) => sum + s.attemptCount, 0) /
            sessions.length
          : 0,

      successRate:
        sessions.filter((s) => s.status !== "pending").length > 0
          ? (sessions.filter((s) => s.status === "completed").length /
              sessions.filter((s) => s.status !== "pending").length) *
            100
          : 0,

      errorTypeBreakdown: this.getErrorTypeBreakdown(sessions),
      platformBreakdown: this.getPlatformBreakdown(sessions),
      circuitBreakerStatus: this.getCircuitBreakerStatus(),

      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Helper methods for statistics
   */
  getErrorTypeBreakdown(sessions) {
    const breakdown = {};
    sessions.forEach((session) => {
      breakdown[session.errorType] = (breakdown[session.errorType] || 0) + 1;
    });
    return breakdown;
  }

  getPlatformBreakdown(sessions) {
    const breakdown = {};
    sessions.forEach((session) => {
      breakdown[session.platform] = (breakdown[session.platform] || 0) + 1;
    });
    return breakdown;
  }

  getCircuitBreakerStatus() {
    const status = {};
    for (const [key, breaker] of this.circuitBreakers) {
      status[key] = {
        state: breaker.state,
        failureCount: breaker.failureCount,
        lastFailureTime: breaker.lastFailureTime,
      };
    }
    return status;
  }

  /**
   * Cancel retry session
   */
  async cancelRetrySession(retrySessionId, reason = "user_cancelled") {
    const session = this.retrySessions.get(retrySessionId);
    if (!session) return false;

    session.status = "cancelled";
    session.completedAt = new Date();
    session.cancelReason = reason;

    await this.eventBus?.publish("retry.session_cancelled", {
      retrySessionId,
      originalSessionId: session.originalSessionId,
      reason,
    });

    return true;
  }
}

export default RetryManager;
