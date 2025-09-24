/**
 * Database Service - Local Storage Implementation
 * Full-featured database operations with indexing and querying
 */

class DatabaseService {
  constructor() {
    this.prefix = "bvote_admin_";
    this.indexes = new Map();
    this.init();
  }

  init() {
    console.log("💾 Initializing Database Service...");
    this.setupIndexes();
    this.migrateIfNeeded();
    console.log("✅ Database Service ready");
  }

  setupIndexes() {
    // Create indexes for faster querying
    this.indexes.set("login_requests_by_status", new Map());
    this.indexes.set("login_requests_by_platform", new Map());
    this.indexes.set("admin_keys_by_status", new Map());
  }

  migrateIfNeeded() {
    const version = this.getStorageItem("db_version") || "1.0.0";
    const currentVersion = "2.0.0";

    if (version !== currentVersion) {
      console.log(
        `🔄 Migrating database from ${version} to ${currentVersion}...`
      );
      this.runMigrations(version, currentVersion);
      this.setStorageItem("db_version", currentVersion);
      console.log("✅ Database migration completed");
    }
  }

  runMigrations(fromVersion, toVersion) {
    // Add new fields or restructure data if needed
    if (fromVersion === "1.0.0") {
      // Add metadata fields to login requests
      const requests = this.getStorageItem("login_requests") || [];
      requests.forEach((req) => {
        if (!req.metadata) {
          req.metadata = {
            attempts: 0,
            last_attempt: null,
            success_rate: 0,
          };
        }
        if (!req.ip_address) {
          req.ip_address = "192.168.1.100";
        }
        if (!req.user_agent) {
          req.user_agent =
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";
        }
      });
      this.setStorageItem("login_requests", requests);
    }
  }

  // Storage utilities
  getStorageItem(key) {
    try {
      const item = localStorage.getItem(this.prefix + key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error("Error reading from storage:", error);
      return null;
    }
  }

  setStorageItem(key, value) {
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(value));
      this.updateIndexes(key, value);
    } catch (error) {
      console.error("Error writing to storage:", error);
    }
  }

  updateIndexes(table, data) {
    // Update relevant indexes
    if (table === "login_requests" && Array.isArray(data)) {
      const statusIndex = this.indexes.get("login_requests_by_status");
      const platformIndex = this.indexes.get("login_requests_by_platform");

      statusIndex.clear();
      platformIndex.clear();

      data.forEach((request) => {
        // Status index
        if (!statusIndex.has(request.status)) {
          statusIndex.set(request.status, []);
        }
        statusIndex.get(request.status).push(request.id);

        // Platform index
        if (!platformIndex.has(request.platform)) {
          platformIndex.set(request.platform, []);
        }
        platformIndex.get(request.platform).push(request.id);
      });
    }
  }

  // CRUD Operations
  async find(table, filters = {}) {
    return new Promise((resolve) => {
      setTimeout(() => {
        let data = this.getStorageItem(table) || [];

        // Use indexes for common queries
        if (filters.status && table === "login_requests") {
          const statusIndex = this.indexes.get("login_requests_by_status");
          if (statusIndex.has(filters.status)) {
            const ids = statusIndex.get(filters.status);
            data = data.filter((item) => ids.includes(item.id));
          }
        }

        // Apply additional filters
        Object.entries(filters).forEach(([key, value]) => {
          if (key !== "status") {
            // Already handled by index
            data = data.filter((item) => {
              if (typeof value === "string") {
                return item[key]?.toLowerCase().includes(value.toLowerCase());
              }
              return item[key] === value;
            });
          }
        });

        resolve(data);
      }, 150);
    });
  }

  async findById(table, id) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const data = this.getStorageItem(table) || [];
        const item = data.find((item) => item.id === id);
        resolve(item || null);
      }, 100);
    });
  }

  async insert(table, record) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const data = this.getStorageItem(table) || [];
        const newRecord = {
          id: `${table}_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}`,
          ...record,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        data.push(newRecord);
        this.setStorageItem(table, data);

        resolve(newRecord);
      }, 200);
    });
  }

  async update(table, id, updates) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const data = this.getStorageItem(table) || [];
        const index = data.findIndex((item) => item.id === id);

        if (index === -1) {
          reject(new Error(`Record with id ${id} not found`));
          return;
        }

        data[index] = {
          ...data[index],
          ...updates,
          updated_at: new Date().toISOString(),
        };

        this.setStorageItem(table, data);
        resolve(data[index]);
      }, 200);
    });
  }

  async delete(table, id) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const data = this.getStorageItem(table) || [];
        const index = data.findIndex((item) => item.id === id);

        if (index === -1) {
          reject(new Error(`Record with id ${id} not found`));
          return;
        }

        const deleted = data.splice(index, 1)[0];
        this.setStorageItem(table, data);
        resolve(deleted);
      }, 200);
    });
  }

  // Batch operations
  async bulkInsert(table, records) {
    const results = [];
    for (const record of records) {
      const result = await this.insert(table, record);
      results.push(result);
    }
    return results;
  }

  async bulkUpdate(table, updates) {
    const results = [];
    for (const { id, data } of updates) {
      const result = await this.update(table, id, data);
      results.push(result);
    }
    return results;
  }

  // Analytics and reporting
  async getStats(table) {
    const data = this.getStorageItem(table) || [];

    return {
      total: data.length,
      created_today: data.filter((item) => {
        const created = new Date(item.created_at);
        const today = new Date();
        return created.toDateString() === today.toDateString();
      }).length,
      updated_today: data.filter((item) => {
        const updated = new Date(item.updated_at);
        const today = new Date();
        return updated.toDateString() === today.toDateString();
      }).length,
      last_activity:
        data.length > 0
          ? Math.max(...data.map((item) => new Date(item.updated_at).getTime()))
          : null,
    };
  }

  // Data export/import
  exportData(tables = []) {
    const exportData = {
      timestamp: new Date().toISOString(),
      version: this.getStorageItem("db_version"),
      tables: {},
    };

    if (tables.length === 0) {
      // Export all tables
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith(this.prefix)) {
          const tableName = key.replace(this.prefix, "");
          exportData.tables[tableName] = this.getStorageItem(tableName);
        }
      });
    } else {
      // Export specific tables
      tables.forEach((table) => {
        exportData.tables[table] = this.getStorageItem(table);
      });
    }

    return exportData;
  }

  importData(importData) {
    try {
      Object.entries(importData.tables).forEach(([table, data]) => {
        this.setStorageItem(table, data);
      });
      console.log("📥 Data import completed successfully");
      return true;
    } catch (error) {
      console.error("Error importing data:", error);
      return false;
    }
  }

  // Clear all data
  clearAllData() {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith(this.prefix)) {
        localStorage.removeItem(key);
      }
    });
    this.indexes.clear();
    this.setupIndexes();
    console.log("🗑️ All database data cleared");
  }
}

// Export singleton instance
export const databaseService = new DatabaseService();
export default databaseService;
