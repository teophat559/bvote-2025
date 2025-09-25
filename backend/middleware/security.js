/**
 * Advanced Security Middleware
 * Comprehensive security measures for production
 */

import rateLimit from "express-rate-limit";
import slowDown from "express-slow-down";
import { body, validationResult } from "express-validator";
import crypto from "crypto";
import SecurityService from "../services/SecurityService.js";

const security = new SecurityService(process.env.ENCRYPTION_KEY);

// Advanced rate limiting with different tiers
export const createRateLimiter = (options = {}) => {
  const defaultOptions = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: {
      success: false,
      message: "Too many requests from this IP, please try again later",
      retryAfter: Math.ceil(options.windowMs / 1000) || 900,
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      // Skip rate limiting for health checks
      return req.path === "/health";
    },
  };

  return rateLimit({ ...defaultOptions, ...options });
};

// Strict rate limiting for sensitive endpoints
export const strictRateLimit = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: process.env.NODE_ENV === "production" ? 3 : 20,
  message: {
    success: false,
    message: "Too many sensitive requests, account temporarily locked",
    retryAfter: 300,
  },
});

// Progressive delay for repeated requests
export const slowDownMiddleware = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // allow 50 requests per windowMs without delay
  delayMs: () => 500, // Fixed for express-slow-down v2 compatibility
  maxDelayMs: 20000, // max 20 second delay
  skipFailedRequests: false,
  skipSuccessfulRequests: false,
  validate: { delayMs: false }, // Disable warning message
});

// IP-based security checks
export const ipSecurityCheck = (req, res, next) => {
  const clientIP = getClientIP(req);

  // Block known malicious IPs (in production, use a real blacklist service)
  const blacklistedIPs = process.env.BLACKLISTED_IPS?.split(",") || [];

  if (blacklistedIPs.includes(clientIP)) {
    return res.status(403).json({
      success: false,
      message: "Access denied",
    });
  }

  // Whitelist for admin endpoints in production
  if (
    req.path.startsWith("/api/admin") &&
    process.env.NODE_ENV === "production"
  ) {
    const whitelistedIPs = process.env.ADMIN_WHITELIST_IPS?.split(",") || [];

    if (whitelistedIPs.length > 0 && !whitelistedIPs.includes(clientIP)) {
      console.log(`Blocked admin access from non-whitelisted IP: ${clientIP}`);
      return res.status(403).json({
        success: false,
        message: "Admin access restricted",
      });
    }
  }

  req.clientIP = clientIP;
  next();
};

// Request signature validation
export const validateRequestSignature = (req, res, next) => {
  // Skip for GET requests and health checks
  if (req.method === "GET" || req.path === "/health") {
    return next();
  }

  const signature = req.headers["x-signature"];
  const timestamp = req.headers["x-timestamp"];
  const nonce = req.headers["x-nonce"];

  if (!signature || !timestamp || !nonce) {
    return res.status(400).json({
      success: false,
      message: "Missing security headers",
    });
  }

  // Check timestamp (prevent replay attacks)
  const now = Date.now();
  const requestTime = parseInt(timestamp);
  const timeDiff = Math.abs(now - requestTime);

  if (timeDiff > 5 * 60 * 1000) {
    // 5 minutes tolerance
    return res.status(400).json({
      success: false,
      message: "Request timestamp too old",
    });
  }

  // Validate signature (simplified - in production use proper HMAC)
  const payload = JSON.stringify(req.body) + timestamp + nonce;
  const expectedSignature = crypto
    .createHmac(
      "sha256",
      process.env.REQUEST_SIGNATURE_SECRET || "default-secret"
    )
    .update(payload)
    .digest("hex");

  if (signature !== expectedSignature) {
    return res.status(400).json({
      success: false,
      message: "Invalid request signature",
    });
  }

  next();
};

// Advanced input validation and sanitization
export const advancedValidation = {
  // Email validation with additional checks
  email: () => [
    body("email")
      .isEmail()
      .normalizeEmail()
      .isLength({ max: 254 })
      .custom(async (value) => {
        // Check for disposable email domains
        const disposableDomains = [
          "10minutemail.com",
          "tempmail.org",
          "guerrillamail.com",
        ];
        const domain = value.split("@")[1];

        if (disposableDomains.includes(domain)) {
          throw new Error("Disposable email addresses are not allowed");
        }

        return true;
      }),
  ],

  // Strong password validation
  password: () => [
    body("password")
      .isLength({ min: 8, max: 128 })
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
      )
      .withMessage(
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
      )
      .custom((value) => {
        // Check against common passwords
        const commonPasswords = [
          "password",
          "123456",
          "password123",
          "admin",
          "qwerty",
        ];
        if (
          commonPasswords.some((common) => value.toLowerCase().includes(common))
        ) {
          throw new Error("Password is too common");
        }
        return true;
      }),
  ],

  // Admin key validation
  adminKey: () => [
    body("adminKey")
      .isString()
      .isLength({ min: 10, max: 100 })
      .matches(/^[A-Za-z0-9$@!%*?&]+$/)
      .withMessage("Invalid admin key format"),
  ],

  // General text sanitization
  text: (field, options = {}) => [
    body(field)
      .trim()
      .escape()
      .isLength({ min: options.min || 1, max: options.max || 1000 })
      .custom((value) => {
        // Remove potentially dangerous patterns
        const dangerous = /<script|javascript:|on\w+=/gi;
        if (dangerous.test(value)) {
          throw new Error("Potentially dangerous content detected");
        }
        return true;
      }),
  ],
};

// Validation error handler
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((error) => ({
      field: error.param,
      message: error.msg,
      value: error.value,
    }));

    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errorMessages,
    });
  }

  next();
};

// Content Security Policy
export const contentSecurityPolicy = (req, res, next) => {
  const cspDirectives = {
    "default-src": ["'self'"],
    "script-src": ["'self'", "'unsafe-inline'"],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "https:"],
    "connect-src": ["'self'", "ws:", "wss:"],
    "font-src": ["'self'"],
    "object-src": ["'none'"],
    "media-src": ["'self'"],
    "frame-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
  };

  const cspHeader = Object.entries(cspDirectives)
    .map(([directive, sources]) => `${directive} ${sources.join(" ")}`)
    .join("; ");

  res.setHeader("Content-Security-Policy", cspHeader);
  next();
};

// Security headers middleware
export const securityHeaders = (req, res, next) => {
  const headers = security.getSecurityHeaders();

  // Additional security headers
  const additionalHeaders = {
    "X-Permitted-Cross-Domain-Policies": "none",
    "X-Download-Options": "noopen",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Embedder-Policy": "require-corp",
    "Cross-Origin-Resource-Policy": "same-origin",
    "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
  };

  // Set all security headers
  Object.entries({ ...headers, ...additionalHeaders }).forEach(
    ([header, value]) => {
      res.setHeader(header, value);
    }
  );

  next();
};

// Request logging for security monitoring
export const securityLogger = (req, res, next) => {
  const startTime = Date.now();

  // Log suspicious patterns
  const suspiciousPatterns = [
    /\.\./, // Path traversal
    /[<>]/, // XSS attempts
    /union.*select/i, // SQL injection
    /script/i, // Script injection
    /eval\(/i, // Code injection
    /exec\(/i, // Command injection
  ];

  const isSuspicious = suspiciousPatterns.some(
    (pattern) =>
      pattern.test(req.url) ||
      pattern.test(JSON.stringify(req.body)) ||
      pattern.test(JSON.stringify(req.query))
  );

  if (isSuspicious) {
    console.warn("🚨 Suspicious request detected:", {
      ip: getClientIP(req),
      url: req.url,
      method: req.method,
      userAgent: req.headers["user-agent"],
      body: req.body,
      query: req.query,
      timestamp: new Date().toISOString(),
    });
  }

  // Log response time and status
  res.on("finish", () => {
    const duration = Date.now() - startTime;

    if (duration > 5000 || res.statusCode >= 400) {
      console.log("🐌 Slow or failed request:", {
        ip: getClientIP(req),
        method: req.method,
        url: req.url,
        status: res.statusCode,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
      });
    }
  });

  next();
};

// Honeypot middleware (detect bots)
export const honeypot = (req, res, next) => {
  // Check for honeypot field in forms
  if (req.body && req.body.website) {
    // If honeypot field is filled, it's likely a bot
    console.warn("🍯 Honeypot triggered by:", getClientIP(req));
    return res.status(400).json({
      success: false,
      message: "Invalid form submission",
    });
  }

  next();
};

// Helper function to get client IP
function getClientIP(req) {
  return (
    req.headers["x-forwarded-for"] ||
    req.headers["x-real-ip"] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.ip
  );
}

// Export all middleware
export default {
  createRateLimiter,
  strictRateLimit,
  slowDownMiddleware,
  ipSecurityCheck,
  validateRequestSignature,
  advancedValidation,
  handleValidationErrors,
  contentSecurityPolicy,
  securityHeaders,
  securityLogger,
  honeypot,
};
