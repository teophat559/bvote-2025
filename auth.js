/**
 * 🔐 REAL USER AUTHENTICATION SYSTEM
 * Production-ready authentication với security best practices
 */

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import rateLimit from 'express-rate-limit';

export class RealUserAuthentication {
  constructor() {
    this.users = new Map(); // In production: use PostgreSQL/MongoDB
    this.sessions = new Map();
    this.blacklistedTokens = new Set();
    this.loginAttempts = new Map();

    // JWT Configuration
    this.JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');
    this.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || crypto.randomBytes(64).toString('hex');
    this.JWT_EXPIRES_IN = '15m';
    this.REFRESH_TOKEN_EXPIRES_IN = '7d';

    // Security configurations
    this.MAX_LOGIN_ATTEMPTS = 5;
    this.LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes
    this.SALT_ROUNDS = 12;
  }

  // 👤 REGISTER NEW USER
  async registerUser(userData) {
    try {
      const { email, password, fullName, phone, role = 'user' } = userData;

      // Input validation
      if (!email || !password || !fullName) {
        throw new Error('Email, password và họ tên là bắt buộc');
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Email không hợp lệ');
      }

      // Password strength validation
      const passwordValidation = this.validatePasswordStrength(password);
      if (!passwordValidation.isValid) {
        throw new Error(`Mật khẩu không đủ mạnh: ${passwordValidation.errors.join(', ')}`);
      }

      // Check if user already exists
      const existingUser = Array.from(this.users.values()).find(u => u.email === email);
      if (existingUser) {
        throw new Error('Email đã được sử dụng');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, this.SALT_ROUNDS);

      // Generate user ID and verification token
      const userId = crypto.randomUUID();
      const verificationToken = crypto.randomBytes(32).toString('hex');

      // Create user object
      const user = {
        id: userId,
        email,
        password: hashedPassword,
        fullName,
        phone: phone || null,
        role,
        status: 'pending_verification',
        emailVerified: false,
        phoneVerified: false,
        verificationToken,
        twoFactorEnabled: false,
        twoFactorSecret: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLogin: null,
        loginCount: 0,
        securityEvents: []
      };

      // Store user
      this.users.set(userId, user);

      // Log security event
      this.logSecurityEvent(userId, 'USER_REGISTERED', { email });

      return {
        success: true,
        userId,
        verificationToken,
        message: 'Đăng ký thành công. Vui lòng xác thực email.'
      };

    } catch (error) {
      console.error('Registration error:', error.message);
      throw error;
    }
  }

  // ✅ VERIFY EMAIL
  async verifyEmail(token) {
    try {
      const user = Array.from(this.users.values()).find(u => u.verificationToken === token);

      if (!user) {
        throw new Error('Token xác thực không hợp lệ');
      }

      user.emailVerified = true;
      user.status = 'active';
      user.verificationToken = null;
      user.updatedAt = new Date().toISOString();

      this.logSecurityEvent(user.id, 'EMAIL_VERIFIED', { email: user.email });

      return {
        success: true,
        message: 'Email đã được xác thực thành công'
      };

    } catch (error) {
      console.error('Email verification error:', error.message);
      throw error;
    }
  }

  // 🔑 LOGIN USER
  async loginUser(credentials, req = {}) {
    try {
      const { email, password, twoFactorCode, rememberMe = false } = credentials;
      const ipAddress = req.ip || 'unknown';
      const userAgent = req.headers?.['user-agent'] || 'unknown';

      // Rate limiting check
      const attemptKey = `${email}:${ipAddress}`;
      if (this.isLockedOut(attemptKey)) {
        throw new Error('Tài khoản tạm thời bị khóa do quá nhiều lần đăng nhập sai');
      }

      // Find user
      const user = Array.from(this.users.values()).find(u => u.email === email);
      if (!user) {
        this.recordFailedAttempt(attemptKey);
        throw new Error('Email hoặc mật khẩu không đúng');
      }

      // Check user status
      if (user.status !== 'active') {
        throw new Error('Tài khoản chưa được kích hoạt hoặc đã bị khóa');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        this.recordFailedAttempt(attemptKey);
        this.logSecurityEvent(user.id, 'FAILED_LOGIN', {
          email, ipAddress, userAgent, reason: 'invalid_password'
        });
        throw new Error('Email hoặc mật khẩu không đúng');
      }

      // Check 2FA if enabled
      if (user.twoFactorEnabled) {
        if (!twoFactorCode) {
          throw new Error('Vui lòng nhập mã 2FA');
        }

        const isValidTwoFactor = speakeasy.totp.verify({
          secret: user.twoFactorSecret,
          encoding: 'base32',
          token: twoFactorCode,
          window: 2
        });

        if (!isValidTwoFactor) {
          this.recordFailedAttempt(attemptKey);
          this.logSecurityEvent(user.id, 'FAILED_2FA', { email, ipAddress });
          throw new Error('Mã 2FA không đúng');
        }
      }

      // Clear failed attempts
      this.clearFailedAttempts(attemptKey);

      // Generate tokens
      const sessionId = crypto.randomUUID();
      const accessToken = this.generateAccessToken(user);
      const refreshToken = this.generateRefreshToken(user, sessionId);

      // Create session
      const session = {
        id: sessionId,
        userId: user.id,
        refreshToken,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + (rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000)).toISOString(),
        ipAddress,
        userAgent,
        active: true
      };

      this.sessions.set(sessionId, session);

      // Update user login info
      user.lastLogin = new Date().toISOString();
      user.loginCount++;
      user.updatedAt = new Date().toISOString();

      // Log successful login
      this.logSecurityEvent(user.id, 'SUCCESSFUL_LOGIN', {
        email, ipAddress, userAgent, sessionId
      });

      return {
        success: true,
        accessToken,
        refreshToken,
        sessionId,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          twoFactorEnabled: user.twoFactorEnabled
        }
      };

    } catch (error) {
      console.error('Login error:', error.message);
      throw error;
    }
  }

  // 🔄 REFRESH TOKEN
  async refreshToken(refreshTokenString) {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshTokenString, this.JWT_REFRESH_SECRET);

      // Find session
      const session = this.sessions.get(decoded.sessionId);
      if (!session || !session.active || session.refreshToken !== refreshTokenString) {
        throw new Error('Refresh token không hợp lệ');
      }

      // Check expiration
      if (new Date() > new Date(session.expiresAt)) {
        this.sessions.delete(decoded.sessionId);
        throw new Error('Session đã hết hạn');
      }

      // Find user
      const user = this.users.get(session.userId);
      if (!user || user.status !== 'active') {
        throw new Error('User không hợp lệ');
      }

      // Generate new access token
      const newAccessToken = this.generateAccessToken(user);

      // Log token refresh
      this.logSecurityEvent(user.id, 'TOKEN_REFRESHED', {
        sessionId: session.id
      });

      return {
        success: true,
        accessToken: newAccessToken
      };

    } catch (error) {
      console.error('Refresh token error:', error.message);
      throw error;
    }
  }

  // 🚪 LOGOUT
  async logout(sessionId) {
    try {
      const session = this.sessions.get(sessionId);
      if (session) {
        session.active = false;
        this.logSecurityEvent(session.userId, 'USER_LOGOUT', { sessionId });
      }

      return {
        success: true,
        message: 'Đăng xuất thành công'
      };

    } catch (error) {
      console.error('Logout error:', error.message);
      throw error;
    }
  }

  // 🔐 SETUP 2FA
  async setup2FA(userId) {
    try {
      const user = this.users.get(userId);
      if (!user) {
        throw new Error('User không tồn tại');
      }

      // Generate secret
      const secret = speakeasy.generateSecret({
        name: `BVOTE (${user.email})`,
        issuer: 'BVOTE 2025'
      });

      // Generate QR code
      const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

      // Temporarily store secret (will be confirmed on verification)
      user.tempTwoFactorSecret = secret.base32;

      return {
        success: true,
        secret: secret.base32,
        qrCode: qrCodeUrl,
        manualEntryKey: secret.base32
      };

    } catch (error) {
      console.error('2FA setup error:', error.message);
      throw error;
    }
  }

  // ✅ ENABLE 2FA
  async enable2FA(userId, token) {
    try {
      const user = this.users.get(userId);
      if (!user || !user.tempTwoFactorSecret) {
        throw new Error('Setup 2FA trước khi enable');
      }

      // Verify token
      const isValid = speakeasy.totp.verify({
        secret: user.tempTwoFactorSecret,
        encoding: 'base32',
        token,
        window: 2
      });

      if (!isValid) {
        throw new Error('Mã xác thực không đúng');
      }

      // Enable 2FA
      user.twoFactorEnabled = true;
      user.twoFactorSecret = user.tempTwoFactorSecret;
      user.tempTwoFactorSecret = null;
      user.updatedAt = new Date().toISOString();

      this.logSecurityEvent(userId, '2FA_ENABLED', {});

      return {
        success: true,
        message: '2FA đã được kích hoạt thành công'
      };

    } catch (error) {
      console.error('Enable 2FA error:', error.message);
      throw error;
    }
  }

  // Helper Methods
  generateAccessToken(user) {
    return jwt.sign({
      userId: user.id,
      email: user.email,
      role: user.role
    }, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN,
      issuer: 'bvote-2025',
      audience: 'bvote-users'
    });
  }

  generateRefreshToken(user, sessionId) {
    return jwt.sign({
      userId: user.id,
      sessionId
    }, this.JWT_REFRESH_SECRET, {
      expiresIn: this.REFRESH_TOKEN_EXPIRES_IN,
      issuer: 'bvote-2025',
      audience: 'bvote-users'
    });
  }

  validatePasswordStrength(password) {
    const errors = [];

    if (password.length < 8) {
      errors.push('ít nhất 8 ký tự');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('ít nhất 1 chữ hoa');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('ít nhất 1 chữ thường');
    }

    if (!/\d/.test(password)) {
      errors.push('ít nhất 1 số');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('ít nhất 1 ký tự đặc biệt');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  isLockedOut(attemptKey) {
    const attempts = this.loginAttempts.get(attemptKey);
    if (!attempts) return false;

    return attempts.count >= this.MAX_LOGIN_ATTEMPTS &&
           (Date.now() - attempts.lastAttempt) < this.LOCKOUT_TIME;
  }

  recordFailedAttempt(attemptKey) {
    const attempts = this.loginAttempts.get(attemptKey) || { count: 0, lastAttempt: 0 };
    attempts.count++;
    attempts.lastAttempt = Date.now();
    this.loginAttempts.set(attemptKey, attempts);
  }

  clearFailedAttempts(attemptKey) {
    this.loginAttempts.delete(attemptKey);
  }

  logSecurityEvent(userId, event, data) {
    const user = this.users.get(userId);
    if (user) {
      user.securityEvents.push({
        event,
        data,
        timestamp: new Date().toISOString()
      });

      // Keep only last 50 events
      if (user.securityEvents.length > 50) {
        user.securityEvents = user.securityEvents.slice(-50);
      }
    }

    // In production: log to security monitoring system
    console.log(`🔐 SECURITY EVENT [${event}] User: ${userId}`, data);
  }

  // Middleware for route protection
  authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    if (this.blacklistedTokens.has(token)) {
      return res.status(401).json({ error: 'Token đã bị vô hiệu hóa' });
    }

    jwt.verify(token, this.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({ error: 'Token không hợp lệ' });
      }

      const user = this.users.get(decoded.userId);
      if (!user || user.status !== 'active') {
        return res.status(403).json({ error: 'User không hợp lệ' });
      }

      req.user = decoded;
      next();
    });
  }

  // Rate limiting middleware
  createLoginRateLimit() {
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // limit each IP to 5 login attempts per windowMs
      message: 'Quá nhiều lần đăng nhập, vui lòng thử lại sau.',
      standardHeaders: true,
      legacyHeaders: false,
    });
  }
}

export default RealUserAuthentication;
