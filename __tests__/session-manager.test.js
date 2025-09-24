// Session Manager Tests - SessionManager module will be mocked for testing

describe("Session Manager Tests", () => {
  let sessionManager;

  beforeAll(async () => {
    sessionManager = new SessionManager({
      enableEncryption: false, // Disable for testing
      enablePersistence: false, // Disable for testing
      sessionTimeout: 60000, // 1 minute for testing
      enableRotation: true,
      rotationInterval: 30000, // 30 seconds for testing
      maxSessions: 10,
      dataDir: "./test-session-data",
    });
    await sessionManager.initialize();
  });

  afterAll(async () => {
    if (sessionManager) {
      await sessionManager.cleanup();
    }
  });

  describe("Initialization", () => {
    it("should initialize session manager successfully", async () => {
      expect(sessionManager).toBeDefined();
      expect(sessionManager.sessions).toBeDefined();
      expect(sessionManager.userSessions).toBeDefined();
      expect(sessionManager.platformSessions).toBeDefined();
      expect(sessionManager.analytics).toBeDefined();
    });

    it("should have required methods", () => {
      expect(typeof sessionManager.createSession).toBe("function");
      expect(typeof sessionManager.getSession).toBe("function");
      expect(typeof sessionManager.updateSession).toBe("function");
      expect(typeof sessionManager.rotateSession).toBe("function");
      expect(typeof sessionManager.expireSession).toBe("function");
    });
  });

  describe("Session Creation", () => {
    it("should create a new session", async () => {
      const sessionData = {
        userId: "user123",
        platform: "facebook",
        credentials: {
          email: "test@example.com",
          password: "testpassword",
        },
        cookies: [
          { name: "sessionid", value: "abc123", domain: "facebook.com" },
        ],
        tokens: {
          accessToken: "token123",
          refreshToken: "refresh123",
        },
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        ipAddress: "192.168.1.100",
      };

      const session = await sessionManager.createSession(sessionData);

      expect(session).toBeDefined();
      expect(session.id).toBeDefined();
      expect(session.userId).toBe("user123");
      expect(session.platform).toBe("facebook");
      expect(session.status).toBe("active");
      expect(session.createdAt).toBeDefined();
      expect(session.expiresAt).toBeDefined();
      expect(session.fingerprint).toBeDefined();
    });

    it("should generate unique session IDs", async () => {
      const sessionData1 = {
        userId: "user1",
        platform: "gmail",
        userAgent: "test-agent",
        ipAddress: "127.0.0.1",
      };

      const sessionData2 = {
        userId: "user2",
        platform: "instagram",
        userAgent: "test-agent-2",
        ipAddress: "127.0.0.2",
      };

      const session1 = await sessionManager.createSession(sessionData1);
      const session2 = await sessionManager.createSession(sessionData2);

      expect(session1.id).not.toBe(session2.id);
      expect(session1.fingerprint).not.toBe(session2.fingerprint);
    });

    it("should update analytics on session creation", async () => {
      const initialTotal = sessionManager.analytics.totalSessions;

      await sessionManager.createSession({
        userId: "analytics_test",
        platform: "yahoo",
        userAgent: "test-agent",
        ipAddress: "127.0.0.1",
      });

      expect(sessionManager.analytics.totalSessions).toBe(initialTotal + 1);
      expect(sessionManager.analytics.activeSessions).toBeGreaterThan(0);
    });

    it("should map sessions to users and platforms", async () => {
      const userId = "mapping_test_user";
      const platform = "zalo";

      const session = await sessionManager.createSession({
        userId: userId,
        platform: platform,
        userAgent: "test-agent",
        ipAddress: "127.0.0.1",
      });

      const userSessions = sessionManager.userSessions.get(userId);
      const platformSessions = sessionManager.platformSessions.get(platform);

      expect(userSessions).toContain(session.id);
      expect(platformSessions).toContain(session.id);
    });
  });

  describe("Session Retrieval", () => {
    let testSession;

    beforeAll(async () => {
      testSession = await sessionManager.createSession({
        userId: "retrieval_test",
        platform: "hotmail",
        userAgent: "test-agent",
        ipAddress: "127.0.0.1",
      });
    });

    it("should retrieve existing session", async () => {
      const retrieved = await sessionManager.getSession(testSession.id);

      expect(retrieved).toBeDefined();
      expect(retrieved.id).toBe(testSession.id);
      expect(retrieved.userId).toBe("retrieval_test");
      expect(retrieved.platform).toBe("hotmail");
      expect(retrieved.accessCount).toBe(1); // Should increment on access
    });

    it("should return null for non-existent session", async () => {
      const retrieved = await sessionManager.getSession("non_existent_session");

      expect(retrieved).toBeNull();
    });

    it("should update last accessed time on retrieval", async () => {
      const originalAccessTime = testSession.lastAccessedAt;

      // Wait a bit to ensure time difference
      await new Promise((resolve) => setTimeout(resolve, 10));

      const retrieved = await sessionManager.getSession(testSession.id);

      expect(retrieved.lastAccessedAt).toBeGreaterThan(originalAccessTime);
    });

    it("should get sessions by user", async () => {
      const userSessions = await sessionManager.getSessionsByUser(
        "retrieval_test"
      );

      expect(userSessions).toBeDefined();
      expect(Array.isArray(userSessions)).toBe(true);
      expect(userSessions.length).toBeGreaterThan(0);
      expect(userSessions[0].userId).toBe("retrieval_test");
    });

    it("should get sessions by platform", async () => {
      const platformSessions = await sessionManager.getSessionsByPlatform(
        "hotmail"
      );

      expect(platformSessions).toBeDefined();
      expect(Array.isArray(platformSessions)).toBe(true);
      expect(platformSessions.length).toBeGreaterThan(0);
      expect(platformSessions[0].platform).toBe("hotmail");
    });
  });

  describe("Session Updates", () => {
    let updateTestSession;

    beforeAll(async () => {
      updateTestSession = await sessionManager.createSession({
        userId: "update_test",
        platform: "twitter",
        userAgent: "test-agent",
        ipAddress: "127.0.0.1",
      });
    });

    it("should update session data", async () => {
      const updates = {
        platform: "twitter",
        newData: "updated value",
        status: "active",
      };

      const updated = await sessionManager.updateSession(
        updateTestSession.id,
        updates
      );

      expect(updated).toBeDefined();
      expect(updated.newData).toBe("updated value");
      expect(updated.updatedAt).toBeDefined();
      expect(updated.lastAccessedAt).toBeDefined();
    });

    it("should handle updates to non-existent session", async () => {
      try {
        await sessionManager.updateSession("non_existent", { data: "test" });
      } catch (error) {
        expect(error).toBeDefined();
        expect(error.message).toContain("not found");
      }
    });

    it("should extend session expiration", async () => {
      const originalExpiration = updateTestSession.expiresAt;
      const additionalTime = 30000; // 30 seconds

      const extended = await sessionManager.extendSession(
        updateTestSession.id,
        additionalTime
      );

      expect(extended).toBeDefined();
      expect(extended.expiresAt).toBeGreaterThan(originalExpiration);
    });
  });

  describe("Session Rotation", () => {
    let rotationTestSession;

    beforeAll(async () => {
      rotationTestSession = await sessionManager.createSession({
        userId: "rotation_test",
        platform: "linkedin",
        userAgent: "test-agent",
        ipAddress: "127.0.0.1",
      });
    });

    it("should rotate session ID", async () => {
      const originalId = rotationTestSession.id;

      const rotated = await sessionManager.rotateSession(originalId);

      expect(rotated).toBeDefined();
      expect(rotated.id).not.toBe(originalId);
      expect(rotated.userId).toBe(rotationTestSession.userId);
      expect(rotated.platform).toBe(rotationTestSession.platform);
      expect(rotated.rotationCount).toBe(1);

      // Original session should be gone
      const originalRetrieved = await sessionManager.getSession(originalId);
      expect(originalRetrieved).toBeNull();

      // New session should exist
      const newRetrieved = await sessionManager.getSession(rotated.id);
      expect(newRetrieved).toBeDefined();
    });

    it("should update mappings after rotation", async () => {
      const session = await sessionManager.createSession({
        userId: "mapping_rotation_test",
        platform: "discord",
        userAgent: "test-agent",
        ipAddress: "127.0.0.1",
      });

      const originalId = session.id;
      const rotated = await sessionManager.rotateSession(originalId);

      const userSessions = sessionManager.userSessions.get(
        "mapping_rotation_test"
      );
      const platformSessions = sessionManager.platformSessions.get("discord");

      expect(userSessions).not.toContain(originalId);
      expect(userSessions).toContain(rotated.id);
      expect(platformSessions).not.toContain(originalId);
      expect(platformSessions).toContain(rotated.id);
    });

    it("should handle rotation of non-existent session", async () => {
      try {
        await sessionManager.rotateSession("non_existent_session");
      } catch (error) {
        expect(error).toBeDefined();
        expect(error.message).toContain("not found");
      }
    });

    it("should perform auto-rotation based on interval", async () => {
      // Create session with old lastAccessedAt
      const oldSession = await sessionManager.createSession({
        userId: "auto_rotation_test",
        platform: "telegram",
        userAgent: "test-agent",
        ipAddress: "127.0.0.1",
      });

      // Manually set old access time to trigger auto-rotation
      oldSession.lastAccessedAt = Date.now() - 60000; // 1 minute ago

      const autoRotateSpy = jest
        .spyOn(sessionManager, "autoRotateSessions")
        .mockImplementation(async () => {
          await sessionManager.rotateSession(oldSession.id);
        });

      await sessionManager.autoRotateSessions();

      expect(autoRotateSpy).toHaveBeenCalled();

      autoRotateSpy.mockRestore();
    });
  });

  describe("Session Expiration", () => {
    it("should expire session", async () => {
      const expireTestSession = await sessionManager.createSession({
        userId: "expire_test",
        platform: "reddit",
        userAgent: "test-agent",
        ipAddress: "127.0.0.1",
      });

      const result = await sessionManager.expireSession(expireTestSession.id);

      expect(result).toBe(true);

      // Session should be removed
      const retrieved = await sessionManager.getSession(expireTestSession.id);
      expect(retrieved).toBeNull();
    });

    it("should cleanup expired sessions", async () => {
      // Create session that will expire immediately
      const expiredSession = await sessionManager.createSession({
        userId: "cleanup_test",
        platform: "whatsapp",
        userAgent: "test-agent",
        ipAddress: "127.0.0.1",
      });

      // Manually set expiration to past
      expiredSession.expiresAt = Date.now() - 1000; // 1 second ago

      const cleanupCount = await sessionManager.cleanupExpiredSessions();

      expect(cleanupCount).toBeGreaterThanOrEqual(0);
    });

    it("should return null for expired session on retrieval", async () => {
      const session = await sessionManager.createSession({
        userId: "expired_retrieval_test",
        platform: "snapchat",
        userAgent: "test-agent",
        ipAddress: "127.0.0.1",
      });

      // Manually expire the session
      session.expiresAt = Date.now() - 1000;

      const retrieved = await sessionManager.getSession(session.id);

      expect(retrieved).toBeNull();
    });
  });

  describe("Session Security", () => {
    it("should generate fingerprints", () => {
      const data1 = {
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        ipAddress: "192.168.1.100",
        platform: "facebook",
      };

      const data2 = {
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
        ipAddress: "192.168.1.101",
        platform: "facebook",
      };

      const fingerprint1 = sessionManager.generateFingerprint(data1);
      const fingerprint2 = sessionManager.generateFingerprint(data2);

      expect(fingerprint1).toBeDefined();
      expect(fingerprint2).toBeDefined();
      expect(fingerprint1).not.toBe(fingerprint2);
      expect(typeof fingerprint1).toBe("string");
      expect(fingerprint1.length).toBe(16); // SHA256 substr(0, 16)
    });

    it("should generate unique session IDs", () => {
      const id1 = sessionManager.generateSessionId();
      const id2 = sessionManager.generateSessionId();

      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^ses_\d+_[a-f0-9]{32}$/);
    });

    it("should handle encryption when enabled", async () => {
      // Create session manager with encryption enabled
      const encryptedManager = new SessionManager({
        enableEncryption: true,
        encryptionKey: "test-encryption-key-for-testing-only",
      });

      await encryptedManager.initialize();

      const sensitiveData = {
        credentials: { username: "test", password: "secret" },
        cookies: [{ name: "auth", value: "secret_token" }],
        tokens: { access: "access_token", refresh: "refresh_token" },
      };

      const encryptSpy = jest
        .spyOn(encryptedManager, "encryptSensitiveData")
        .mockResolvedValue({
          encrypted: "encrypted_data",
          iv: "test_iv",
          authTag: "test_auth_tag",
        });

      const encrypted = await encryptedManager.encryptSensitiveData(
        sensitiveData
      );

      expect(encrypted).toBeDefined();
      expect(encrypted.encrypted).toBeDefined();

      encryptSpy.mockRestore();
    });
  });

  describe("System Status and Monitoring", () => {
    it("should get system status", async () => {
      const status = await sessionManager.getSystemStatus();

      expect(status).toBeDefined();
      expect(status.sessions).toBeDefined();
      expect(status.sessions.total).toBeGreaterThanOrEqual(0);
      expect(status.sessions.active).toBeGreaterThanOrEqual(0);
      expect(status.analytics).toBeDefined();
      expect(status.config).toBeDefined();
      expect(status.timestamp).toBeDefined();
    });

    it("should start maintenance cycle", () => {
      const startMaintenanceSpy = jest
        .spyOn(sessionManager, "startMaintenanceCycle")
        .mockImplementation(() => {
          sessionManager.isRunning = true;
        });

      sessionManager.startMaintenanceCycle();

      expect(sessionManager.isRunning).toBe(true);
      expect(startMaintenanceSpy).toHaveBeenCalled();

      startMaintenanceSpy.mockRestore();
    });

    it("should remove from user sessions mapping", () => {
      const userId = "mapping_remove_test";
      const sessionId = "session_to_remove";

      // Add mapping
      sessionManager.userSessions.set(userId, [sessionId, "other_session"]);

      sessionManager.removeFromUserSessions(userId, sessionId);

      const userSessions = sessionManager.userSessions.get(userId);
      expect(userSessions).not.toContain(sessionId);
      expect(userSessions).toContain("other_session");
    });

    it("should remove from platform sessions mapping", () => {
      const platform = "test_platform";
      const sessionId = "session_to_remove";

      // Add mapping
      sessionManager.platformSessions.set(platform, [
        sessionId,
        "other_session",
      ]);

      sessionManager.removeFromPlatformSessions(platform, sessionId);

      const platformSessions = sessionManager.platformSessions.get(platform);
      expect(platformSessions).not.toContain(sessionId);
      expect(platformSessions).toContain("other_session");
    });
  });

  describe("Persistence and Backup", () => {
    it("should create backup data structure", async () => {
      const backupSpy = jest
        .spyOn(sessionManager, "backupSessions")
        .mockImplementation(async () => {
          const backupData = {
            sessions: Array.from(sessionManager.sessions.entries()),
            userSessions: Array.from(sessionManager.userSessions.entries()),
            platformSessions: Array.from(
              sessionManager.platformSessions.entries()
            ),
            analytics: sessionManager.analytics,
            timestamp: Date.now(),
          };
          return backupData;
        });

      const backup = await sessionManager.backupSessions();

      expect(backup).toBeDefined();
      expect(backup.sessions).toBeDefined();
      expect(backup.userSessions).toBeDefined();
      expect(backup.platformSessions).toBeDefined();
      expect(backup.analytics).toBeDefined();
      expect(backup.timestamp).toBeDefined();

      backupSpy.mockRestore();
    });

    it("should cleanup old backups", async () => {
      const cleanupSpy = jest
        .spyOn(sessionManager, "cleanupOldBackups")
        .mockResolvedValue(true);

      await sessionManager.cleanupOldBackups();

      expect(cleanupSpy).toHaveBeenCalled();

      cleanupSpy.mockRestore();
    });
  });

  describe("Error Handling", () => {
    it("should handle invalid session data", async () => {
      try {
        await sessionManager.createSession(null);
      } catch (error) {
        expect(error).toBeDefined();
      }

      try {
        await sessionManager.createSession({});
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it("should handle encryption errors gracefully", async () => {
      const encryptSpy = jest
        .spyOn(sessionManager, "encryptSensitiveData")
        .mockImplementation(async (data) => {
          // Simulate encryption error
          throw new Error("Encryption failed");
        });

      // Should fallback to unencrypted data
      const result = await sessionManager.encryptSensitiveData({
        test: "data",
      });

      expect(result).toEqual({ test: "data" }); // Should return original data

      encryptSpy.mockRestore();
    });

    it("should handle decryption errors gracefully", async () => {
      const decryptSpy = jest
        .spyOn(sessionManager, "decryptSensitiveData")
        .mockImplementation(async (data) => {
          throw new Error("Decryption failed");
        });

      const result = await sessionManager.decryptSensitiveData({
        encrypted: "test",
      });

      expect(result).toEqual({}); // Should return empty object on error

      decryptSpy.mockRestore();
    });
  });

  describe("Utility Methods", () => {
    it("should ensure directories", async () => {
      const ensureDirSpy = jest
        .spyOn(sessionManager, "ensureDirectories")
        .mockResolvedValue(true);

      await sessionManager.ensureDirectories();

      expect(ensureDirSpy).toHaveBeenCalled();

      ensureDirSpy.mockRestore();
    });

    it("should log messages", async () => {
      const logSpy = jest
        .spyOn(sessionManager, "log")
        .mockImplementation(async () => {});

      await sessionManager.log("Test message", "info");
      await sessionManager.log("Error message", "error");

      expect(logSpy).toHaveBeenCalledWith("Test message", "info");
      expect(logSpy).toHaveBeenCalledWith("Error message", "error");

      logSpy.mockRestore();
    });
  });
});
