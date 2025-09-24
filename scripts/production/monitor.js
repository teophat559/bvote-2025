#!/usr/bin/env node

/**
 * Production Monitoring Dashboard
 */

import http from 'http';

const checkHealth = async () => {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/health',
      method: 'GET'
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve({ status: 'ok', data: result });
        } catch (e) {
          resolve({ status: 'error', error: 'Invalid response' });
        }
      });
    });
    
    req.on('error', (error) => {
      resolve({ status: 'error', error: error.message });
    });
    
    req.setTimeout(5000, () => {
      resolve({ status: 'error', error: 'Timeout' });
    });
    
    req.end();
  });
};

const getSystemStats = () => {
  const used = process.memoryUsage();
  return {
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    memory: {
      rss: Math.round(used.rss / 1024 / 1024),
      heapTotal: Math.round(used.heapTotal / 1024 / 1024),
      heapUsed: Math.round(used.heapUsed / 1024 / 1024)
    },
    loadAverage: process.platform !== 'win32' ? require('os').loadavg() : [0, 0, 0]
  };
};

const monitor = async () => {
  console.log('🖥️ Production Monitoring Dashboard');
  console.log('================================');
  
  const health = await checkHealth();
  const stats = getSystemStats();
  
  console.log(`⏰ Timestamp: ${stats.timestamp}`);
  console.log(`🕐 Uptime: ${Math.floor(stats.uptime / 60)}m ${stats.uptime % 60}s`);
  console.log(`🧠 Memory: ${stats.memory.heapUsed}MB / ${stats.memory.heapTotal}MB`);
  console.log(`📊 Health: ${health.status === 'ok' ? '✅ Healthy' : '❌ ' + health.error}`);
  
  if (health.status === 'ok' && health.data) {
    console.log(`🌐 Environment: ${health.data.environment || 'unknown'}`);
    console.log(`📈 Status: ${health.data.status || 'unknown'}`);
  }
  
  console.log('================================');
  
  setTimeout(monitor, 30000); // Check every 30 seconds
};

monitor();
