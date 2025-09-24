/**
 * Monitoring Dashboard - Real-time system monitoring
 */

import express from "express";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class MonitoringDashboard {
  constructor(port = 3002) {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = new Server(this.server);
    this.port = port;

    this.setupRoutes();
    this.setupWebSocket();
    this.startMetricsCollection();
  }

  setupRoutes() {
    // Serve dashboard HTML
    this.app.get("/", (req, res) => {
      const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VotingOnline2025 - System Monitor</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f0f2f5;
        }
        .dashboard {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
        }
        .card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .metric {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 0;
            border-bottom: 1px solid #eee;
        }
        .metric:last-child { border-bottom: none; }
        .status {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
        }
        .status.healthy { background: #d4edda; color: #155724; }
        .status.warning { background: #fff3cd; color: #856404; }
        .status.critical { background: #f8d7da; color: #721c24; }
        .log {
            background: #1a1a1a;
            color: #00ff00;
            padding: 15px;
            border-radius: 5px;
            font-family: 'Courier New', monospace;
            height: 200px;
            overflow-y: scroll;
        }
    </style>
</head>
<body>
    <h1>🔄 VotingOnline2025 System Monitor</h1>

    <div class="dashboard">
        <div class="card">
            <h3>📊 Connection Stats</h3>
            <div id="connection-stats">
                <div class="metric">
                    <span>Admin Connections:</span>
                    <span id="admin-count">0</span>
                </div>
                <div class="metric">
                    <span>User Connections:</span>
                    <span id="user-count">0</span>
                </div>
                <div class="metric">
                    <span>Total Connections:</span>
                    <span id="total-count">0</span>
                </div>
                <div class="metric">
                    <span>System Status:</span>
                    <span id="system-status" class="status healthy">Healthy</span>
                </div>
            </div>
        </div>

        <div class="card">
            <h3>🔄 Sync Statistics</h3>
            <div id="sync-stats">
                <div class="metric">
                    <span>Active Commands:</span>
                    <span id="active-commands">0</span>
                </div>
                <div class="metric">
                    <span>Messages/min:</span>
                    <span id="messages-per-min">0</span>
                </div>
                <div class="metric">
                    <span>Sync Errors:</span>
                    <span id="sync-errors">0</span>
                </div>
                <div class="metric">
                    <span>Last Sync:</span>
                    <span id="last-sync">Never</span>
                </div>
            </div>
        </div>

        <div class="card">
            <h3>⚡ Performance Metrics</h3>
            <canvas id="performance-chart" width="400" height="200"></canvas>
        </div>

        <div class="card">
            <h3>📋 System Log</h3>
            <div id="system-log" class="log">
                System monitoring started...
            </div>
        </div>
    </div>

    <script src="/socket.io/socket.io.js"></script>
    <script>
        const socket = io();
        const performanceData = [];
        let chart;

        // Initialize chart
        const ctx = document.getElementById('performance-chart').getContext('2d');
        chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Connections',
                    data: [],
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });

        // Socket event handlers
        socket.on('stats', (data) => {
            updateConnectionStats(data.connections);
            updateSyncStats(data.sync);
            updateChart(data.connections.totalConnections);
            logMessage('📊 Stats updated: ' + data.connections.totalConnections + ' total connections');
        });

        socket.on('alert', (data) => {
            logMessage('🚨 ALERT: ' + data.message, 'error');
            updateSystemStatus(data.level);
        });

        socket.on('sync-event', (data) => {
            logMessage('🔄 Sync: ' + data.type + ' - ' + data.message);
        });

        function updateConnectionStats(stats) {
            document.getElementById('admin-count').textContent = stats.adminConnections;
            document.getElementById('user-count').textContent = stats.userConnections;
            document.getElementById('total-count').textContent = stats.totalConnections;
        }

        function updateSyncStats(stats) {
            document.getElementById('active-commands').textContent = stats.activeCommands;
            document.getElementById('messages-per-min').textContent = stats.messagesPerMin;
            document.getElementById('sync-errors').textContent = stats.syncErrors;
            document.getElementById('last-sync').textContent = new Date(stats.lastSync).toLocaleTimeString();
        }

        function updateSystemStatus(level) {
            const statusEl = document.getElementById('system-status');
            statusEl.className = 'status ' + level;
            statusEl.textContent = level.charAt(0).toUpperCase() + level.slice(1);
        }

        function updateChart(value) {
            const now = new Date().toLocaleTimeString();
            chart.data.labels.push(now);
            chart.data.datasets[0].data.push(value);

            // Keep only last 10 data points
            if (chart.data.labels.length > 10) {
                chart.data.labels.shift();
                chart.data.datasets[0].data.shift();
            }

            chart.update();
        }

        function logMessage(message, type = 'info') {
            const log = document.getElementById('system-log');
            const timestamp = new Date().toLocaleTimeString();
            const logEntry = '[' + timestamp + '] ' + message;

            log.innerHTML += logEntry + '\\n';
            log.scrollTop = log.scrollHeight;

            // Keep only last 100 lines
            const lines = log.innerHTML.split('\\n');
            if (lines.length > 100) {
                log.innerHTML = lines.slice(-100).join('\\n');
            }
        }

        // Request initial stats
        socket.emit('request-stats');

        // Auto-refresh every 5 seconds
        setInterval(() => {
            socket.emit('request-stats');
        }, 5000);
    </script>
</body>
</html>`;

      res.send(htmlContent);
    });

    // API endpoints
    this.app.get("/api/stats", (req, res) => {
      res.json(this.getSystemStats());
    });

    this.app.get("/api/health", (req, res) => {
      res.json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      });
    });
  }

  setupWebSocket() {
    this.io.on("connection", (socket) => {
      console.log("📊 Monitor client connected:", socket.id);

      socket.on("request-stats", () => {
        socket.emit("stats", this.getSystemStats());
      });

      socket.on("disconnect", () => {
        console.log("📊 Monitor client disconnected:", socket.id);
      });
    });
  }

  startMetricsCollection() {
    // Collect metrics every 5 seconds
    setInterval(() => {
      const stats = this.getSystemStats();
      this.io.emit("stats", stats);

      // Check for alerts
      this.checkAlerts(stats);
    }, 5000);
  }

  getSystemStats() {
    return {
      timestamp: new Date().toISOString(),
      connections: {
        adminConnections: 0, // Will be updated by real services
        userConnections: 0,
        totalConnections: 0,
        uptime: process.uptime(),
      },
      sync: {
        activeCommands: 0,
        messagesPerMin: 0,
        syncErrors: 0,
        lastSync: new Date().toISOString(),
      },
      performance: {
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
      },
    };
  }

  checkAlerts(stats) {
    // Alert if no connections for too long
    if (stats.connections.totalConnections === 0) {
      this.sendAlert("No active connections", "warning");
    }

    // Alert on high memory usage
    const memoryUsage = stats.performance.memoryUsage.heapUsed / 1024 / 1024;
    if (memoryUsage > 500) {
      // 500MB
      this.sendAlert(
        `High memory usage: ${memoryUsage.toFixed(2)}MB`,
        "warning"
      );
    }
  }

  sendAlert(message, level) {
    this.io.emit("alert", {
      message,
      level,
      timestamp: new Date().toISOString(),
    });
    console.log(`🚨 ALERT (${level}): ${message}`);
  }

  start() {
    this.server.listen(this.port, () => {
      console.log(`📊 Monitoring dashboard running on port ${this.port}`);
      console.log(`   Dashboard: http://localhost:${this.port}`);
    });
  }
}

export default MonitoringDashboard;
