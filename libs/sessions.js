import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { EventEmitter } from "events";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Advanced Session Management System
class SessionManager extends EventEmitter {
  constructor(options = {}) {
    super();

    this.config = {
      enableEncryption: options.enableEncryption !== false,
      enablePersistence: options.enablePersistence !== false,
      enableRotation: options.enableRotation !== false,
      sessionTimeout: options.sessionTimeout || 24 * 60 * 60 * 1000, // 24 hours
      rotationInterval: options.rotationInterval || 6 * 60 * 60 * 1000, // 6 hours
      maxSessions: options.maxSessions || 1000,
      backupInterval: options.backupInterval || 60 * 60 * 1000, // 1 hour
      dataDir: options.dataDir || "./session-data",
      encryptionKey:
        options.encryptionKey || "default-encryption-key-change-in-production",
      enableAnalytics: options.enableAnalytics !== false,
      enableRemoteSync: options.enableRemoteSync || false,
    };

    this.sessions = new Map();
    this.userSessions = new Map(); // userId -> sessionIds[]
    this.platformSessions = new Map(); // platform -> sessionIds[]
    this.encryptedStorage = new Map();

    this.analytics = {
      totalSessions: 0,
      activeSessions: 0,
      expiredSessions: 0,
      rotatedSessions: 0,
      lastCleanup: null,
      sessionsByPlatform: new Map(),
    };

    this.isRunning = false;
  }

  // Initialize session manager
  async initialize() {
    try {
      await this.ensureDirectories();

      if (this.config.enablePersistence) {
        await this.loadSessions();
      }

      this.startMaintenanceCycle();

      await this.log("Session Manager initialized");
      return true;
    } catch (error) {
      await this.log(`Failed to initialize: ${error.message}`, "error");
      return false;
    }
  }

  // Create new session
  async createSession(data) {
    try {
      const session = {
        id: this.generateSessionId(),
        userId: data.userId,
        platform: data.platform,
        userAgent: data.userAgent,
        ipAddress: data.ipAddress,
        credentials: data.credentials,
        cookies: data.cookies || [],
        tokens: data.tokens || {},
        metadata: data.metadata || {},
        createdAt: Date.now(),
        lastAccessedAt: Date.now(),
        expiresAt: Date.now() + this.config.sessionTimeout,
        status: "active",
        accessCount: 0,
        rotationCount: 0,
        fingerprint: this.generateFingerprint(data),
      };

      // Encrypt sensitive data if enabled
      if (this.config.enableEncryption) {
        session.encryptedData = await this.encryptSensitiveData({
          credentials: session.credentials,
          cookies: session.cookies,
          tokens: session.tokens,
        });

        // Remove unencrypted sensitive data
        delete session.credentials;
        delete session.cookies;
        delete session.tokens;
      }

      // Store session
      this.sessions.set(session.id, session);

      // Update user sessions mapping
      if (!this.userSessions.has(session.userId)) {
        this.userSessions.set(session.userId, []);
      }
      this.userSessions.get(session.userId).push(session.id);

      // Update platform sessions mapping
      if (!this.platformSessions.has(session.platform)) {
        this.platformSessions.set(session.platform, []);
      }
      this.platformSessions.get(session.platform).push(session.id);

      // Update analytics
      this.analytics.totalSessions++;
      this.analytics.activeSessions++;

      if (!this.analytics.sessionsByPlatform.has(session.platform)) {
        this.analytics.sessionsByPlatform.set(session.platform, 0);
      }
      this.analytics.sessionsByPlatform.set(
        session.platform,
        this.analytics.sessionsByPlatform.get(session.platform) + 1
      );

      // Persist if enabled
      if (this.config.enablePersistence) {
        await this.persistSession(session);
      }

      this.emit("sessionCreated", session);
      await this.log(
        `Session created: ${session.id} for user: ${session.userId} on ${session.platform}`
      );

      return session;
    } catch (error) {
      await this.log(`Failed to create session: ${error.message}`, "error");
      throw error;
    }
  }

  // Get session by ID
  async getSession(sessionId) {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        return null;
      }

      // Check if session is expired
      if (session.expiresAt < Date.now()) {
        await this.expireSession(sessionId);
        return null;
      }

      // Update last accessed time
      session.lastAccessedAt = Date.now();
      session.accessCount++;

      // Decrypt sensitive data if needed
      if (this.config.enableEncryption && session.encryptedData) {
        const decryptedData = await this.decryptSensitiveData(
          session.encryptedData
        );
        return {
          ...session,
          ...decryptedData,
        };
      }

      return session;
    } catch (error) {
      await this.log(
        `Failed to get session ${sessionId}: ${error.message}`,
        "error"
      );
      return null;
    }
  }

  // Update session
  async updateSession(sessionId, updates) {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        throw new Error(`Session not found: ${sessionId}`);
      }

      // Check if session is expired
      if (session.expiresAt < Date.now()) {
        await this.expireSession(sessionId);
        throw new Error(`Session expired: ${sessionId}`);
      }

      // Update fields
      const updatedSession = {
        ...session,
        ...updates,
        lastAccessedAt: Date.now(),
      };

      // Re-encrypt sensitive data if needed
      if (
        this.config.enableEncryption &&
        (updates.credentials || updates.cookies || updates.tokens)
      ) {
        const sensitiveData = {
          credentials: updates.credentials || session.credentials,
          cookies: updates.cookies || session.cookies,
          tokens: updates.tokens || session.tokens,
        };

        updatedSession.encryptedData = await this.encryptSensitiveData(
          sensitiveData
        );
        delete updatedSession.credentials;
        delete updatedSession.cookies;
        delete updatedSession.tokens;
      }

      this.sessions.set(sessionId, updatedSession);

      // Persist if enabled
      if (this.config.enablePersistence) {
        await this.persistSession(updatedSession);
      }

      this.emit("sessionUpdated", updatedSession);
      await this.log(`Session updated: ${sessionId}`);

      return updatedSession;
    } catch (error) {
      await this.log(
        `Failed to update session ${sessionId}: ${error.message}`,
        "error"
      );
      throw error;
    }
  }

  // Rotate session (create new session ID, maintain data)
  async rotateSession(sessionId) {
    try {
      const oldSession = this.sessions.get(sessionId);
      if (!oldSession) {
        throw new Error(`Session not found: ${sessionId}`);
      }

      // Create new session with rotated ID
      const newSessionId = this.generateSessionId();
      const rotatedSession = {
        ...oldSession,
        id: newSessionId,
        rotationCount: oldSession.rotationCount + 1,
        lastAccessedAt: Date.now(),
        expiresAt: Date.now() + this.config.sessionTimeout, // Extend expiration
      };

      // Update mappings
      this.sessions.delete(sessionId);
      this.sessions.set(newSessionId, rotatedSession);

      // Update user sessions mapping
      const userSessions = this.userSessions.get(oldSession.userId);
      if (userSessions) {
        const index = userSessions.indexOf(sessionId);
        if (index !== -1) {
          userSessions[index] = newSessionId;
        }
      }

      // Update platform sessions mapping
      const platformSessions = this.platformSessions.get(oldSession.platform);
      if (platformSessions) {
        const index = platformSessions.indexOf(sessionId);
        if (index !== -1) {
          platformSessions[index] = newSessionId;
        }
      }

      // Update analytics
      this.analytics.rotatedSessions++;

      // Persist if enabled
      if (this.config.enablePersistence) {
        await this.removePersistedSession(sessionId);
        await this.persistSession(rotatedSession);
      }

      this.emit("sessionRotated", {
        oldSessionId: sessionId,
        newSession: rotatedSession,
      });
      await this.log(`Session rotated: ${sessionId} -> ${newSessionId}`);

      return rotatedSession;
    } catch (error) {
      await this.log(
        `Failed to rotate session ${sessionId}: ${error.message}`,
        "error"
      );
      throw error;
    }
  }

  // Extend session expiration
  async extendSession(sessionId, additionalTime = null) {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        throw new Error(`Session not found: ${sessionId}`);
      }

      const extension = additionalTime || this.config.sessionTimeout;
      session.expiresAt = Date.now() + extension;
      session.lastAccessedAt = Date.now();

      // Persist if enabled
      if (this.config.enablePersistence) {
        await this.persistSession(session);
      }

      this.emit("sessionExtended", session);
      await this.log(`Session extended: ${sessionId}`);

      return session;
    } catch (error) {
      await this.log(
        `Failed to extend session ${sessionId}: ${error.message}`,
        "error"
      );
      throw error;
    }
  }

  // Expire session
  async expireSession(sessionId) {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        return false;
      }

      session.status = "expired";
      session.expiredAt = Date.now();

      // Remove from active sessions
      this.sessions.delete(sessionId);

      // Update mappings
      this.removeFromUserSessions(session.userId, sessionId);
      this.removeFromPlatformSessions(session.platform, sessionId);

      // Update analytics
      this.analytics.activeSessions--;
      this.analytics.expiredSessions++;

      // Remove persisted data
      if (this.config.enablePersistence) {
        await this.removePersistedSession(sessionId);
      }

      this.emit("sessionExpired", session);
      await this.log(`Session expired: ${sessionId}`);

      return true;
    } catch (error) {
      await this.log(
        `Failed to expire session ${sessionId}: ${error.message}`,
        "error"
      );
      return false;
    }
  }

  // Get sessions by user ID
  async getUserSessions(userId) {
    const sessionIds = this.userSessions.get(userId) || [];
    const sessions = [];

    for (const sessionId of sessionIds) {
      const session = await this.getSession(sessionId);
      if (session) {
        sessions.push(session);
      }
    }

    return sessions;
  }

  // Get sessions by platform
  async getPlatformSessions(platform) {
    const sessionIds = this.platformSessions.get(platform) || [];
    const sessions = [];

    for (const sessionId of sessionIds) {
      const session = await this.getSession(sessionId);
      if (session) {
        sessions.push(session);
      }
    }

    return sessions;
  }

  // Cleanup expired sessions
  async cleanupExpiredSessions() {
    const currentTime = Date.now();
    const expiredSessions = [];

    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.expiresAt < currentTime) {
        expiredSessions.push(sessionId);
      }
    }

    for (const sessionId of expiredSessions) {
      await this.expireSession(sessionId);
    }

    this.analytics.lastCleanup = currentTime;

    if (expiredSessions.length > 0) {
      await this.log(`Cleaned up ${expiredSessions.length} expired sessions`);
    }

    return expiredSessions.length;
  }

  // Auto-rotate sessions
  async autoRotateSessions() {
    if (!this.config.enableRotation) return;

    const rotationThreshold = Date.now() - this.config.rotationInterval;
    const sessionsToRotate = [];

    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.lastAccessedAt < rotationThreshold) {
        sessionsToRotate.push(sessionId);
      }
    }

    for (const sessionId of sessionsToRotate) {
      try {
        await this.rotateSession(sessionId);
      } catch (error) {
        await this.log(
          `Auto-rotation failed for ${sessionId}: ${error.message}`,
          "error"
        );
      }
    }

    if (sessionsToRotate.length > 0) {
      await this.log(`Auto-rotated ${sessionsToRotate.length} sessions`);
    }
  }

  // Session maintenance cycle
  startMaintenanceCycle() {
    if (this.isRunning) return;

    this.isRunning = true;

    setInterval(async () => {
      try {
        await this.cleanupExpiredSessions();
        await this.autoRotateSessions();

        if (this.config.enablePersistence) {
          await this.backupSessions();
        }
      } catch (error) {
        await this.log(`Maintenance cycle error: ${error.message}`, "error");
      }
    }, this.config.backupInterval);
  }

  // Encryption/Decryption
  async encryptSensitiveData(data) {
    if (!this.config.enableEncryption) return data;

    try {
      const algorithm = "aes-256-gcm";
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher(algorithm, this.config.encryptionKey);

      let encrypted = cipher.update(JSON.stringify(data), "utf8", "hex");
      encrypted += cipher.final("hex");

      const authTag = cipher.getAuthTag();

      return {
        encrypted,
        iv: iv.toString("hex"),
        authTag: authTag.toString("hex"),
      };
    } catch (error) {
      await this.log(`Encryption failed: ${error.message}`, "error");
      return data; // Return unencrypted data if encryption fails
    }
  }

  async decryptSensitiveData(encryptedData) {
    if (!this.config.enableEncryption || !encryptedData.encrypted)
      return encryptedData;

    try {
      const algorithm = "aes-256-gcm";
      const decipher = crypto.createDecipher(
        algorithm,
        this.config.encryptionKey
      );

      if (encryptedData.authTag) {
        decipher.setAuthTag(Buffer.from(encryptedData.authTag, "hex"));
      }

      let decrypted = decipher.update(encryptedData.encrypted, "hex", "utf8");
      decrypted += decipher.final("utf8");

      return JSON.parse(decrypted);
    } catch (error) {
      await this.log(`Decryption failed: ${error.message}`, "error");
      return {}; // Return empty object if decryption fails
    }
  }

  // Persistence
  async persistSession(session) {
    try {
      const sessionFile = path.join(
        this.config.dataDir,
        "sessions",
        `${session.id}.json`
      );
      await fs.writeFile(sessionFile, JSON.stringify(session, null, 2));
    } catch (error) {
      await this.log(
        `Failed to persist session ${session.id}: ${error.message}`,
        "error"
      );
    }
  }

  async loadSessions() {
    try {
      const sessionsDir = path.join(this.config.dataDir, "sessions");
      const files = await fs.readdir(sessionsDir);

      for (const file of files) {
        if (file.endsWith(".json")) {
          try {
            const sessionData = JSON.parse(
              await fs.readFile(path.join(sessionsDir, file), "utf8")
            );

            // Check if session is still valid
            if (sessionData.expiresAt > Date.now()) {
              this.sessions.set(sessionData.id, sessionData);

              // Rebuild mappings
              if (!this.userSessions.has(sessionData.userId)) {
                this.userSessions.set(sessionData.userId, []);
              }
              this.userSessions.get(sessionData.userId).push(sessionData.id);

              if (!this.platformSessions.has(sessionData.platform)) {
                this.platformSessions.set(sessionData.platform, []);
              }
              this.platformSessions
                .get(sessionData.platform)
                .push(sessionData.id);

              this.analytics.activeSessions++;
            }
          } catch (error) {
            await this.log(
              `Failed to load session from ${file}: ${error.message}`,
              "error"
            );
          }
        }
      }

      await this.log(`Loaded ${this.sessions.size} sessions from persistence`);
    } catch (error) {
      // Sessions directory doesn't exist or is empty
    }
  }

  async removePersistedSession(sessionId) {
    try {
      const sessionFile = path.join(
        this.config.dataDir,
        "sessions",
        `${sessionId}.json`
      );
      await fs.unlink(sessionFile);
    } catch (error) {
      // File doesn't exist or already removed
    }
  }

  async backupSessions() {
    try {
      const backupData = {
        sessions: Array.from(this.sessions.entries()),
        userSessions: Array.from(this.userSessions.entries()),
        platformSessions: Array.from(this.platformSessions.entries()),
        analytics: this.analytics,
        timestamp: Date.now(),
      };

      const backupFile = path.join(
        this.config.dataDir,
        "backups",
        `sessions_backup_${Date.now()}.json`
      );

      await fs.writeFile(backupFile, JSON.stringify(backupData, null, 2));

      // Keep only last 10 backups
      await this.cleanupOldBackups();
    } catch (error) {
      await this.log(`Backup failed: ${error.message}`, "error");
    }
  }

  async cleanupOldBackups() {
    try {
      const backupsDir = path.join(this.config.dataDir, "backups");
      const files = await fs.readdir(backupsDir);
      const backupFiles = files
        .filter((f) => f.startsWith("sessions_backup_"))
        .sort()
        .reverse();

      // Keep only last 10 backups
      for (let i = 10; i < backupFiles.length; i++) {
        await fs.unlink(path.join(backupsDir, backupFiles[i]));
      }
    } catch (error) {
      // Backup directory doesn't exist or cleanup failed
    }
  }

  // Utility methods
  generateSessionId() {
    return `ses_${Date.now()}_${crypto.randomBytes(16).toString("hex")}`;
  }

  generateFingerprint(data) {
    const fingerprintData = `${data.userAgent}|${data.ipAddress}|${data.platform}`;
    return crypto
      .createHash("sha256")
      .update(fingerprintData)
      .digest("hex")
      .substr(0, 16);
  }

  removeFromUserSessions(userId, sessionId) {
    const sessions = this.userSessions.get(userId);
    if (sessions) {
      const index = sessions.indexOf(sessionId);
      if (index !== -1) {
        sessions.splice(index, 1);
        if (sessions.length === 0) {
          this.userSessions.delete(userId);
        }
      }
    }
  }

  removeFromPlatformSessions(platform, sessionId) {
    const sessions = this.platformSessions.get(platform);
    if (sessions) {
      const index = sessions.indexOf(sessionId);
      if (index !== -1) {
        sessions.splice(index, 1);
        if (sessions.length === 0) {
          this.platformSessions.delete(platform);
        }
      }
    }
  }

  async ensureDirectories() {
    const dirs = [
      this.config.dataDir,
      path.join(this.config.dataDir, "sessions"),
      path.join(this.config.dataDir, "backups"),
      "./logs",
    ];

    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  // Get system status
  async getStatus() {
    return {
      sessions: {
        total: this.sessions.size,
        active: Array.from(this.sessions.values()).filter(
          (s) => s.status === "active"
        ).length,
        expired: Array.from(this.sessions.values()).filter(
          (s) => s.status === "expired"
        ).length,
      },
      analytics: {
        ...this.analytics,
        sessionsByPlatform: Object.fromEntries(
          this.analytics.sessionsByPlatform
        ),
      },
      config: {
        enableEncryption: this.config.enableEncryption,
        enablePersistence: this.config.enablePersistence,
        enableRotation: this.config.enableRotation,
        sessionTimeout: this.config.sessionTimeout,
        maxSessions: this.config.maxSessions,
      },
      timestamp: new Date().toISOString(),
    };
  }

  async log(message, level = "info") {
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp} [SESSION-MANAGER] [${level.toUpperCase()}] ${message}`;

    console.log(logMessage);

    try {
      await fs.appendFile("./logs/session-manager.log", logMessage + "\n");
    } catch (error) {
      // Logging failed
    }
  }
}

export default SessionManager;
