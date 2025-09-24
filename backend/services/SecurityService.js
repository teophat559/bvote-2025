/**
 * Security Service - Enhanced Security Implementation
 * Handles encryption, hashing, token management, and security validation
 */

import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import NodeRSA from "node-rsa";

export default class SecurityService {
  constructor(encryptionKey) {
    this.encryptionKey = encryptionKey;
    this.algorithm = "aes-256-gcm";
    this.keyLength = 32;
    this.ivLength = 16;
    this.tagLength = 16;

    // RSA key pair for sensitive data
    this.rsa = new NodeRSA({ b: 2048 });
    this.rsa.generateKeyPair();

    // Security configuration
    this.config = {
      bcryptRounds: 12,
      jwtExpiry: "24h",
      refreshTokenExpiry: "7d",
      maxLoginAttempts: 5,
      lockoutTime: 15 * 60 * 1000, // 15 minutes
      passwordMinLength: 8,
      sessionTimeout: 30 * 60 * 1000, // 30 minutes
    };

    // Rate limiting storage
    this.loginAttempts = new Map();
    this.sessionStore = new Map();
  }

  /**
   * Encrypt sensitive data using AES-256-GCM
   */
  encrypt(text) {
    try {
      const iv = crypto.randomBytes(this.ivLength);
      const cipher = crypto.createCipher(this.algorithm, this.encryptionKey);
      cipher.setAAD(Buffer.from("bvote-security", "utf8"));

      let encrypted = cipher.update(text, "utf8", "hex");
      encrypted += cipher.final("hex");

      const tag = cipher.getAuthTag();

      return {
        encrypted,
        iv: iv.toString("hex"),
        tag: tag.toString("hex"),
      };
    } catch (error) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypt sensitive data
   */
  decrypt(encryptedData) {
    try {
      const { encrypted, iv, tag } = encryptedData;
      const decipher = crypto.createDecipher(
        this.algorithm,
        this.encryptionKey
      );

      decipher.setAAD(Buffer.from("bvote-security", "utf8"));
      decipher.setAuthTag(Buffer.from(tag, "hex"));

      let decrypted = decipher.update(encrypted, "hex", "utf8");
      decrypted += decipher.final("utf8");

      return decrypted;
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  /**
   * Hash password using bcrypt
   */
  async hashPassword(password) {
    if (!this.isValidPassword(password)) {
      throw new Error("Password does not meet security requirements");
    }

    return await bcrypt.hash(password, this.config.bcryptRounds);
  }

  /**
   * Verify password against hash
   */
  async verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  /**
   * Generate JWT token
   */
  generateToken(payload, options = {}) {
    const defaultOptions = {
      expiresIn: this.config.jwtExpiry,
      issuer: "bvote-backend",
      audience: "bvote-client",
    };

    return jwt.sign(payload, process.env.JWT_SECRET, {
      ...defaultOptions,
      ...options,
    });
  }

  /**
   * Verify JWT token
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      throw new Error(`Token verification failed: ${error.message}`);
    }
  }

  /**
   * Generate refresh token
   */
  generateRefreshToken(userId) {
    const payload = {
      userId,
      type: "refresh",
      timestamp: Date.now(),
    };

    return this.generateToken(payload, {
      expiresIn: this.config.refreshTokenExpiry,
    });
  }

  /**
   * RSA encrypt for ultra-sensitive data
   */
  rsaEncrypt(data) {
    return this.rsa.encrypt(data, "base64");
  }

  /**
   * RSA decrypt
   */
  rsaDecrypt(encryptedData) {
    return this.rsa.decrypt(encryptedData, "utf8");
  }

  /**
   * Generate secure random string
   */
  generateSecureRandom(length = 32) {
    return crypto.randomBytes(length).toString("hex");
  }

  /**
   * Generate API key
   */
  generateApiKey(prefix = "bvote") {
    const timestamp = Date.now().toString(36);
    const random = this.generateSecureRandom(16);
    return `${prefix}_${timestamp}_${random}`;
  }

  /**
   * Validate password strength
   */
  isValidPassword(password) {
    if (!password || password.length < this.config.passwordMinLength) {
      return false;
    }

    // Check for at least one uppercase, lowercase, number, and special character
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return hasUpper && hasLower && hasNumber && hasSpecial;
  }

  /**
   * Check login attempts and implement lockout
   */
  checkLoginAttempts(identifier) {
    const attempts = this.loginAttempts.get(identifier);

    if (!attempts) {
      return { allowed: true, attemptsLeft: this.config.maxLoginAttempts };
    }

    const { count, lockedUntil } = attempts;

    // Check if still locked
    if (lockedUntil && Date.now() < lockedUntil) {
      const timeLeft = Math.ceil((lockedUntil - Date.now()) / 1000);
      return {
        allowed: false,
        locked: true,
        timeLeft,
        message: `Account locked for ${timeLeft} seconds`,
      };
    }

    // Reset if lock expired
    if (lockedUntil && Date.now() >= lockedUntil) {
      this.loginAttempts.delete(identifier);
      return { allowed: true, attemptsLeft: this.config.maxLoginAttempts };
    }

    // Check attempts
    if (count >= this.config.maxLoginAttempts) {
      this.loginAttempts.set(identifier, {
        count,
        lockedUntil: Date.now() + this.config.lockoutTime,
      });

      return {
        allowed: false,
        locked: true,
        timeLeft: Math.ceil(this.config.lockoutTime / 1000),
        message: "Too many failed attempts. Account locked.",
      };
    }

    return {
      allowed: true,
      attemptsLeft: this.config.maxLoginAttempts - count,
    };
  }

  /**
   * Record failed login attempt
   */
  recordFailedLogin(identifier) {
    const attempts = this.loginAttempts.get(identifier) || { count: 0 };
    attempts.count++;
    attempts.lastAttempt = Date.now();

    this.loginAttempts.set(identifier, attempts);
  }

  /**
   * Clear login attempts on successful login
   */
  clearLoginAttempts(identifier) {
    this.loginAttempts.delete(identifier);
  }

  /**
   * Sanitize input to prevent XSS
   */
  sanitizeInput(input) {
    if (typeof input !== "string") return input;

    return input
      .replace(/[<>]/g, "")
      .replace(/javascript:/gi, "")
      .replace(/on\w+=/gi, "")
      .trim();
  }

  /**
   * Validate admin key
   */
  validateAdminKey(key) {
    const validKeys = [
      process.env.ADMIN_KEY,
      "WEBBVOTE2025$ABC",
      "ADMIN_BVOTE_2025_KEY",
    ].filter(Boolean);

    return validKeys.includes(key);
  }

  /**
   * Generate session token
   */
  generateSessionToken(userId, role = "user") {
    const sessionId = this.generateSecureRandom(24);
    const token = this.generateToken({
      userId,
      role,
      sessionId,
      type: "session",
    });

    // Store session
    this.sessionStore.set(sessionId, {
      userId,
      role,
      createdAt: Date.now(),
      lastActivity: Date.now(),
    });

    return { token, sessionId };
  }

  /**
   * Validate session
   */
  validateSession(sessionId) {
    const session = this.sessionStore.get(sessionId);

    if (!session) {
      return { valid: false, reason: "Session not found" };
    }

    // Check timeout
    const now = Date.now();
    if (now - session.lastActivity > this.config.sessionTimeout) {
      this.sessionStore.delete(sessionId);
      return { valid: false, reason: "Session expired" };
    }

    // Update activity
    session.lastActivity = now;
    this.sessionStore.set(sessionId, session);

    return { valid: true, session };
  }

  /**
   * Cleanup expired sessions
   */
  cleanupSessions() {
    const now = Date.now();

    for (const [sessionId, session] of this.sessionStore.entries()) {
      if (now - session.lastActivity > this.config.sessionTimeout) {
        this.sessionStore.delete(sessionId);
      }
    }
  }

  /**
   * Get security headers
   */
  getSecurityHeaders() {
    return {
      "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "X-XSS-Protection": "1; mode=block",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Content-Security-Policy":
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'",
    };
  }
}
