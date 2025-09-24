/**
 * Authentication Routes - Enhanced Security
 * Login, logout, token refresh, and user management
 */

import express from "express";
import bcrypt from "bcryptjs";
import SecurityService from "../services/SecurityService.js";
import DatabaseService from "../services/DatabaseService.js";
import { body, validationResult } from "express-validator";

const router = express.Router();
const security = new SecurityService(process.env.ENCRYPTION_KEY);
const database = new DatabaseService(
  process.env.DATABASE_URL || "sqlite:./data/bvote.db"
);

// Validation rules
const loginValidation = [
  body("email").isEmail().normalizeEmail(),
  body("password").isLength({ min: 1 }),
  body("adminKey").optional().isString(),
];

const registerValidation = [
  body("email").isEmail().normalizeEmail(),
  body("password")
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/),
  body("name").isLength({ min: 2 }).trim().escape(),
];

// POST /api/auth/login
router.post("/login", loginValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { email, password, adminKey } = req.body;
    const clientIP = req.ip;

    // Check login attempts
    const attemptsCheck = security.checkLoginAttempts(email);
    if (!attemptsCheck.allowed) {
      return res.status(429).json({
        success: false,
        message: attemptsCheck.message,
        timeLeft: attemptsCheck.timeLeft,
      });
    }

    let user = null;
    let isAdminKeyLogin = false;

    // Admin key login
    if (adminKey) {
      if (!security.validateAdminKey(adminKey)) {
        security.recordFailedLogin(email);
        return res.status(401).json({
          success: false,
          message: "Invalid admin key",
        });
      }

      user = {
        id: "admin-system",
        email: "admin@bvote.com",
        role: "superadmin",
        name: "Super Administrator",
      };
      isAdminKeyLogin = true;
    } else {
      // Regular user login - check mock users first
      if (email === "user@bvote.com" && password === "password123") {
        user = {
          id: "user-123",
          email: "user@bvote.com",
          role: "user",
          name: "Test User",
        };
      } else if (email === "admin@bvote.com" && password === "admin123") {
        user = {
          id: "admin-456",
          email: "admin@bvote.com",
          role: "admin",
          name: "Admin User",
        };
      } else {
        // Check database for real users
        const dbUser = await database.findAll("users", { email, is_active: 1 });
        if (dbUser.length > 0) {
          const validPassword = await security.verifyPassword(
            password,
            dbUser[0].password_hash
          );
          if (validPassword) {
            user = {
              id: dbUser[0].id,
              email: dbUser[0].email,
              role: dbUser[0].role,
              name: dbUser[0].name || "User",
            };
          }
        }
      }
    }

    if (!user) {
      security.recordFailedLogin(email);
      await database.logAccess(null, "login_failed", {
        ip: clientIP,
        email,
        reason: "invalid_credentials",
      });

      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
        attemptsLeft: attemptsCheck.attemptsLeft - 1,
      });
    }

    // Successful login
    security.clearLoginAttempts(email);

    // Generate tokens
    const { token, sessionId } = security.generateSessionToken(
      user.id,
      user.role
    );
    const refreshToken = security.generateRefreshToken(user.id);

    // Update last login
    if (!isAdminKeyLogin && user.id !== "user-123" && user.id !== "admin-456") {
      await database.update("users", user.id, {
        last_login: new Date().toISOString(),
      });
    }

    // Log successful access
    await database.logAccess(user.id, "login_success", {
      ip: clientIP,
      userAgent: req.headers["user-agent"],
      isAdminKey: isAdminKeyLogin,
    });

    // Set secure cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    res.json({
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
      token,
      refreshToken,
      expiresIn: "24h",
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// POST /api/auth/register
router.post("/register", registerValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { email, password, name } = req.body;

    // Check if user already exists
    const existingUser = await database.findAll("users", { email });
    if (existingUser.length > 0) {
      return res.status(409).json({
        success: false,
        message: "User already exists",
      });
    }

    // Hash password
    const passwordHash = await security.hashPassword(password);

    // Create user
    const newUser = await database.create("users", {
      email,
      password_hash: passwordHash,
      name,
      role: "user",
      is_active: 1,
      created_at: new Date().toISOString(),
    });

    // Log registration
    await database.logAccess(newUser.id, "user_registered", {
      ip: req.ip,
      email,
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// POST /api/auth/refresh
router.post("/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token required",
      });
    }

    // Verify refresh token
    const decoded = security.verifyToken(refreshToken);

    if (decoded.type !== "refresh") {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token type",
      });
    }

    // Generate new access token
    const { token, sessionId } = security.generateSessionToken(decoded.userId);

    res.json({
      success: true,
      token,
      expiresIn: "24h",
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Invalid refresh token",
    });
  }
});

// POST /api/auth/logout
router.post("/logout", async (req, res) => {
  try {
    const token = req.headers.authorization?.substring(7);

    if (token) {
      try {
        const decoded = security.verifyToken(token);

        // Invalidate session if exists
        if (decoded.sessionId) {
          // In a real implementation, you'd blacklist the token or remove the session
          console.log(`Logging out session: ${decoded.sessionId}`);
        }

        // Log logout
        await database.logAccess(decoded.userId, "logout", {
          ip: req.ip,
        });
      } catch (error) {
        // Token might be expired, that's ok for logout
      }
    }

    // Clear cookie
    res.clearCookie("token");

    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// GET /api/auth/me
router.get("/me", async (req, res) => {
  try {
    const token = req.headers.authorization?.substring(7);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    const decoded = security.verifyToken(token);

    // Get user details
    let user;
    if (decoded.userId === "admin-system") {
      user = {
        id: "admin-system",
        email: "admin@bvote.com",
        role: "superadmin",
        name: "Super Administrator",
      };
    } else if (decoded.userId === "user-123") {
      user = {
        id: "user-123",
        email: "user@bvote.com",
        role: "user",
        name: "Test User",
      };
    } else {
      const dbUser = await database.findById("users", decoded.userId);
      if (!dbUser) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      user = {
        id: dbUser.id,
        email: dbUser.email,
        role: dbUser.role,
        name: dbUser.name,
      };
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }
});

// POST /api/auth/change-password
router.post(
  "/change-password",
  [
    body("currentPassword").isLength({ min: 1 }),
    body("newPassword")
      .isLength({ min: 8 })
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
      ),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { currentPassword, newPassword } = req.body;
      const token = req.headers.authorization?.substring(7);

      if (!token) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const decoded = security.verifyToken(token);
      const user = await database.findById("users", decoded.userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Verify current password
      const validPassword = await security.verifyPassword(
        currentPassword,
        user.password_hash
      );
      if (!validPassword) {
        return res.status(401).json({
          success: false,
          message: "Current password is incorrect",
        });
      }

      // Hash new password
      const newPasswordHash = await security.hashPassword(newPassword);

      // Update password
      await database.update("users", user.id, {
        password_hash: newPasswordHash,
      });

      // Log password change
      await database.logAccess(user.id, "password_changed", {
        ip: req.ip,
      });

      res.json({
        success: true,
        message: "Password changed successfully",
      });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
);

export default router;
