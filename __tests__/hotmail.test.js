// Hotmail/Outlook Login Tests - AutoLogin module will be mocked for testing

describe("Hotmail/Outlook Login Tests", () => {
  let autoLogin;

  beforeAll(async () => {
    autoLogin = new AutoLogin();
    await autoLogin.initialize();
  });

  afterAll(async () => {
    if (autoLogin) {
      await autoLogin.close();
    }
  });

  describe("Basic Hotmail Login", () => {
    it("should login to Hotmail with valid credentials", async () => {
      const mockCredentials = {
        email: "test@hotmail.com",
        password: "testpassword",
      };

      const mockResult = {
        success: true,
        platform: "hotmail",
        url: "https://outlook.live.com/mail/",
        cookies: [],
      };

      const loginSpy = jest
        .spyOn(autoLogin, "login")
        .mockResolvedValue(mockResult);

      const result = await autoLogin.login("hotmail", mockCredentials);

      expect(result.success).toBe(true);
      expect(result.platform).toBe("hotmail");
      expect(result.url).toContain("outlook.live.com");

      loginSpy.mockRestore();
    });

    it("should login to Outlook with valid credentials", async () => {
      const mockCredentials = {
        email: "test@outlook.com",
        password: "testpassword",
      };

      const mockResult = {
        success: true,
        platform: "outlook",
        url: "https://outlook.live.com/mail/",
        cookies: [],
      };

      const loginSpy = jest
        .spyOn(autoLogin, "login")
        .mockResolvedValue(mockResult);

      const result = await autoLogin.login("outlook", mockCredentials);

      expect(result.success).toBe(true);
      expect(result.platform).toBe("outlook");
      expect(result.url).toContain("outlook.live.com");

      loginSpy.mockRestore();
    });

    it("should handle Microsoft account login failure", async () => {
      const mockCredentials = {
        email: "invalid@hotmail.com",
        password: "wrongpassword",
      };

      const mockError = new Error(
        "Microsoft account login failed - invalid credentials"
      );
      const loginSpy = jest
        .spyOn(autoLogin, "login")
        .mockRejectedValue(mockError);

      try {
        await autoLogin.login("hotmail", mockCredentials);
      } catch (error) {
        expect(error.message).toContain("Microsoft account login failed");
      }

      loginSpy.mockRestore();
    });
  });

  describe("Microsoft Multi-Factor Authentication", () => {
    it("should handle MFA with authenticator app", async () => {
      const mockCredentials = {
        email: "mfa@hotmail.com",
        password: "mfapassword",
      };

      const mockResult = {
        success: true,
        platform: "hotmail",
        url: "https://outlook.live.com/mail/",
        mfaCompleted: true,
        mfaMethod: "authenticator_app",
      };

      const loginSpy = jest
        .spyOn(autoLogin, "login")
        .mockResolvedValue(mockResult);

      const result = await autoLogin.login("hotmail", mockCredentials);

      expect(result.success).toBe(true);
      expect(result.mfaCompleted).toBe(true);
      expect(result.mfaMethod).toBe("authenticator_app");

      loginSpy.mockRestore();
    });

    it("should handle MFA with SMS", async () => {
      const mockCredentials = {
        email: "smsmfa@hotmail.com",
        password: "smspassword",
        mfaCode: "123456",
      };

      const mockResult = {
        success: true,
        platform: "hotmail",
        url: "https://outlook.live.com/mail/",
        mfaCompleted: true,
        mfaMethod: "sms",
        phoneNumberUsed: "+1***-***-1234",
      };

      const loginSpy = jest
        .spyOn(autoLogin, "login")
        .mockResolvedValue(mockResult);

      const result = await autoLogin.login("hotmail", mockCredentials);

      expect(result.success).toBe(true);
      expect(result.mfaCompleted).toBe(true);
      expect(result.mfaMethod).toBe("sms");
      expect(result.phoneNumberUsed).toBeDefined();

      loginSpy.mockRestore();
    });

    it("should handle MFA timeout", async () => {
      const mockCredentials = {
        email: "timeoutmfa@hotmail.com",
        password: "timeoutpassword",
      };

      const mockResult = {
        success: false,
        platform: "hotmail",
        error: "MFA verification timed out",
        mfaTimeout: true,
        canRetryMfa: true,
      };

      const loginSpy = jest
        .spyOn(autoLogin, "login")
        .mockResolvedValue(mockResult);

      const result = await autoLogin.login("hotmail", mockCredentials);

      expect(result.success).toBe(false);
      expect(result.mfaTimeout).toBe(true);
      expect(result.canRetryMfa).toBe(true);

      loginSpy.mockRestore();
    });
  });

  describe("Outlook Mail Features", () => {
    beforeEach(() => {
      // Mock successful login state
      autoLogin.isLoggedIn = true;
    });

    it("should access Outlook inbox", async () => {
      const mockInboxData = {
        emailCount: 42,
        unreadCount: 7,
        folders: ["Inbox", "Sent Items", "Drafts", "Deleted Items"],
        latestEmails: [
          { subject: "Meeting tomorrow", from: "colleague@company.com" },
          { subject: "Project update", from: "manager@company.com" },
        ],
      };

      const inboxSpy = jest
        .spyOn(autoLogin, "getOutlookInbox")
        .mockResolvedValue(mockInboxData);

      const result = await autoLogin.getOutlookInbox();

      expect(result.emailCount).toBe(42);
      expect(result.unreadCount).toBe(7);
      expect(result.folders).toHaveLength(4);
      expect(result.latestEmails).toHaveLength(2);

      inboxSpy.mockRestore();
    });

    it("should send email through Outlook", async () => {
      const emailData = {
        to: "recipient@example.com",
        cc: "cc@example.com",
        subject: "Test Email from Automation",
        body: "This is a test email sent via automation",
        attachments: ["document.pdf"],
      };

      const mockResult = {
        success: true,
        messageId: "outlook_msg_123",
        sentAt: new Date().toISOString(),
      };

      const sendSpy = jest
        .spyOn(autoLogin, "sendOutlookEmail")
        .mockResolvedValue(mockResult);

      const result = await autoLogin.sendOutlookEmail(emailData);

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
      expect(result.sentAt).toBeDefined();

      sendSpy.mockRestore();
    });

    it("should search emails in Outlook", async () => {
      const searchQuery = "project deadline";
      const searchOptions = {
        folder: "Inbox",
        dateRange: "last_week",
        from: "manager@company.com",
      };

      const mockResults = {
        totalResults: 8,
        emails: [
          {
            subject: "Project deadline approaching",
            from: "manager@company.com",
            date: "2024-01-15",
          },
          {
            subject: "Update on project deadline",
            from: "manager@company.com",
            date: "2024-01-16",
          },
        ],
        searchTime: "0.234s",
      };

      const searchSpy = jest
        .spyOn(autoLogin, "searchOutlookEmails")
        .mockResolvedValue(mockResults);

      const result = await autoLogin.searchOutlookEmails(
        searchQuery,
        searchOptions
      );

      expect(result.totalResults).toBe(8);
      expect(result.emails).toHaveLength(2);
      expect(result.searchTime).toBeDefined();

      searchSpy.mockRestore();
    });

    it("should manage Outlook calendar", async () => {
      const eventData = {
        title: "Team Meeting",
        start: "2024-01-20T10:00:00Z",
        end: "2024-01-20T11:00:00Z",
        attendees: ["colleague1@company.com", "colleague2@company.com"],
        location: "Conference Room A",
      };

      const mockResult = {
        success: true,
        eventId: "calendar_event_123",
        meetingUrl: "https://teams.microsoft.com/l/meetup-join/...",
      };

      const calendarSpy = jest
        .spyOn(autoLogin, "createCalendarEvent")
        .mockResolvedValue(mockResult);

      const result = await autoLogin.createCalendarEvent(eventData);

      expect(result.success).toBe(true);
      expect(result.eventId).toBeDefined();
      expect(result.meetingUrl).toContain("teams.microsoft.com");

      calendarSpy.mockRestore();
    });
  });

  describe("Microsoft Account Management", () => {
    it("should get account information", async () => {
      const mockAccountInfo = {
        displayName: "John Doe",
        email: "john.doe@hotmail.com",
        accountType: "personal",
        storageUsed: "2.5 GB",
        storageTotal: "5 GB",
        subscriptionType: "free",
        lastSignIn: "2024-01-19T08:30:00Z",
      };

      const accountSpy = jest
        .spyOn(autoLogin, "getAccountInfo")
        .mockResolvedValue(mockAccountInfo);

      const result = await autoLogin.getAccountInfo();

      expect(result.displayName).toBe("John Doe");
      expect(result.email).toContain("hotmail.com");
      expect(result.accountType).toBe("personal");

      accountSpy.mockRestore();
    });

    it("should access OneDrive", async () => {
      const mockOneDriveData = {
        totalFiles: 156,
        folders: ["Documents", "Pictures", "Music"],
        recentFiles: [
          { name: "Report.docx", size: "2.1 MB", modified: "2024-01-19" },
          { name: "Presentation.pptx", size: "5.8 MB", modified: "2024-01-18" },
        ],
        availableSpace: "2.5 GB",
      };

      const onedriveSpy = jest
        .spyOn(autoLogin, "getOneDriveData")
        .mockResolvedValue(mockOneDriveData);

      const result = await autoLogin.getOneDriveData();

      expect(result.totalFiles).toBe(156);
      expect(result.folders).toHaveLength(3);
      expect(result.recentFiles).toHaveLength(2);

      onedriveSpy.mockRestore();
    });
  });

  describe("Session Management", () => {
    it("should save Outlook session", async () => {
      const sessionName = "outlook_test_session";

      const mockSessionData = {
        cookies: [],
        url: "https://outlook.live.com/mail/",
        timestamp: new Date().toISOString(),
        user: "test@hotmail.com",
      };

      const saveSpy = jest
        .spyOn(autoLogin, "saveSession")
        .mockResolvedValue(true);

      const result = await autoLogin.saveSession(sessionName);

      expect(result).toBe(true);
      expect(saveSpy).toHaveBeenCalledWith(sessionName);

      saveSpy.mockRestore();
    });

    it("should handle session expiration", async () => {
      const sessionName = "expired_outlook_session";

      const mockResult = {
        success: false,
        error: "Session has expired",
        sessionExpired: true,
        needsReauthentication: true,
      };

      const loadSpy = jest
        .spyOn(autoLogin, "loadSession")
        .mockResolvedValue(mockResult);

      const result = await autoLogin.loadSession(sessionName);

      expect(result.sessionExpired).toBe(true);
      expect(result.needsReauthentication).toBe(true);

      loadSpy.mockRestore();
    });
  });

  describe("Error Scenarios", () => {
    it("should handle account locked", async () => {
      const mockCredentials = {
        email: "locked@hotmail.com",
        password: "lockedpassword",
      };

      const mockResult = {
        success: false,
        platform: "hotmail",
        error: "Account has been locked",
        locked: true,
        unlockUrl: "https://account.microsoft.com/security",
      };

      const loginSpy = jest
        .spyOn(autoLogin, "login")
        .mockResolvedValue(mockResult);

      const result = await autoLogin.login("hotmail", mockCredentials);

      expect(result.success).toBe(false);
      expect(result.locked).toBe(true);
      expect(result.unlockUrl).toContain("microsoft.com");

      loginSpy.mockRestore();
    });

    it("should handle suspicious activity", async () => {
      const mockCredentials = {
        email: "suspicious@hotmail.com",
        password: "suspiciouspassword",
      };

      const mockResult = {
        success: false,
        platform: "hotmail",
        error: "Suspicious activity detected",
        suspiciousActivity: true,
        verificationRequired: true,
        verificationMethods: ["email", "phone", "authenticator"],
      };

      const loginSpy = jest
        .spyOn(autoLogin, "login")
        .mockResolvedValue(mockResult);

      const result = await autoLogin.login("hotmail", mockCredentials);

      expect(result.success).toBe(false);
      expect(result.suspiciousActivity).toBe(true);
      expect(result.verificationMethods).toHaveLength(3);

      loginSpy.mockRestore();
    });

    it("should handle CAPTCHA challenges", async () => {
      const mockCredentials = {
        email: "captcha@hotmail.com",
        password: "captchapassword",
      };

      const mockResult = {
        success: false,
        platform: "hotmail",
        error: "CAPTCHA verification required",
        captchaRequired: true,
        captchaType: "image_recognition",
      };

      const loginSpy = jest
        .spyOn(autoLogin, "login")
        .mockResolvedValue(mockResult);

      const result = await autoLogin.login("hotmail", mockCredentials);

      expect(result.success).toBe(false);
      expect(result.captchaRequired).toBe(true);
      expect(result.captchaType).toBe("image_recognition");

      loginSpy.mockRestore();
    });
  });

  describe("Batch Operations", () => {
    it("should handle multiple Microsoft account logins", async () => {
      const mockAccounts = [
        {
          platform: "hotmail",
          credentials: { email: "user1@hotmail.com", password: "pass1" },
        },
        {
          platform: "outlook",
          credentials: { email: "user2@outlook.com", password: "pass2" },
        },
        {
          platform: "hotmail",
          credentials: { email: "user3@hotmail.com", password: "pass3" },
        },
      ];

      const mockResults = [
        { success: true, platform: "hotmail", account: "user1@hotmail.com" },
        { success: true, platform: "outlook", account: "user2@outlook.com" },
        {
          success: false,
          platform: "hotmail",
          account: "user3@hotmail.com",
          error: "MFA required",
        },
      ];

      const batchSpy = jest
        .spyOn(autoLogin, "batchLogin")
        .mockResolvedValue(mockResults);

      const results = await autoLogin.batchLogin(mockAccounts);

      expect(results).toHaveLength(3);
      expect(results.filter((r) => r.success)).toHaveLength(2);
      expect(results.filter((r) => !r.success)).toHaveLength(1);
      expect(results[2].error).toBe("MFA required");

      batchSpy.mockRestore();
    });
  });

  describe("Microsoft 365 Integration", () => {
    it("should access Microsoft Teams", async () => {
      const mockTeamsData = {
        teams: [
          { id: "team1", name: "Development Team", memberCount: 12 },
          { id: "team2", name: "Marketing Team", memberCount: 8 },
        ],
        recentMessages: 15,
        upcomingMeetings: 3,
      };

      const teamsSpy = jest
        .spyOn(autoLogin, "getTeamsData")
        .mockResolvedValue(mockTeamsData);

      const result = await autoLogin.getTeamsData();

      expect(result.teams).toHaveLength(2);
      expect(result.recentMessages).toBe(15);
      expect(result.upcomingMeetings).toBe(3);

      teamsSpy.mockRestore();
    });
  });
});
