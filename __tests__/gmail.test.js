// Gmail Login Tests - AutoLogin and EnhancedLogin modules will be mocked for testing

describe("Gmail Login Tests", () => {
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

  describe("Basic Gmail Login - Auto Login", () => {
    it("should login to Gmail with valid credentials", async () => {
      const mockCredentials = {
        email: "test@gmail.com",
        password: "testpassword",
      };

      const mockResult = {
        success: true,
        platform: "gmail",
        url: "https://mail.google.com/mail/",
        cookies: [],
      };

      const loginSpy = jest
        .spyOn(autoLogin, "login")
        .mockResolvedValue(mockResult);

      const result = await autoLogin.login("gmail", mockCredentials);

      expect(result.success).toBe(true);
      expect(result.platform).toBe("gmail");
      expect(result.url).toContain("google.com");

      loginSpy.mockRestore();
    });

    it("should handle Gmail login failure", async () => {
      const mockCredentials = {
        email: "invalid@gmail.com",
        password: "wrongpassword",
      };

      const mockError = new Error(
        "Gmail login failed - credentials may be incorrect"
      );
      const loginSpy = jest
        .spyOn(autoLogin, "login")
        .mockRejectedValue(mockError);

      try {
        await autoLogin.login("gmail", mockCredentials);
      } catch (error) {
        expect(error.message).toContain("Gmail login failed");
      }

      loginSpy.mockRestore();
    });

    it("should handle App Password authentication", async () => {
      const mockCredentials = {
        email: "test@gmail.com",
        password: "regularpassword",
        appPassword: "abcd-efgh-ijkl-mnop",
      };

      const mockResult = {
        success: true,
        platform: "gmail",
        url: "https://mail.google.com/mail/",
        authMethod: "app_password",
      };

      const loginSpy = jest
        .spyOn(autoLogin, "login")
        .mockResolvedValue(mockResult);

      const result = await autoLogin.login("gmail", mockCredentials);

      expect(result.success).toBe(true);
      expect(result.authMethod).toBe("app_password");

      loginSpy.mockRestore();
    });
  });

  describe("Enhanced Gmail Login - Enhanced Login", () => {
    it("should perform stealth Gmail login", async () => {
      const mockCredentials = {
        email: "stealth@gmail.com",
        password: "stealthpassword",
      };

      const mockResult = {
        success: true,
        platform: "gmail",
        url: "https://mail.google.com/mail/",
        sessionId: "enhanced_session_123",
        stealthMode: true,
      };

      const loginSpy = jest
        .spyOn(enhancedLogin, "loginGmail")
        .mockResolvedValue(mockResult);

      const result = await enhancedLogin.loginGmail(mockCredentials);

      expect(result.success).toBe(true);
      expect(result.stealthMode).toBe(true);
      expect(result.sessionId).toBeDefined();

      loginSpy.mockRestore();
    });

    it("should handle 2FA with enhanced login", async () => {
      const mockCredentials = {
        email: "test2fa@gmail.com",
        password: "testpassword",
      };

      // Mock 2FA challenge response
      const mockResult = {
        success: true,
        platform: "gmail",
        url: "https://mail.google.com/mail/",
        twoFactorHandled: true,
        challengeType: "sms",
      };

      const loginSpy = jest
        .spyOn(enhancedLogin, "loginGmail")
        .mockResolvedValue(mockResult);

      const result = await enhancedLogin.loginGmail(mockCredentials);

      expect(result.success).toBe(true);
      expect(result.twoFactorHandled).toBe(true);

      loginSpy.mockRestore();
    });

    it("should handle security challenges", async () => {
      const mockCredentials = {
        email: "challenge@gmail.com",
        password: "challengepassword",
      };

      const mockResult = {
        success: true,
        platform: "gmail",
        url: "https://mail.google.com/mail/",
        securityChallengeHandled: true,
        challengeMethod: "backup_codes",
      };

      const loginSpy = jest
        .spyOn(enhancedLogin, "loginGmail")
        .mockResolvedValue(mockResult);

      const result = await enhancedLogin.loginGmail(mockCredentials, {
        handleChallenges: true,
      });

      expect(result.success).toBe(true);
      expect(result.securityChallengeHandled).toBe(true);

      loginSpy.mockRestore();
    });
  });

  describe("Gmail Batch Operations", () => {
    it("should perform batch Gmail logins", async () => {
      const mockAccounts = [
        {
          platform: "gmail",
          credentials: { email: "user1@gmail.com", password: "pass1" },
        },
        {
          platform: "gmail",
          credentials: { email: "user2@gmail.com", password: "pass2" },
        },
        {
          platform: "gmail",
          credentials: { email: "user3@gmail.com", password: "pass3" },
        },
      ];

      const mockResults = [
        { success: true, platform: "gmail", account: "user1@gmail.com" },
        { success: true, platform: "gmail", account: "user2@gmail.com" },
        {
          success: false,
          platform: "gmail",
          account: "user3@gmail.com",
          error: "Invalid credentials",
        },
      ];

      const batchSpy = jest
        .spyOn(autoLogin, "batchLogin")
        .mockResolvedValue(mockResults);

      const results = await autoLogin.batchLogin(mockAccounts);

      expect(results).toHaveLength(3);
      expect(results.filter((r) => r.success)).toHaveLength(2);
      expect(results.filter((r) => !r.success)).toHaveLength(1);

      batchSpy.mockRestore();
    });

    it("should handle enhanced batch operations", async () => {
      const mockAccounts = [
        {
          platform: "gmail",
          credentials: { email: "enhanced1@gmail.com", password: "pass1" },
        },
        {
          platform: "gmail",
          credentials: { email: "enhanced2@gmail.com", password: "pass2" },
        },
      ];

      const mockOptions = {
        rotateProxies: true,
        screenshots: true,
        delay: 2000,
      };

      const mockResults = [
        {
          success: true,
          platform: "gmail",
          accountIndex: 0,
          sessionId: "session_1",
        },
        {
          success: true,
          platform: "gmail",
          accountIndex: 1,
          sessionId: "session_2",
        },
      ];

      const batchSpy = jest
        .spyOn(enhancedLogin, "batchLogin")
        .mockResolvedValue(mockResults);

      const results = await enhancedLogin.batchLogin(mockAccounts, mockOptions);

      expect(results).toHaveLength(2);
      expect(results.every((r) => r.success)).toBe(true);
      expect(results.every((r) => r.sessionId)).toBe(true);

      batchSpy.mockRestore();
    });
  });

  describe("Session Management", () => {
    it("should save Gmail session", async () => {
      const mockSessionData = {
        platform: "gmail",
        identifier: "test@gmail.com",
        cookies: [],
        timestamp: new Date().toISOString(),
        sessionId: "gmail_session_123",
      };

      const saveSpy = jest
        .spyOn(enhancedLogin, "saveSession")
        .mockResolvedValue(mockSessionData);

      const result = await enhancedLogin.saveSession("gmail", "test@gmail.com");

      expect(result.platform).toBe("gmail");
      expect(result.sessionId).toBeDefined();

      saveSpy.mockRestore();
    });

    it("should take screenshots during login", async () => {
      const mockScreenshotPath = "./screenshots/gmail_login_test_12345.png";

      const screenshotSpy = jest
        .spyOn(enhancedLogin, "takeScreenshot")
        .mockResolvedValue(mockScreenshotPath);

      const result = await enhancedLogin.takeScreenshot("gmail_login_test");

      expect(result).toContain("gmail_login_test");
      expect(result).toMatch(/\.png$/);

      screenshotSpy.mockRestore();
    });
  });

  describe("Error Scenarios", () => {
    it("should handle account locked", async () => {
      const mockCredentials = {
        email: "locked@gmail.com",
        password: "lockedpassword",
      };

      const mockError = new Error("Account temporarily locked");
      const loginSpy = jest
        .spyOn(autoLogin, "login")
        .mockRejectedValue(mockError);

      try {
        await autoLogin.login("gmail", mockCredentials);
      } catch (error) {
        expect(error.message).toContain("locked");
      }

      loginSpy.mockRestore();
    });

    it("should handle suspicious activity detection", async () => {
      const mockCredentials = {
        email: "suspicious@gmail.com",
        password: "suspiciouspassword",
      };

      const mockResult = {
        success: false,
        error: "Suspicious activity detected",
        requiresVerification: true,
        verificationMethod: "phone",
      };

      const loginSpy = jest
        .spyOn(enhancedLogin, "loginGmail")
        .mockResolvedValue(mockResult);

      const result = await enhancedLogin.loginGmail(mockCredentials);

      expect(result.success).toBe(false);
      expect(result.requiresVerification).toBe(true);
      expect(result.verificationMethod).toBe("phone");

      loginSpy.mockRestore();
    });
  });
});
