/**
 * System Monitoring API Routes
 * Handles system health, statistics, and monitoring endpoints
 */

import express from 'express';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// System statistics storage
let systemStats = {
  startTime: new Date(),
  requests: 0,
  errors: 0,
  activeConnections: 0,
  totalVictims: 15,
  onlineVictims: 8,
  activeRequests: 3,
  successRate: 89
};

// Performance metrics storage
let performanceMetrics = [];

// Middleware to track requests
router.use((req, res, next) => {
  systemStats.requests++;
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    performanceMetrics.push({
      timestamp: new Date(),
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      ip: req.ip
    });
    
    // Keep only last 1000 metrics
    if (performanceMetrics.length > 1000) {
      performanceMetrics = performanceMetrics.slice(-1000);
    }
    
    if (res.statusCode >= 400) {
      systemStats.errors++;
    }
  });
  
  next();
});

// Get system statistics
router.get('/stats', (req, res) => {
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();
  
  res.json({
    success: true,
    data: {
      ...systemStats,
      uptime: {
        seconds: uptime,
        formatted: formatUptime(uptime)
      },
      memory: {
        used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        usage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100)
      },
      cpu: {
        usage: Math.random() * 100, // Mock CPU usage
        cores: os.cpus().length,
        model: os.cpus()[0]?.model || 'Unknown'
      },
      network: {
        hostname: os.hostname(),
        platform: os.platform(),
        arch: os.arch()
      }
    },
    timestamp: new Date().toISOString()
  });
});

// Get system health status
router.get('/health', (req, res) => {
  const memoryUsage = process.memoryUsage();
  const uptime = process.uptime();
  
  // Health checks
  const checks = {
    database: {
      status: 'healthy',
      responseTime: Math.floor(Math.random() * 50) + 10,
      lastCheck: new Date()
    },
    network: {
      status: 'healthy',
      latency: Math.floor(Math.random() * 20) + 5,
      lastCheck: new Date()
    },
    security: {
      status: 'healthy',
      threats: 0,
      lastScan: new Date(Date.now() - 60 * 60 * 1000)
    },
    storage: {
      status: 'healthy',
      usage: Math.floor(Math.random() * 30) + 50,
      available: '500GB'
    }
  };
  
  // Determine overall health
  const allHealthy = Object.values(checks).every(check => check.status === 'healthy');
  const overallStatus = allHealthy ? 'healthy' : 'warning';
  
  res.json({
    success: true,
    data: {
      status: overallStatus,
      uptime: formatUptime(uptime),
      memory: {
        usage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100),
        available: Math.round((memoryUsage.heapTotal - memoryUsage.heapUsed) / 1024 / 1024)
      },
      cpu: Math.floor(Math.random() * 100),
      disk: Math.floor(Math.random() * 30) + 50,
      checks
    },
    timestamp: new Date().toISOString()
  });
});

// Get performance metrics
router.get('/performance', (req, res) => {
  const { hours = 1 } = req.query;
  const hoursAgo = new Date(Date.now() - hours * 60 * 60 * 1000);
  
  const recentMetrics = performanceMetrics.filter(
    metric => new Date(metric.timestamp) >= hoursAgo
  );
  
  // Calculate statistics
  const avgResponseTime = recentMetrics.length > 0 
    ? recentMetrics.reduce((sum, m) => sum + m.duration, 0) / recentMetrics.length
    : 0;
    
  const errorRate = recentMetrics.length > 0
    ? (recentMetrics.filter(m => m.statusCode >= 400).length / recentMetrics.length) * 100
    : 0;
    
  const requestsPerMinute = recentMetrics.length / (hours * 60);
  
  res.json({
    success: true,
    data: {
      timeRange: `${hours} hour(s)`,
      totalRequests: recentMetrics.length,
      avgResponseTime: Math.round(avgResponseTime),
      errorRate: Math.round(errorRate * 100) / 100,
      requestsPerMinute: Math.round(requestsPerMinute * 100) / 100,
      statusCodes: getStatusCodeStats(recentMetrics),
      topEndpoints: getTopEndpoints(recentMetrics),
      recentMetrics: recentMetrics.slice(-20) // Last 20 requests
    },
    timestamp: new Date().toISOString()
  });
});

// Get system alerts
router.get('/alerts', (req, res) => {
  const alerts = generateSystemAlerts();
  
  res.json({
    success: true,
    data: alerts,
    total: alerts.length,
    timestamp: new Date().toISOString()
  });
});

// Get resource usage over time
router.get('/resources', (req, res) => {
  const { period = '1h' } = req.query;
  
  // Generate mock time series data
  const dataPoints = generateResourceTimeSeries(period);
  
  res.json({
    success: true,
    data: {
      period,
      dataPoints,
      summary: {
        avgCpu: dataPoints.reduce((sum, p) => sum + p.cpu, 0) / dataPoints.length,
        avgMemory: dataPoints.reduce((sum, p) => sum + p.memory, 0) / dataPoints.length,
        maxCpu: Math.max(...dataPoints.map(p => p.cpu)),
        maxMemory: Math.max(...dataPoints.map(p => p.memory))
      }
    },
    timestamp: new Date().toISOString()
  });
});

// System configuration endpoint
router.get('/config', (req, res) => {
  res.json({
    success: true,
    data: {
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      platform: os.platform(),
      architecture: os.arch(),
      hostname: os.hostname(),
      totalMemory: Math.round(os.totalmem() / 1024 / 1024 / 1024) + 'GB',
      cpuCores: os.cpus().length,
      loadAverage: os.loadavg(),
      networkInterfaces: Object.keys(os.networkInterfaces()),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    },
    timestamp: new Date().toISOString()
  });
});

// System logs endpoint
router.get('/logs', (req, res) => {
  const { level = 'all', limit = 100 } = req.query;
  
  // Mock system logs
  const logs = generateSystemLogs(level, parseInt(limit));
  
  res.json({
    success: true,
    data: logs,
    total: logs.length,
    filters: { level, limit },
    timestamp: new Date().toISOString()
  });
});

// Helper functions
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}

function getStatusCodeStats(metrics) {
  const stats = {};
  metrics.forEach(metric => {
    const code = metric.statusCode;
    stats[code] = (stats[code] || 0) + 1;
  });
  return stats;
}

function getTopEndpoints(metrics) {
  const endpoints = {};
  metrics.forEach(metric => {
    const endpoint = `${metric.method} ${metric.path}`;
    endpoints[endpoint] = (endpoints[endpoint] || 0) + 1;
  });
  
  return Object.entries(endpoints)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([endpoint, count]) => ({ endpoint, count }));
}

function generateSystemAlerts() {
  const alerts = [];
  const now = new Date();
  
  // Mock alerts based on system conditions
  if (Math.random() > 0.8) {
    alerts.push({
      id: uuidv4(),
      level: 'warning',
      title: 'High Memory Usage',
      message: 'Memory usage is above 80%',
      timestamp: new Date(now.getTime() - Math.random() * 60 * 60 * 1000),
      resolved: false
    });
  }
  
  if (Math.random() > 0.9) {
    alerts.push({
      id: uuidv4(),
      level: 'error',
      title: 'Database Connection Issue',
      message: 'Temporary database connection timeout',
      timestamp: new Date(now.getTime() - Math.random() * 30 * 60 * 1000),
      resolved: true
    });
  }
  
  if (Math.random() > 0.85) {
    alerts.push({
      id: uuidv4(),
      level: 'info',
      title: 'System Update Available',
      message: 'New security updates are available',
      timestamp: new Date(now.getTime() - Math.random() * 120 * 60 * 1000),
      resolved: false
    });
  }
  
  return alerts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

function generateResourceTimeSeries(period) {
  const points = [];
  const now = new Date();
  let intervals, stepMs;
  
  switch (period) {
    case '1h':
      intervals = 60;
      stepMs = 60 * 1000;
      break;
    case '6h':
      intervals = 72;
      stepMs = 5 * 60 * 1000;
      break;
    case '24h':
      intervals = 96;
      stepMs = 15 * 60 * 1000;
      break;
    default:
      intervals = 60;
      stepMs = 60 * 1000;
  }
  
  for (let i = intervals; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * stepMs);
    points.push({
      timestamp,
      cpu: Math.random() * 100,
      memory: Math.random() * 100,
      disk: Math.random() * 100,
      network: Math.random() * 1000
    });
  }
  
  return points;
}

function generateSystemLogs(level, limit) {
  const levels = level === 'all' ? ['info', 'warn', 'error', 'debug'] : [level];
  const logs = [];
  
  const messages = {
    info: [
      'System startup completed',
      'User authentication successful',
      'Database connection established',
      'API request processed',
      'Background task completed'
    ],
    warn: [
      'High memory usage detected',
      'Slow database query',
      'Rate limit approaching',
      'Deprecated API usage',
      'Configuration mismatch'
    ],
    error: [
      'Database connection failed',
      'Authentication error',
      'File system error',
      'Network timeout',
      'Validation failed'
    ],
    debug: [
      'Processing request data',
      'Cache miss occurred',
      'Function execution trace',
      'Variable state change',
      'Performance checkpoint'
    ]
  };
  
  for (let i = 0; i < limit; i++) {
    const logLevel = levels[Math.floor(Math.random() * levels.length)];
    const messageList = messages[logLevel];
    const message = messageList[Math.floor(Math.random() * messageList.length)];
    
    logs.push({
      id: uuidv4(),
      timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
      level: logLevel,
      message,
      source: 'system',
      details: {
        pid: process.pid,
        memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        uptime: Math.round(process.uptime())
      }
    });
  }
  
  return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

export default router;
