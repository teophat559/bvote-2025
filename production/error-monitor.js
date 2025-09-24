
/**
 * Error Monitoring System - Real-time Error Tracking
 */

import fs from 'fs/promises';
import { exec } from 'child_process';

class ErrorMonitor {
  constructor() {
    this.errorCounts = {
      404: 0,
      500: 0,
      502: 0,
      301: 0
    };
  }

  async startMonitoring() {
    console.log('📊 Starting error monitoring...');
    
    // Monitor Nginx access logs
    this.monitorNginxLogs();
    
    // Monitor Node.js error logs  
    this.monitorNodeLogs();
    
    // Generate hourly reports
    setInterval(() => this.generateErrorReport(), 3600000); // Every hour
  }

  monitorNginxLogs() {
    exec('tail -f /var/log/nginx/access.log', (error, stdout, stderr) => {
      if (error) return;
      
      stdout.split('\n').forEach(line => {
        if (line.includes(' 404 ')) this.errorCounts[404]++;
        if (line.includes(' 500 ')) this.errorCounts[500]++;
        if (line.includes(' 502 ')) this.errorCounts[502]++;
        if (line.includes(' 301 ')) this.errorCounts[301]++;
        
        // Alert on critical errors
        if (line.includes(' 502 ') || line.includes(' 500 ')) {
          this.sendAlert('Critical Error Detected', line);
        }
      });
    });
  }

  monitorNodeLogs() {
    const logFiles = ['logs/app.log', 'logs/backend.log', 'logs/production.log'];
    
    logFiles.forEach(file => {
      exec(`tail -f ${file}`, (error, stdout) => {
        if (error) return;
        
        stdout.split('\n').forEach(line => {
          if (line.includes('ERROR') || line.includes('ECONNREFUSED')) {
            this.sendAlert('Node.js Error Detected', line);
          }
        });
      });
    });
  }

  async generateErrorReport() {
    const report = {
      timestamp: new Date().toISOString(),
      errors: this.errorCounts,
      status: this.determineOverallStatus()
    };
    
    await fs.appendFile('logs/error-report.json', JSON.stringify(report) + '\n');
    
    // Reset counters
    this.errorCounts = { 404: 0, 500: 0, 502: 0, 301: 0 };
  }

  determineOverallStatus() {
    const total = Object.values(this.errorCounts).reduce((a, b) => a + b, 0);
    if (total === 0) return 'HEALTHY';
    if (total < 10) return 'WARNING'; 
    return 'CRITICAL';
  }

  sendAlert(subject, message) {
    // Log critical alerts
    console.error(`🚨 ALERT: ${subject}\n${message}`);
    
    // Could integrate with Telegram notifications here
    // telegramNotifier.sendAlert(subject, message);
  }
}

const errorMonitor = new ErrorMonitor();
errorMonitor.startMonitoring();
