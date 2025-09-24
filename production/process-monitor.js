
/**
 * Process Monitor - Prevent 502 Errors
 * Auto-restart failed processes
 */

import { exec } from 'child_process';
import fs from 'fs/promises';

class ProcessMonitor {
  constructor() {
    this.processes = [
      { name: 'Main App', cmd: 'node app.js', logFile: 'logs/app.log' },
      { name: 'Backend', cmd: 'node backend/server.js', logFile: 'logs/backend.log' },
      { name: 'Production', cmd: 'node production/server.js', logFile: 'logs/production.log' }
    ];
  }

  async startMonitoring() {
    console.log('🔍 Starting process monitoring...');
    setInterval(() => this.checkProcesses(), 30000); // Check every 30 seconds
  }

  async checkProcesses() {
    for (const process of this.processes) {
      const isRunning = await this.isProcessRunning(process.cmd);
      
      if (!isRunning) {
        console.log(`⚠️ ${process.name} is down! Restarting...`);
        await this.restartProcess(process);
      }
    }
  }

  async isProcessRunning(cmd) {
    return new Promise((resolve) => {
      exec(`pgrep -f "${cmd}"`, (error, stdout) => {
        resolve(!!stdout.trim());
      });
    });
  }

  async restartProcess(process) {
    try {
      // Kill existing process
      exec(`pkill -f "${process.cmd}"`);
      
      // Wait and restart
      setTimeout(() => {
        exec(`nohup ${process.cmd} > ${process.logFile} 2>&1 &`, (error) => {
          if (error) {
            console.error(`❌ Failed to restart ${process.name}:`, error);
          } else {
            console.log(`✅ ${process.name} restarted successfully`);
          }
        });
      }, 3000);
      
    } catch (error) {
      console.error(`❌ Error restarting ${process.name}:`, error);
    }
  }
}

const monitor = new ProcessMonitor();
monitor.startMonitoring();
