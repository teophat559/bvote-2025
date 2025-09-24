/**
 * Authentication Middleware - Enhanced Security
 * JWT token validation, role-based access control, and session management
 */

import jwt from "jsonwebtoken";
import SecurityService from "../services/SecurityService.js";

const security = new SecurityService(process.env.ENCRYPTION_KEY);

// JWT token validation middleware
export const requireAuth = async (req, res, next) => {
  try {
    const token = extractToken(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access token required",
      });
    }

    // Verify token
    const decoded = security.verifyToken(token);

    // Check if session is still valid
    if (decoded.sessionId) {
      const sessionCheck = security.validateSession(decoded.sessionId);
      if (!sessionCheck.valid) {
        return res.status(401).json({
          success: false,
          message: "Session expired or invalid",
        });
      }
    }

    // Add user info to request
    req.user = {
      id: decoded.userId,
      role: decoded.role || "user",
      sessionId: decoded.sessionId,
    };

    // Log access
    await logAccess(req, "auth_success");

    next();
  } catch (error) {
    await logAccess(req, "auth_failed", { error: error.message });

    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Admin role validation middleware
export const requireAdmin = async (req, res, next) => {
  try {
    // First check basic auth
    await requireAuth(req, res, async () => {
      // Check admin role
      if (req.user.role !== "admin" && req.user.role !== "superadmin") {
        await logAccess(req, "admin_access_denied");

        return res.status(403).json({
          success: false,
          message: "Admin access required",
        });
      }

      await logAccess(req, "admin_access_granted");
      next();
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Authentication error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Admin key validation middleware
export const requireAdminKey = async (req, res, next) => {
  try {
    const adminKey =
      req.headers["x-admin-key"] || req.body.adminKey || req.query.adminKey;

    if (!adminKey) {
      return res.status(401).json({
        success: false,
        message: "Admin key required",
      });
    }

    if (!security.validateAdminKey(adminKey)) {
      await logAccess(req, "invalid_admin_key", {
        providedKey: adminKey.substring(0, 5) + "***",
      });

      return res.status(401).json({
        success: false,
        message: "Invalid admin key",
      });
    }

    // Create admin user context
    req.user = {
      id: "admin-system",
      role: "superadmin",
      adminKey: true,
    };

    await logAccess(req, "admin_key_success");
    next();
  } catch (error) {
    await logAccess(req, "admin_key_error", { error: error.message });

    return res.status(500).json({
      success: false,
      message: "Admin key validation error",
    });
  }
};

// Optional auth - doesn't fail if no token
export const optionalAuth = async (req, res, next) => {
  try {
    const token = extractToken(req);

    if (token) {
      const decoded = security.verifyToken(token);
      req.user = {
        id: decoded.userId,
        role: decoded.role || "user",
        sessionId: decoded.sessionId,
      };
    }

    next();
  } catch (error) {
    // Continue without auth
    next();
  }
};

// Rate limiting by user
export const rateLimitByUser = (
  maxRequests = 100,
  windowMs = 15 * 60 * 1000
) => {
  const requests = new Map();

  return (req, res, next) => {
    const userId = req.user?.id || req.ip;
    const now = Date.now();

    if (!requests.has(userId)) {
      requests.set(userId, []);
    }

    const userRequests = requests.get(userId);

    // Remove old requests
    const validRequests = userRequests.filter((time) => now - time < windowMs);

    if (validRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: "Too many requests",
        retryAfter: Math.ceil(windowMs / 1000),
      });
    }

    validRequests.push(now);
    requests.set(userId, validRequests);

    next();
  };
};

// IP whitelist middleware
export const requireWhitelistedIP = (whitelist = []) => {
  return (req, res, next) => {
    const clientIP = getClientIP(req);

    if (whitelist.length === 0 || whitelist.includes(clientIP)) {
      next();
    } else {
      logAccess(req, "ip_blocked", { ip: clientIP });

      res.status(403).json({
        success: false,
        message: "IP address not allowed",
      });
    }
  };
};

// CSRF protection
export const csrfProtection = (req, res, next) => {
  if (
    req.method === "GET" ||
    req.method === "HEAD" ||
    req.method === "OPTIONS"
  ) {
    return next();
  }

  const token = req.headers["x-csrf-token"] || req.body._csrf;
  const sessionToken = req.session?.csrfToken;

  if (!token || token !== sessionToken) {
    return res.status(403).json({
      success: false,
      message: "Invalid CSRF token",
    });
  }

  next();
};

// Helper functions
function extractToken(req) {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  // Check cookie
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }

  // Check query parameter (less secure, for development only)
  if (process.env.NODE_ENV === "development" && req.query.token) {
    return req.query.token;
  }

  return null;
}

function getClientIP(req) {
  return (
    req.headers["x-forwarded-for"] ||
    req.headers["x-real-ip"] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.ip
  );
}

async function logAccess(req, action, details = {}) {
  try {
    const logData = {
      action,
      ip: getClientIP(req),
      userAgent: req.headers["user-agent"],
      url: req.originalUrl,
      method: req.method,
      timestamp: new Date().toISOString(),
      userId: req.user?.id,
      ...details,
    };

    // In production, this would go to your database
    console.log("ACCESS LOG:", JSON.stringify(logData));
  } catch (error) {
    console.error("Logging error:", error);
  }
}

// Generate CSRF token
export const generateCSRFToken = (req, res, next) => {
  if (!req.session.csrfToken) {
    req.session.csrfToken = security.generateSecureRandom(32);
  }

  res.locals.csrfToken = req.session.csrfToken;
  next();
};

export default {
  requireAuth,
  requireAdmin,
  requireAdminKey,
  optionalAuth,
  rateLimitByUser,
  requireWhitelistedIP,
  csrfProtection,
  generateCSRFToken,
};
