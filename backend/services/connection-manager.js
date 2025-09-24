
/**
 * Connection Manager - Quản lý kết nối ổn định
 */

class ConnectionManager {
  constructor() {
    this.connections = new Map();
    this.connectionPools = {
      database: null,
      redis: null,
      websocket: null
    };
    
    this.healthChecks = new Map();
    this.reconnectAttempts = new Map();
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    
    this.startHealthMonitoring();
  }

  // Register a connection
  registerConnection(id, connection, options = {}) {
    this.connections.set(id, {
      connection,
      type: options.type || 'generic',
      createdAt: new Date(),
      lastHealthCheck: new Date(),
      isHealthy: true,
      options
    });
    
    console.log(`🔗 Connection registered: ${id} (${options.type})`);
  }

  // Get connection by ID
  getConnection(id) {
    const conn = this.connections.get(id);
    return conn ? conn.connection : null;
  }

  // Remove connection
  removeConnection(id) {
    const conn = this.connections.get(id);
    if (conn) {
      this.connections.delete(id);
      console.log(`🔌 Connection removed: ${id}`);
    }
  }

  // Health check for all connections
  async performHealthChecks() {
    for (const [id, conn] of this.connections) {
      try {
        const isHealthy = await this.checkConnectionHealth(id, conn);
        conn.isHealthy = isHealthy;
        conn.lastHealthCheck = new Date();
        
        if (!isHealthy) {
          console.log(`⚠️ Unhealthy connection detected: ${id}`);
          await this.handleUnhealthyConnection(id, conn);
        }
        
      } catch (error) {
        console.error(`❌ Health check failed for ${id}:`, error.message);
        conn.isHealthy = false;
        await this.handleUnhealthyConnection(id, conn);
      }
    }
  }

  async checkConnectionHealth(id, conn) {
    const { connection, type } = conn;
    
    switch (type) {
      case 'database':
        return await this.checkDatabaseHealth(connection);
      case 'websocket':
        return this.checkWebSocketHealth(connection);
      case 'redis':
        return await this.checkRedisHealth(connection);
      default:
        return true; // Assume healthy for generic connections
    }
  }

  async checkDatabaseHealth(connection) {
    try {
      await connection.ping();
      return true;
    } catch (error) {
      return false;
    }
  }

  checkWebSocketHealth(connection) {
    return connection.readyState === connection.OPEN;
  }

  async checkRedisHealth(connection) {
    try {
      await connection.ping();
      return true;
    } catch (error) {
      return false;
    }
  }

  async handleUnhealthyConnection(id, conn) {
    const attempts = this.reconnectAttempts.get(id) || 0;
    
    if (attempts >= this.maxReconnectAttempts) {
      console.log(`💀 Max reconnect attempts reached for ${id}`);
      this.removeConnection(id);
      return;
    }
    
    this.reconnectAttempts.set(id, attempts + 1);
    
    setTimeout(async () => {
      try {
        await this.reconnectConnection(id, conn);
      } catch (error) {
        console.error(`❌ Reconnection failed for ${id}:`, error.message);
      }
    }, this.reconnectDelay * Math.pow(2, attempts)); // Exponential backoff
  }

  async reconnectConnection(id, conn) {
    console.log(`🔄 Attempting to reconnect: ${id}`);
    
    const { type, options } = conn;
    
    switch (type) {
      case 'database':
        conn.connection = await this.createDatabaseConnection(options);
        break;
      case 'websocket':
        conn.connection = this.createWebSocketConnection(options);
        break;
      case 'redis':
        conn.connection = await this.createRedisConnection(options);
        break;
    }
    
    // Test the new connection
    const isHealthy = await this.checkConnectionHealth(id, conn);
    if (isHealthy) {
      console.log(`✅ Successfully reconnected: ${id}`);
      this.reconnectAttempts.delete(id);
      conn.isHealthy = true;
    } else {
      throw new Error(`Reconnection failed for ${id}`);
    }
  }

  // Connection factory methods
  async createDatabaseConnection(options) {
    const { mysql2 } = await import('mysql2/promise');
    return mysql2.createConnection(options);
  }

  createWebSocketConnection(options) {
    const WebSocket = require('ws');
    return new WebSocket(options.url, options);
  }

  async createRedisConnection(options) {
    const { createClient } = await import('redis');
    const client = createClient(options);
    await client.connect();
    return client;
  }

  // Start health monitoring
  startHealthMonitoring() {
    // Health checks every 30 seconds
    setInterval(() => {
      this.performHealthChecks();
    }, 30000);
    
    // Connection statistics every 5 minutes
    setInterval(() => {
      this.logConnectionStats();
    }, 300000);
  }

  logConnectionStats() {
    const stats = {
      totalConnections: this.connections.size,
      healthyConnections: 0,
      unhealthyConnections: 0,
      byType: {}
    };
    
    for (const [id, conn] of this.connections) {
      if (conn.isHealthy) {
        stats.healthyConnections++;
      } else {
        stats.unhealthyConnections++;
      }
      
      stats.byType[conn.type] = (stats.byType[conn.type] || 0) + 1;
    }
    
    console.log('📊 Connection Stats:', stats);
  }

  // Get all connection statistics
  getConnectionStats() {
    const stats = {
      connections: [],
      summary: {
        total: this.connections.size,
        healthy: 0,
        unhealthy: 0
      }
    };
    
    for (const [id, conn] of this.connections) {
      stats.connections.push({
        id,
        type: conn.type,
        isHealthy: conn.isHealthy,
        createdAt: conn.createdAt,
        lastHealthCheck: conn.lastHealthCheck
      });
      
      if (conn.isHealthy) {
        stats.summary.healthy++;
      } else {
        stats.summary.unhealthy++;
      }
    }
    
    return stats;
  }
}

export default ConnectionManager;
