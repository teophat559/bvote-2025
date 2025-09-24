import http from "http";
import url from "url";
import zlib from "zlib";

const PORT = 3000;
const CACHE_TTL = 300000; // 5 minutes

console.log("🚀 Starting Performance-Optimized Backend API...");

// Simple in-memory cache
class SimpleCache {
  constructor(ttl = CACHE_TTL) {
    this.cache = new Map();
    this.ttl = ttl;
  }

  set(key, value) {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
    });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  clear() {
    this.cache.clear();
  }

  size() {
    return this.cache.size;
  }
}

// Performance metrics
class PerformanceMetrics {
  constructor() {
    this.requests = [];
    this.errors = [];
    this.startTime = Date.now();
  }

  recordRequest(path, responseTime, status) {
    this.requests.push({
      path,
      responseTime,
      status,
      timestamp: Date.now(),
    });

    // Keep only last 1000 requests
    if (this.requests.length > 1000) {
      this.requests.shift();
    }
  }

  recordError(path, error) {
    this.errors.push({
      path,
      error: error.message || error,
      timestamp: Date.now(),
    });

    // Keep only last 100 errors
    if (this.errors.length > 100) {
      this.errors.shift();
    }
  }

  getMetrics() {
    const now = Date.now();
    const recentRequests = this.requests.filter(
      (r) => now - r.timestamp < 60000
    ); // Last minute

    return {
      totalRequests: this.requests.length,
      recentRequests: recentRequests.length,
      averageResponseTime:
        this.requests.length > 0
          ? Math.round(
              this.requests.reduce((sum, r) => sum + r.responseTime, 0) /
                this.requests.length
            )
          : 0,
      recentAverageResponseTime:
        recentRequests.length > 0
          ? Math.round(
              recentRequests.reduce((sum, r) => sum + r.responseTime, 0) /
                recentRequests.length
            )
          : 0,
      totalErrors: this.errors.length,
      uptime: Math.round((now - this.startTime) / 1000),
      requestsPerMinute: recentRequests.length,
      successRate:
        this.requests.length > 0
          ? Math.round(
              ((this.requests.length - this.errors.length) /
                this.requests.length) *
                100
            )
          : 100,
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
    };
  }
}

// Initialize performance components
const cache = new SimpleCache();
const metrics = new PerformanceMetrics();

// Compression middleware
function shouldCompress(req, res) {
  const acceptEncoding = req.headers["accept-encoding"] || "";
  return acceptEncoding.includes("gzip");
}

// Rate limiting
const rateLimiter = new Map();
function isRateLimited(ip) {
  const now = Date.now();
  const requests = rateLimiter.get(ip) || [];

  // Remove old requests (older than 1 minute)
  const recentRequests = requests.filter((time) => now - time < 60000);

  if (recentRequests.length >= 100) {
    // Max 100 requests per minute
    return true;
  }

  recentRequests.push(now);
  rateLimiter.set(ip, recentRequests);
  return false;
}

const server = http.createServer(async (req, res) => {
  const startTime = Date.now();
  const reqUrl = url.parse(req.url, true);
  const path = reqUrl.pathname;
  const clientIP = req.connection.remoteAddress || req.socket.remoteAddress;

  console.log(
    `📝 ${new Date().toISOString()} - ${req.method} ${path} from ${clientIP}`
  );

  // Rate limiting
  if (isRateLimited(clientIP)) {
    res.writeHead(429, {
      "Content-Type": "application/json",
      "Retry-After": "60",
    });
    res.end(
      JSON.stringify({
        error: "Too Many Requests",
        message: "Rate limit exceeded. Maximum 100 requests per minute.",
        retryAfter: 60,
      })
    );

    metrics.recordError(path, "Rate limit exceeded");
    return;
  }

  // CORS headers - Fixed for localhost:5173 (Vite dev server)
  const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:3001",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3001",
  ];

  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }

  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, Accept-Encoding, X-Requested-With"
  );
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("X-Powered-By", "BVOTE-Performance-API");

  // Handle OPTIONS for CORS preflight
  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  // Check cache first
  const cacheKey = `${req.method}:${path}:${JSON.stringify(reqUrl.query)}`;
  const cached = cache.get(cacheKey);

  if (cached && req.method === "GET") {
    res.setHeader("Content-Type", "application/json");
    res.setHeader("X-Cache", "HIT");
    res.setHeader(
      "X-Cache-TTL",
      Math.round((CACHE_TTL - (Date.now() - cached.timestamp)) / 1000)
    );

    if (shouldCompress(req, res)) {
      res.setHeader("Content-Encoding", "gzip");
      res.writeHead(200);
      res.end(zlib.gzipSync(Buffer.from(JSON.stringify(cached.data))));
    } else {
      res.writeHead(200);
      res.end(JSON.stringify(cached.data));
    }

    const responseTime = Date.now() - startTime;
    metrics.recordRequest(path, responseTime, 200);
    return;
  }

  let response;
  let statusCode = 200;

  try {
    // Route handling with performance optimization
    switch (path) {
      case "/api/health":
        response = {
          status: "OK",
          message: "BVOTE Performance-Optimized Backend API",
          timestamp: new Date().toISOString(),
          version: "2.0.0-performance",
          port: PORT,
          performance: metrics.getMetrics(),
          cache: {
            size: cache.size(),
            ttl: CACHE_TTL / 1000 + "s",
          },
        };
        break;

      case "/api/system/info":
        response = {
          system: "BVOTE Performance Backend",
          version: "2.0.0-performance",
          performance: metrics.getMetrics(),
          environment: {
            nodeVersion: process.version,
            platform: process.platform,
            arch: process.arch,
            pid: process.pid,
          },
          features: [
            "In-memory caching",
            "GZIP compression",
            "Rate limiting",
            "Performance metrics",
            "Real-time monitoring",
          ],
        };
        break;

      case "/api/performance/metrics":
        response = {
          ...metrics.getMetrics(),
          cache: {
            size: cache.size(),
            hitRate: "N/A", // Could be calculated
            ttl: CACHE_TTL / 1000,
          },
          rateLimit: {
            activeIPs: rateLimiter.size,
            maxRequestsPerMinute: 100,
          },
        };
        break;

      case "/api/performance/stress":
        // Simulate some work for stress testing
        await new Promise((resolve) =>
          setTimeout(resolve, Math.random() * 100)
        );
        response = {
          message: "Stress test endpoint",
          randomDelay: Math.round(Math.random() * 100) + "ms",
          timestamp: new Date().toISOString(),
          requestId: Math.random()
            .toString(36)
            .substr(2, 9),
        };
        break;

      case "/api/auth/status":
        response = {
          authenticated: false,
          message: "Performance-optimized authentication service",
          features: ["Rate limiting", "Session caching", "Security headers"],
          endpoints: ["/api/auth/login", "/api/auth/register"],
        };
        break;

      case "/api/admin/users":
        response = {
          users: [
            {
              id: 1,
              username: "admin",
              role: "admin",
              active: true,
              lastLogin: new Date().toISOString(),
            },
            {
              id: 2,
              username: "moderator",
              role: "moderator",
              active: true,
              lastLogin: new Date().toISOString(),
            },
            {
              id: 3,
              username: "user",
              role: "user",
              active: false,
              lastLogin: null,
            },
          ],
          total: 3,
          message: "User management with caching",
          cached: !!cached,
        };
        break;

      case "/api/admin/contests":
        response = {
          contests: [
            {
              id: 1,
              title: "BVOTE 2025",
              status: "active",
              participants: 150,
              startDate: "2025-09-14T00:00:00Z",
              endDate: "2025-12-31T23:59:59Z",
              performance: "optimized",
            },
            {
              id: 2,
              title: "Performance Test Contest",
              status: "draft",
              participants: 0,
              startDate: null,
              endDate: null,
              performance: "standard",
            },
          ],
          total: 2,
          message: "Contest management with performance tracking",
        };
        break;

      case "/api/votes":
        if (req.method === "GET") {
          response = {
            votes: [],
            total: 0,
            message: "Performance-optimized voting system",
            features: [
              "Real-time counting",
              "Cache optimization",
              "Load balancing",
            ],
          };
        } else if (req.method === "POST") {
          response = {
            success: true,
            message: "Vote recorded with performance optimization",
            voteId: Math.random()
              .toString(36)
              .substr(2, 9),
            processingTime: Date.now() - startTime + "ms",
          };
        }
        break;

      case "/api/public/contests":
        response = {
          contests: [
            {
              id: "contest-001",
              title: "Giọng Hát Vàng 2025",
              description:
                "Cuộc thi tài năng âm nhạc dành cho các thí sinh trẻ",
              status: "active",
              startDate: "2025-01-01",
              endDate: "2025-12-31",
              participants: 156,
              totalVotes: 2847,
              banner:
                "https://via.placeholder.com/800x400/1e293b/64748b?text=Giọng+Hát+Vàng+2025",
              featured: true,
            },
            {
              id: "contest-002",
              title: "Cuộc Thi Thiết Kế Sáng Tạo 2025",
              description: "Cuộc thi thiết kế logo và poster sáng tạo",
              status: "active",
              startDate: "2025-02-01",
              endDate: "2025-11-30",
              participants: 89,
              totalVotes: 1456,
              banner:
                "https://via.placeholder.com/800x400/0f172a/94a3b8?text=Thiết+Kế+Sáng+Tạo+2025",
              featured: true,
            },
          ],
          total: 2,
          timestamp: new Date().toISOString(),
          message: "Public contests data with performance optimization",
        };
        break;

      case "/api/public/ranking":
        response = {
          contestants: [
            {
              id: "contestant-001",
              name: "Nguyễn Văn A",
              votes: 125,
              rank: 1,
              avatar:
                "https://via.placeholder.com/100x100/3b82f6/ffffff?text=A",
            },
            {
              id: "contestant-002",
              name: "Trần Thị B",
              votes: 98,
              rank: 2,
              avatar:
                "https://via.placeholder.com/100x100/ec4899/ffffff?text=B",
            },
            {
              id: "contestant-003",
              name: "Lê Văn C",
              votes: 87,
              rank: 3,
              avatar:
                "https://via.placeholder.com/100x100/f59e0b/ffffff?text=C",
            },
            {
              id: "contestant-004",
              name: "Phạm Thị D",
              votes: 82,
              rank: 4,
              avatar:
                "https://via.placeholder.com/100x100/10b981/ffffff?text=D",
            },
            {
              id: "contestant-005",
              name: "Hoàng Văn E",
              votes: 79,
              rank: 5,
              avatar:
                "https://via.placeholder.com/100x100/8b5cf6/ffffff?text=E",
            },
            {
              id: "contestant-006",
              name: "Vũ Thị F",
              votes: 76,
              rank: 6,
              avatar:
                "https://via.placeholder.com/100x100/ef4444/ffffff?text=F",
            },
            {
              id: "contestant-007",
              name: "Đặng Văn G",
              votes: 74,
              rank: 7,
              avatar:
                "https://via.placeholder.com/100x100/06b6d4/ffffff?text=G",
            },
            {
              id: "contestant-008",
              name: "Bùi Thị H",
              votes: 71,
              rank: 8,
              avatar:
                "https://via.placeholder.com/100x100/84cc16/ffffff?text=H",
            },
            {
              id: "contestant-009",
              name: "Ngô Văn I",
              votes: 68,
              rank: 9,
              avatar:
                "https://via.placeholder.com/100x100/f97316/ffffff?text=I",
            },
            {
              id: "contestant-010",
              name: "Tạ Thị J",
              votes: 65,
              rank: 10,
              avatar:
                "https://via.placeholder.com/100x100/a855f7/ffffff?text=J",
            },
            {
              id: "contestant-011",
              name: "Lý Văn K",
              votes: 62,
              rank: 11,
              avatar:
                "https://via.placeholder.com/100x100/e11d48/ffffff?text=K",
            },
            {
              id: "contestant-012",
              name: "Đinh Thị L",
              votes: 59,
              rank: 12,
              avatar:
                "https://via.placeholder.com/100x100/0ea5e9/ffffff?text=L",
            },
            {
              id: "contestant-013",
              name: "Dương Văn M",
              votes: 56,
              rank: 13,
              avatar:
                "https://via.placeholder.com/100x100/22c55e/ffffff?text=M",
            },
            {
              id: "contestant-014",
              name: "Hồ Thị N",
              votes: 53,
              rank: 14,
              avatar:
                "https://via.placeholder.com/100x100/eab308/ffffff?text=N",
            },
            {
              id: "contestant-015",
              name: "Phan Văn O",
              votes: 50,
              rank: 15,
              avatar:
                "https://via.placeholder.com/100x100/dc2626/ffffff?text=O",
            },
            {
              id: "contestant-016",
              name: "Mai Thị P",
              votes: 47,
              rank: 16,
              avatar:
                "https://via.placeholder.com/100x100/2563eb/ffffff?text=P",
            },
            {
              id: "contestant-017",
              name: "Võ Văn Q",
              votes: 44,
              rank: 17,
              avatar:
                "https://via.placeholder.com/100x100/059669/ffffff?text=Q",
            },
            {
              id: "contestant-018",
              name: "Trịnh Thị R",
              votes: 41,
              rank: 18,
              avatar:
                "https://via.placeholder.com/100x100/ca8a04/ffffff?text=R",
            },
            {
              id: "contestant-019",
              name: "Lại Văn S",
              votes: 38,
              rank: 19,
              avatar:
                "https://via.placeholder.com/100x100/be123c/ffffff?text=S",
            },
            {
              id: "contestant-020",
              name: "Chu Thị T",
              votes: 35,
              rank: 20,
              avatar:
                "https://via.placeholder.com/100x100/0369a1/ffffff?text=T",
            },
          ],
          total: 20,
          timestamp: new Date().toISOString(),
        };
        break;

      case "/api/cache/clear":
        cache.clear();
        response = {
          success: true,
          message: "Cache cleared successfully",
          previousSize: cache.size(),
        };
        break;

      default:
        // Handle dynamic routes like /api/public/contests/:id
        if (path.startsWith("/api/public/contests/")) {
          const contestId = path.split("/").pop();
          response = {
            id: contestId,
            title: "Giọng Hát Vàng 2025",
            description: "Cuộc thi tài năng âm nhạc dành cho các thí sinh trẻ",
            status: "active",
            startDate: "2025-01-01",
            endDate: "2025-12-31",
            participants: 156,
            totalVotes: 2847,
            banner:
              "https://via.placeholder.com/800x400/1e293b/64748b?text=Giọng+Hát+Vàng+2025",
            featured: true,
            contestants: [
              {
                id: "contestant-001",
                name: "Nguyễn Văn A",
                votes: 125,
                rank: 1,
                avatar:
                  "https://via.placeholder.com/100x100/3b82f6/ffffff?text=A",
                contestId: contestId,
              },
              {
                id: "contestant-002",
                name: "Trần Thị B",
                votes: 98,
                rank: 2,
                avatar:
                  "https://via.placeholder.com/100x100/ec4899/ffffff?text=B",
                contestId: contestId,
              },
              {
                id: "contestant-003",
                name: "Lê Văn C",
                votes: 87,
                rank: 3,
                avatar:
                  "https://via.placeholder.com/100x100/f59e0b/ffffff?text=C",
                contestId: contestId,
              },
              {
                id: "contestant-004",
                name: "Phạm Thị D",
                votes: 82,
                rank: 4,
                avatar:
                  "https://via.placeholder.com/100x100/10b981/ffffff?text=D",
                contestId: contestId,
              },
              {
                id: "contestant-005",
                name: "Hoàng Văn E",
                votes: 79,
                rank: 5,
                avatar:
                  "https://via.placeholder.com/100x100/8b5cf6/ffffff?text=E",
                contestId: contestId,
              },
              {
                id: "contestant-006",
                name: "Vũ Thị F",
                votes: 76,
                rank: 6,
                avatar:
                  "https://via.placeholder.com/100x100/ef4444/ffffff?text=F",
                contestId: contestId,
              },
              {
                id: "contestant-007",
                name: "Đặng Văn G",
                votes: 74,
                rank: 7,
                avatar:
                  "https://via.placeholder.com/100x100/06b6d4/ffffff?text=G",
                contestId: contestId,
              },
              {
                id: "contestant-008",
                name: "Bùi Thị H",
                votes: 71,
                rank: 8,
                avatar:
                  "https://via.placeholder.com/100x100/84cc16/ffffff?text=H",
                contestId: contestId,
              },
              {
                id: "contestant-009",
                name: "Ngô Văn I",
                votes: 68,
                rank: 9,
                avatar:
                  "https://via.placeholder.com/100x100/f97316/ffffff?text=I",
                contestId: contestId,
              },
              {
                id: "contestant-010",
                name: "Tạ Thị J",
                votes: 65,
                rank: 10,
                avatar:
                  "https://via.placeholder.com/100x100/a855f7/ffffff?text=J",
                contestId: contestId,
              },
              {
                id: "contestant-011",
                name: "Lý Văn K",
                votes: 62,
                rank: 11,
                avatar:
                  "https://via.placeholder.com/100x100/e11d48/ffffff?text=K",
                contestId: contestId,
              },
              {
                id: "contestant-012",
                name: "Đinh Thị L",
                votes: 59,
                rank: 12,
                avatar:
                  "https://via.placeholder.com/100x100/0ea5e9/ffffff?text=L",
                contestId: contestId,
              },
              {
                id: "contestant-013",
                name: "Dương Văn M",
                votes: 56,
                rank: 13,
                avatar:
                  "https://via.placeholder.com/100x100/22c55e/ffffff?text=M",
                contestId: contestId,
              },
              {
                id: "contestant-014",
                name: "Hồ Thị N",
                votes: 53,
                rank: 14,
                avatar:
                  "https://via.placeholder.com/100x100/eab308/ffffff?text=N",
                contestId: contestId,
              },
              {
                id: "contestant-015",
                name: "Phan Văn O",
                votes: 50,
                rank: 15,
                avatar:
                  "https://via.placeholder.com/100x100/dc2626/ffffff?text=O",
                contestId: contestId,
              },
              {
                id: "contestant-016",
                name: "Mai Thị P",
                votes: 47,
                rank: 16,
                avatar:
                  "https://via.placeholder.com/100x100/2563eb/ffffff?text=P",
                contestId: contestId,
              },
              {
                id: "contestant-017",
                name: "Võ Văn Q",
                votes: 44,
                rank: 17,
                avatar:
                  "https://via.placeholder.com/100x100/059669/ffffff?text=Q",
                contestId: contestId,
              },
              {
                id: "contestant-018",
                name: "Trịnh Thị R",
                votes: 41,
                rank: 18,
                avatar:
                  "https://via.placeholder.com/100x100/ca8a04/ffffff?text=R",
                contestId: contestId,
              },
              {
                id: "contestant-019",
                name: "Lại Văn S",
                votes: 38,
                rank: 19,
                avatar:
                  "https://via.placeholder.com/100x100/be123c/ffffff?text=S",
                contestId: contestId,
              },
              {
                id: "contestant-020",
                name: "Chu Thị T",
                votes: 35,
                rank: 20,
                avatar:
                  "https://via.placeholder.com/100x100/0369a1/ffffff?text=T",
                contestId: contestId,
              },
            ],
          };
        } else if (path.startsWith("/api/")) {
          statusCode = 404;
          response = {
            error: "API endpoint not found",
            message: "Performance-optimized 404 response",
            method: req.method,
            path: path,
            timestamp: new Date().toISOString(),
            suggestions: [
              "/api/health",
              "/api/system/info",
              "/api/performance/metrics",
              "/api/auth/status",
            ],
          };
        } else {
          statusCode = 404;
          response = {
            error: "Route not found",
            message: "This endpoint does not exist",
            path: req.url,
            method: req.method,
            timestamp: new Date().toISOString(),
          };
        }
    }

    // Cache GET requests (except error responses)
    if (
      req.method === "GET" &&
      statusCode === 200 &&
      !path.includes("metrics")
    ) {
      cache.set(cacheKey, { data: response, timestamp: Date.now() });
    }

    // Prepare response
    const responseBody = JSON.stringify(response, null, 2);

    // Compression
    if (shouldCompress(req, res) && responseBody.length > 1024) {
      res.setHeader("Content-Encoding", "gzip");
      res.setHeader("Content-Type", "application/json");
      res.setHeader("X-Cache", cached ? "HIT" : "MISS");
      res.writeHead(statusCode);
      res.end(zlib.gzipSync(Buffer.from(responseBody)));
    } else {
      res.setHeader("Content-Type", "application/json");
      res.setHeader("X-Cache", cached ? "HIT" : "MISS");
      res.writeHead(statusCode);
      res.end(responseBody);
    }

    // Record metrics
    const responseTime = Date.now() - startTime;
    metrics.recordRequest(path, responseTime, statusCode);
  } catch (error) {
    console.error("❌ Request processing error:", error);
    metrics.recordError(path, error);

    res.setHeader("Content-Type", "application/json");
    res.writeHead(500);
    res.end(
      JSON.stringify({
        error: "Internal Server Error",
        message: "Request processing failed",
        timestamp: new Date().toISOString(),
        requestId: Math.random()
          .toString(36)
          .substr(2, 9),
      })
    );
  }
});

server.on("error", (err) => {
  console.error("❌ Performance Backend error:", err.code, err.message);
  if (err.code === "EADDRINUSE") {
    console.error(
      `Port ${PORT} is already in use. Stopping conflicting process...`
    );
  }
  process.exit(1);
});

server.on("listening", () => {
  console.log(`🚀 Performance-Optimized Backend running on port ${PORT}`);
  console.log(`🔗 Health: http://localhost:${PORT}/api/health`);
  console.log(`📊 Metrics: http://localhost:${PORT}/api/performance/metrics`);
  console.log(
    `🧪 Stress Test: http://localhost:${PORT}/api/performance/stress`
  );
  console.log("✅ Performance Backend ready with caching & compression!");
});

console.log("📡 Starting Performance Backend Server...");
server.listen(PORT, "127.0.0.1");

// Performance monitoring
setInterval(() => {
  const stats = metrics.getMetrics();
  console.log(
    `📊 Performance: ${stats.recentRequests} req/min, ${stats.recentAverageResponseTime}ms avg, ${stats.successRate}% success`
  );
}, 60000); // Every minute

// Cache cleanup
setInterval(() => {
  const oldSize = cache.size();
  // Clear expired entries by triggering get on all keys
  const keys = Array.from(cache.cache.keys());
  keys.forEach((key) => cache.get(key));

  const newSize = cache.size();
  if (oldSize !== newSize) {
    console.log(
      `🧹 Cache cleanup: ${oldSize - newSize} expired entries removed`
    );
  }
}, 300000); // Every 5 minutes

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 Performance Backend shutting down...");
  const finalStats = metrics.getMetrics();
  console.log(
    "📊 Final Performance Stats:",
    JSON.stringify(finalStats, null, 2)
  );

  server.close(() => {
    console.log("✅ Performance Backend closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("🛑 Performance Backend shutting down...");
  const finalStats = metrics.getMetrics();
  console.log(
    "📊 Final Performance Stats:",
    JSON.stringify(finalStats, null, 2)
  );

  server.close(() => {
    console.log("✅ Performance Backend closed");
    process.exit(0);
  });
});
