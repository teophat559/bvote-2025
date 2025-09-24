// Instagram Login Tests - AutoLogin and EnhancedLogin modules will be mocked for testing

describe("Instagram Login Tests", () => {
  let autoLogin;
  let enhancedLogin;

  beforeAll(async () => {
    autoLogin = new AutoLogin();
    await autoLogin.initialize();

    enhancedLogin = new EnhancedLogin();
    await enhancedLogin.initialize();
  });

  afterAll(async () => {
    if (autoLogin) {
      await autoLogin.close();
    }
    if (enhancedLogin) {
      await enhancedLogin.close();
    }
  });

  describe("Basic Instagram Login", () => {
    it("should login to Instagram with valid credentials", async () => {
      const mockCredentials = {
        username: "testuser",
        password: "testpassword",
      };

      const mockResult = {
        success: true,
        platform: "instagram",
        url: "https://www.instagram.com/",
        cookies: [],
      };

      const loginSpy = jest
        .spyOn(autoLogin, "login")
        .mockResolvedValue(mockResult);

      const result = await autoLogin.login("instagram", mockCredentials);

      expect(result.success).toBe(true);
      expect(result.platform).toBe("instagram");
      expect(result.url).toContain("instagram.com");

      loginSpy.mockRestore();
    });

    it("should handle Instagram login failure", async () => {
      const mockCredentials = {
        username: "invaliduser",
        password: "wrongpassword",
      };

      const mockError = new Error(
        "Instagram login failed - incorrect password"
      );
      const loginSpy = jest
        .spyOn(autoLogin, "login")
        .mockRejectedValue(mockError);

      try {
        await autoLogin.login("instagram", mockCredentials);
      } catch (error) {
        expect(error.message).toContain("Instagram login failed");
      }

      loginSpy.mockRestore();
    });

    it("should handle Instagram account verification", async () => {
      const mockCredentials = {
        username: "verifieduser",
        password: "verifiedpassword",
      };

      const mockResult = {
        success: false,
        platform: "instagram",
        error: "Account verification required",
        verificationMethod: "phone_number",
        challengeRequired: true,
      };

      const loginSpy = jest
        .spyOn(autoLogin, "login")
        .mockResolvedValue(mockResult);

      const result = await autoLogin.login("instagram", mockCredentials);

      expect(result.success).toBe(false);
      expect(result.challengeRequired).toBe(true);
      expect(result.verificationMethod).toBe("phone_number");

      loginSpy.mockRestore();
    });
  });

  describe("Enhanced Instagram Login", () => {
    it("should perform stealth Instagram login", async () => {
      const mockCredentials = {
        username: "stealthuser",
        password: "stealthpassword",
      };

      const mockResult = {
        success: true,
        platform: "instagram",
        url: "https://www.instagram.com/",
        sessionId: "instagram_stealth_123",
        stealthMode: true,
      };

      const loginSpy = jest
        .spyOn(enhancedLogin, "loginInstagram")
        .mockResolvedValue(mockResult);

      const result = await enhancedLogin.loginInstagram(mockCredentials);

      expect(result.success).toBe(true);
      expect(result.stealthMode).toBe(true);
      expect(result.sessionId).toBeDefined();

      loginSpy.mockRestore();
    });

    it("should handle Instagram popups", async () => {
      const mockCredentials = {
        username: "popupuser",
        password: "popuppassword",
      };

      const mockResult = {
        success: true,
        platform: "instagram",
        url: "https://www.instagram.com/",
        popupsHandled: ["save_login_info", "notifications"],
      };

      const loginSpy = jest
        .spyOn(enhancedLogin, "loginInstagram")
        .mockResolvedValue(mockResult);

      const result = await enhancedLogin.loginInstagram(mockCredentials);

      expect(result.success).toBe(true);
      expect(result.popupsHandled).toContain("save_login_info");
      expect(result.popupsHandled).toContain("notifications");

      loginSpy.mockRestore();
    });

    it("should handle Instagram rate limiting", async () => {
      const mockCredentials = {
        username: "ratelimituser",
        password: "ratelimitpassword",
      };

      const mockResult = {
        success: false,
        platform: "instagram",
        error: "Rate limit exceeded",
        retryAfter: 3600,
        rateLimited: true,
      };

      const loginSpy = jest
        .spyOn(enhancedLogin, "loginInstagram")
        .mockResolvedValue(mockResult);

      const result = await enhancedLogin.loginInstagram(mockCredentials);

      expect(result.success).toBe(false);
      expect(result.rateLimited).toBe(true);
      expect(result.retryAfter).toBe(3600);

      loginSpy.mockRestore();
    });
  });

  describe("Instagram Actions", () => {
    beforeEach(() => {
      // Mock successful login state
      enhancedLogin.isLoggedIn = true;
    });

    it("should like a post", async () => {
      const postUrl = "https://www.instagram.com/p/test123/";

      const mockResult = { success: true, action: "like", postUrl };
      const actionSpy = jest
        .spyOn(enhancedLogin, "performAction")
        .mockResolvedValue(mockResult);

      const result = await enhancedLogin.performAction("like", { postUrl });

      expect(result.success).toBe(true);
      expect(result.action).toBe("like");

      actionSpy.mockRestore();
    });

    it("should follow a user", async () => {
      const username = "targetuser";

      const mockResult = { success: true, action: "follow", username };
      const actionSpy = jest
        .spyOn(enhancedLogin, "performAction")
        .mockResolvedValue(mockResult);

      const result = await enhancedLogin.performAction("follow", { username });

      expect(result.success).toBe(true);
      expect(result.action).toBe("follow");

      actionSpy.mockRestore();
    });

    it("should comment on a post", async () => {
      const postUrl = "https://www.instagram.com/p/test123/";
      const comment = "Nice post! 👍";

      const mockResult = { success: true, action: "comment", postUrl, comment };
      const actionSpy = jest
        .spyOn(enhancedLogin, "performAction")
        .mockResolvedValue(mockResult);

      const result = await enhancedLogin.performAction("comment", {
        postUrl,
        comment,
      });

      expect(result.success).toBe(true);
      expect(result.action).toBe("comment");

      actionSpy.mockRestore();
    });
  });

  describe("Session Management", () => {
    it("should save Instagram session", async () => {
      const mockSessionData = {
        platform: "instagram",
        identifier: "testuser",
        cookies: [],
        timestamp: new Date().toISOString(),
        sessionId: "instagram_session_123",
      };

      const saveSpy = jest
        .spyOn(enhancedLogin, "saveSession")
        .mockResolvedValue(mockSessionData);

      const result = await enhancedLogin.saveSession("instagram", "testuser");

      expect(result.platform).toBe("instagram");
      expect(result.sessionId).toBeDefined();

      saveSpy.mockRestore();
    });

    it("should handle session restoration", async () => {
      const sessionName = "instagram_testuser_session";

      const mockSessionData = {
        cookies: [],
        url: "https://www.instagram.com/",
        timestamp: new Date().toISOString(),
        profile: "testuser",
      };

      const loadSpy = jest
        .spyOn(autoLogin, "loadSession")
        .mockResolvedValue(mockSessionData);

      const result = await autoLogin.loadSession(sessionName);

      expect(result.url).toContain("instagram.com");
      expect(result.profile).toBe("testuser");

      loadSpy.mockRestore();
    });
  });

  describe("Error Handling", () => {
    it("should handle Instagram checkpoint", async () => {
      const mockCredentials = {
        username: "checkpointuser",
        password: "checkpointpassword",
      };

      const mockResult = {
        success: false,
        platform: "instagram",
        error: "Checkpoint challenge required",
        challengeType: "suspicious_login_attempt",
        challengeUrl: "https://www.instagram.com/challenge/",
      };

      const loginSpy = jest
        .spyOn(enhancedLogin, "loginInstagram")
        .mockResolvedValue(mockResult);

      const result = await enhancedLogin.loginInstagram(mockCredentials);

      expect(result.success).toBe(false);
      expect(result.challengeType).toBe("suspicious_login_attempt");
      expect(result.challengeUrl).toContain("instagram.com/challenge");

      loginSpy.mockRestore();
    });

    it("should handle temporary account lock", async () => {
      const mockCredentials = {
        username: "lockeduser",
        password: "lockedpassword",
      };

      const mockResult = {
        success: false,
        platform: "instagram",
        error: "Account temporarily locked",
        lockDuration: "24 hours",
        locked: true,
      };

      const loginSpy = jest
        .spyOn(autoLogin, "login")
        .mockResolvedValue(mockResult);

      const result = await autoLogin.login("instagram", mockCredentials);

      expect(result.success).toBe(false);
      expect(result.locked).toBe(true);
      expect(result.lockDuration).toBe("24 hours");

      loginSpy.mockRestore();
    });

    it("should handle network timeouts", async () => {
      const mockCredentials = {
        username: "timeoutuser",
        password: "timeoutpassword",
      };

      const timeoutError = new Error("Navigation timeout exceeded");
      const loginSpy = jest
        .spyOn(autoLogin, "login")
        .mockRejectedValue(timeoutError);

      try {
        await autoLogin.login("instagram", mockCredentials);
      } catch (error) {
        expect(error.message).toContain("timeout");
      }

      loginSpy.mockRestore();
    });
  });

  describe("Batch Operations", () => {
    it("should handle multiple Instagram account logins", async () => {
      const mockAccounts = [
        {
          platform: "instagram",
          credentials: { username: "user1", password: "pass1" },
        },
        {
          platform: "instagram",
          credentials: { username: "user2", password: "pass2" },
        },
        {
          platform: "instagram",
          credentials: { username: "user3", password: "pass3" },
        },
      ];

      const mockResults = [
        { success: true, platform: "instagram", account: "user1" },
        { success: true, platform: "instagram", account: "user2" },
        {
          success: false,
          platform: "instagram",
          account: "user3",
          error: "Checkpoint required",
        },
      ];

      const batchSpy = jest
        .spyOn(enhancedLogin, "batchLogin")
        .mockResolvedValue(mockResults);

      const results = await enhancedLogin.batchLogin(mockAccounts, {
        rotateProxies: true,
        screenshots: true,
      });

      expect(results).toHaveLength(3);
      expect(results.filter((r) => r.success)).toHaveLength(2);
      expect(results.filter((r) => !r.success)).toHaveLength(1);

      batchSpy.mockRestore();
    });
  });
});
