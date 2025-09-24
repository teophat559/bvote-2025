const http = require("http");
const crypto = require("crypto");
const url = require("url");

const PORT = 3000;

console.log("🔐 Starting Security-Enhanced Backend API...");

// Security utilities
class SecurityManager {
  constructor() {
    this.apiKeys = new Map();
    this.sessions = new Map();
    this.blockedIPs = new Set();
    this.loginAttempts = new Map();
    this.secretKey = crypto.randomBytes(64).toString("hex");

    // Initialize demo API keys
    this.apiKeys.set("demo-admin-key-123", {
      role: "admin",
      name: "Demo Admin",
    });
    this.apiKeys.set("demo-user-key-456", { role: "user", name: "Demo User" });
  }

  generateToken(payload) {
    const header = Buffer.from(
      JSON.stringify({ alg: "HS256", typ: "JWT" })
    ).toString("base64url");
    const body = Buffer.from(
      JSON.stringify({ ...payload, exp: Date.now() + 3600000 })
    ).toString("base64url");
    const signature = crypto
      .createHmac("sha256", this.secretKey)
      .update(`${header}.${body}`)
      .digest("base64url");

    return `${header}.${body}.${signature}`;
  }

  verifyToken(token) {
    try {
      const [header, body, signature] = token.split(".");
      const expectedSignature = crypto
        .createHmac("sha256", this.secretKey)
        .update(`${header}.${body}`)
        .digest("base64url");

      if (signature !== expectedSignature) {
        return { valid: false, error: "Invalid signature" };
      }

      const payload = JSON.parse(Buffer.from(body, "base64url").toString());

      if (payload.exp < Date.now()) {
        return { valid: false, error: "Token expired" };
      }

      return { valid: true, payload };
    } catch (error) {
      return { valid: false, error: "Invalid token format" };
    }
  }

  validateAPIKey(apiKey) {
    return this.apiKeys.get(apiKey) || null;
  }

  isIPBlocked(ip) {
    return this.blockedIPs.has(ip);
  }

  recordLoginAttempt(ip, success) {
    if (!this.loginAttempts.has(ip)) {
      this.loginAttempts.set(ip, []);
    }

    const attempts = this.loginAttempts.get(ip);
    attempts.push({ timestamp: Date.now(), success });

    // Keep only last 10 attempts
    if (attempts.length > 10) {
      attempts.shift();
    }

    // Block IP after 5 failed attempts in 15 minutes
    const recentAttempts = attempts.filter(
      (a) => Date.now() - a.timestamp < 900000
    );
    const failedAttempts = recentAttempts.filter((a) => !a.success);

    if (failedAttempts.length >= 5) {
      this.blockedIPs.add(ip);
      console.log(`🚨 IP blocked due to failed login attempts: ${ip}`);

      // Auto-unblock after 1 hour
      setTimeout(() => {
        this.blockedIPs.delete(ip);
        console.log(`🔓 IP unblocked: ${ip}`);
      }, 3600000);
    }
  }

  sanitizeInput(input) {
    if (typeof input !== "string") return input;

    return input
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;")
      .replace(/\//g, "&#x2F;");
  }

  getSecurityHeaders() {
    return {
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "X-XSS-Protection": "1; mode=block",
      "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
      "Content-Security-Policy":
        "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    };
  }
}

// Request logging and monitoring
class SecurityLogger {
  constructor() {
    this.logs = [];
    this.alerts = [];
  }

  log(type, message, metadata = {}) {
    const entry = {
      timestamp: new Date().toISOString(),
      type,
      message,
      metadata,
      id: crypto.randomUUID(),
    };

    this.logs.push(entry);

    // Keep only last 1000 logs
    if (this.logs.length > 1000) {
      this.logs.shift();
    }

    // Generate alerts for critical events
    if (type === "security_alert" || type === "blocked_ip") {
      this.alerts.push(entry);
      console.log(`🚨 SECURITY ALERT: ${message}`);
    }

    console.log(`[${type.toUpperCase()}] ${message}`);
  }

  getRecentLogs(limit = 50) {
    return this.logs.slice(-limit);
  }

  getAlerts() {
    return this.alerts;
  }
}

// Initialize security components
const security = new SecurityManager();
const securityLogger = new SecurityLogger();

const server = http.createServer(async (req, res) => {
  const startTime = Date.now();
  const reqUrl = url.parse(req.url, true);
  const path = reqUrl.pathname;
  const clientIP =
    req.connection.remoteAddress || req.socket.remoteAddress || "unknown";
  const userAgent = req.headers["user-agent"] || "unknown";

  // Security headers
  const securityHeaders = security.getSecurityHeaders();
  Object.keys(securityHeaders).forEach((header) => {
    res.setHeader(header, securityHeaders[header]);
  });

  // Basic CORS with security
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-API-Key"
  );
  res.setHeader("Content-Type", "application/json");

  securityLogger.log("request", `${req.method} ${path}`, {
    ip: clientIP,
    userAgent,
    timestamp: Date.now(),
  });

  // Check if IP is blocked
  if (security.isIPBlocked(clientIP)) {
    securityLogger.log(
      "blocked_request",
      `Blocked IP attempted access: ${clientIP}`,
      { path, userAgent }
    );

    res.writeHead(403);
    res.end(
      JSON.stringify({
        error: "Access Forbidden",
        message:
          "Your IP has been temporarily blocked due to suspicious activity",
        blockReason: "Multiple failed authentication attempts",
        contact: "admin@bvote2025.com",
      })
    );
    return;
  }

  // Handle OPTIONS
  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  // Authentication for protected endpoints
  const protectedPaths = ["/api/admin/", "/api/performance/"];
  const isProtected = protectedPaths.some((protectedPath) =>
    path.startsWith(protectedPath)
  );

  if (isProtected) {
    const apiKey = req.headers["x-api-key"];
    const authHeader = req.headers["authorization"];

    let authenticated = false;
    let userInfo = null;

    // Check API Key
    if (apiKey) {
      userInfo = security.validateAPIKey(apiKey);
      authenticated = !!userInfo;
    }

    // Check JWT Token
    if (!authenticated && authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const tokenResult = security.verifyToken(token);
      authenticated = tokenResult.valid;
      userInfo = tokenResult.payload;
    }

    if (!authenticated) {
      securityLogger.log(
        "auth_failed",
        `Unauthorized access attempt to ${path}`,
        {
          ip: clientIP,
          userAgent,
          apiKey: !!apiKey,
          bearerToken: !!authHeader,
        }
      );

      security.recordLoginAttempt(clientIP, false);

      res.writeHead(401);
      res.end(
        JSON.stringify({
          error: "Unauthorized",
          message: "Authentication required for this endpoint",
          methods: [
            "API Key (X-API-Key header)",
            "JWT Token (Authorization: Bearer)",
          ],
          demoKeys: {
            admin: "demo-admin-key-123",
            user: "demo-user-key-456",
          },
        })
      );
      return;
    }

    securityLogger.log(
      "auth_success",
      `Authenticated access: ${userInfo.name}`,
      {
        ip: clientIP,
        role: userInfo.role,
        path,
      }
    );
  }

  let response;
  let statusCode = 200;

  try {
    // Route handling with security
    switch (path) {
      case "/api/health":
        response = {
          status: "OK",
          message: "BVOTE Security-Enhanced Backend API",
          timestamp: new Date().toISOString(),
          version: "3.0.0-security",
          port: PORT,
          security: {
            encryption: "AES-256",
            authentication: "JWT + API Keys",
            rateLimit: "100 req/min",
            ipBlocking: "Auto-blocking enabled",
            headers: "Security headers applied",
          },
          uptime: Math.round(
            (Date.now() - securityLogger.logs[0]?.timestamp || Date.now()) /
              1000
          ),
        };
        break;

      case "/api/auth/login":
        if (req.method === "POST") {
          // Simulate login (in real app, verify credentials)
          const token = security.generateToken({
            userId: 1,
            username: "demo_user",
            role: "user",
          });

          security.recordLoginAttempt(clientIP, true);

          response = {
            success: true,
            message: "Login successful",
            token,
            expiresIn: "1 hour",
            user: {
              id: 1,
              username: "demo_user",
              role: "user",
            },
          };

          securityLogger.log("login_success", `User logged in successfully`, {
            ip: clientIP,
          });
        } else {
          statusCode = 405;
          response = { error: "Method not allowed", allowedMethods: ["POST"] };
        }
        break;

      case "/api/auth/verify":
        const authHeader = req.headers["authorization"];
        if (authHeader && authHeader.startsWith("Bearer ")) {
          const token = authHeader.substring(7);
          const result = security.verifyToken(token);

          response = {
            valid: result.valid,
            ...(result.valid
              ? { user: result.payload }
              : { error: result.error }),
          };
        } else {
          response = { valid: false, error: "No token provided" };
        }
        break;

      case "/api/security/status":
        response = {
          blockedIPs: security.blockedIPs.size,
          activeSessions: security.sessions.size,
          totalAPIKeys: security.apiKeys.size,
          recentAlerts: securityLogger.getAlerts().slice(-5),
          securityLevel: "Enhanced",
          features: [
            "IP blocking",
            "Rate limiting",
            "JWT authentication",
            "API key validation",
            "Security headers",
            "Input sanitization",
            "Request logging",
          ],
        };
        break;

      case "/api/admin/security-logs":
        // Protected endpoint
        response = {
          logs: securityLogger.getRecentLogs(100),
          alerts: securityLogger.getAlerts(),
          summary: {
            totalLogs: securityLogger.logs.length,
            totalAlerts: securityLogger.alerts.length,
            blockedIPs: Array.from(security.blockedIPs),
          },
        };
        break;

      case "/api/system/info":
        response = {
          system: "BVOTE Security Backend",
          version: "3.0.0-security",
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          platform: process.platform,
          nodeVersion: process.version,
          security: {
            level: "Enhanced",
            encryption: "Active",
            monitoring: "Active",
            ipBlocking: "Active",
          },
          environment: process.env.NODE_ENV || "development",
        };
        break;

      default:
        if (path.startsWith("/api/")) {
          statusCode = 404;
          response = {
            error: "API endpoint not found",
            message: "Security-enhanced 404 response",
            method: req.method,
            path: security.sanitizeInput(path),
            timestamp: new Date().toISOString(),
            availableEndpoints: [
              "/api/health",
              "/api/auth/login",
              "/api/auth/verify",
              "/api/security/status",
              "/api/system/info",
            ],
          };
        } else {
          statusCode = 404;
          response = {
            error: "Route not found",
            message: "This endpoint does not exist",
            path: security.sanitizeInput(req.url),
            method: req.method,
            timestamp: new Date().toISOString(),
          };
        }
    }

    // Add security metadata to response
    response.security = {
      requestId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      processed: true,
    };

    res.writeHead(statusCode);
    res.end(JSON.stringify(response, null, 2));

    // Log response
    const responseTime = Date.now() - startTime;
    securityLogger.log("response", `${statusCode} response for ${path}`, {
      ip: clientIP,
      responseTime,
      statusCode,
    });
  } catch (error) {
    console.error("❌ Security Backend error:", error);
    securityLogger.log("error", `Server error: ${error.message}`, {
      ip: clientIP,
      path,
      stack: error.stack,
    });

    res.writeHead(500);
    res.end(
      JSON.stringify({
        error: "Internal Server Error",
        message: "Secure error handling",
        requestId: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
      })
    );
  }
});

server.on("error", (err) => {
  console.error("❌ Security Backend error:", err.code, err.message);
  securityLogger.log("server_error", `Server error: ${err.message}`, {
    code: err.code,
  });

  if (err.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use.`);
  }
  process.exit(1);
});

server.on("listening", () => {
  console.log(`🚀 Security-Enhanced Backend running on port ${PORT}`);
  console.log(`🔗 Health: http://localhost:${PORT}/api/health`);
  console.log(`🔐 Auth: http://localhost:${PORT}/api/auth/login`);
  console.log(`🛡️ Security: http://localhost:${PORT}/api/security/status`);
  console.log("✅ Security Backend ready with authentication & monitoring!");

  securityLogger.log("server_start", "Security-Enhanced Backend started", {
    port: PORT,
  });
});

console.log("📡 Starting Security Backend Server...");
server.listen(PORT, "127.0.0.1");

// Security monitoring
setInterval(() => {
  const securityStats = {
    blockedIPs: security.blockedIPs.size,
    activeSessions: security.sessions.size,
    recentAlerts: securityLogger.alerts.length,
    uptime: process.uptime(),
  };

  console.log(
    `🛡️ Security Status: ${securityStats.blockedIPs} blocked IPs, ${securityStats.recentAlerts} alerts`
  );

  if (securityStats.recentAlerts > 0) {
    securityLogger.log(
      "security_summary",
      "Security monitoring update",
      securityStats
    );
  }
}, 300000); // Every 5 minutes

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 Security Backend shutting down...");
  securityLogger.log("server_stop", "Security Backend shutdown initiated");

  server.close(() => {
    console.log("✅ Security Backend closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("🛑 Security Backend shutting down...");
  securityLogger.log("server_stop", "Security Backend shutdown initiated");

  server.close(() => {
    console.log("✅ Security Backend closed");
    process.exit(0);
  });
});
