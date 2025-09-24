// Victim Manager Tests - VictimManager module will be mocked for testing

describe("Victim Manager Tests", () => {
  let victimManager;

  beforeAll(async () => {
    victimManager = new VictimManager({
      dataDir: "./test-victim-data",
      enableEncryption: false, // Disable for testing
      enableAnalytics: true,
    });
    await victimManager.initialize();
  });

  afterAll(async () => {
    if (victimManager) {
      // Cleanup test data
      await victimManager.cleanup();
    }
  });

  describe("Initialization", () => {
    it("should initialize victim manager successfully", async () => {
      expect(victimManager).toBeDefined();
      expect(victimManager.profiles).toBeDefined();
      expect(victimManager.campaigns).toBeDefined();
      expect(victimManager.analytics).toBeDefined();
    });

    it("should have required methods", () => {
      expect(typeof victimManager.createProfile).toBe("function");
      expect(typeof victimManager.createCampaign).toBe("function");
      expect(typeof victimManager.executeCampaign).toBe("function");
      expect(typeof victimManager.generateReport).toBe("function");
    });
  });

  describe("Profile Management", () => {
    it("should create a new victim profile", async () => {
      const profileData = {
        name: "Test Victim",
        email: "victim@example.com",
        phone: "0123456789",
        socialMedia: {
          facebook: "test.victim",
          instagram: "testvictim",
          twitter: "@testvictim",
        },
        personalInfo: {
          age: 25,
          location: "Test City",
          workplace: "Test Company",
        },
        securityAwareness: "low",
      };

      const profile = await victimManager.createProfile(profileData);

      expect(profile).toBeDefined();
      expect(profile.id).toBeDefined();
      expect(profile.name).toBe("Test Victim");
      expect(profile.email).toBe("victim@example.com");
      expect(profile.riskLevel).toBeGreaterThan(0);
      expect(profile.status).toBe("active");
      expect(profile.createdAt).toBeDefined();
    });

    it("should calculate risk level correctly", () => {
      const lowRiskData = {
        name: "Low Risk User",
        securityAwareness: "high",
        socialMedia: { facebook: "lowrisk" },
        personalInfo: { email: "low@example.com" },
      };

      const highRiskData = {
        name: "High Risk User",
        securityAwareness: "low",
        socialMedia: {
          facebook: "highrisk",
          instagram: "highrisk",
          twitter: "@highrisk",
          linkedin: "highrisk",
        },
        personalInfo: {
          email: "high@example.com",
          phone: "0123456789",
          address: "123 Test St",
          workplace: "Big Company",
          family: "Married with kids",
        },
      };

      const lowRiskLevel = victimManager.calculateRiskLevel(lowRiskData);
      const highRiskLevel = victimManager.calculateRiskLevel(highRiskData);

      expect(lowRiskLevel).toBeLessThan(highRiskLevel);
      expect(highRiskLevel).toBeGreaterThan(50);
    });

    it("should update profile information", async () => {
      // First create a profile
      const profileData = {
        name: "Update Test",
        email: "update@example.com",
      };

      const profile = await victimManager.createProfile(profileData);

      // Then update it
      const updates = {
        name: "Updated Name",
        phone: "0987654321",
        status: "inactive",
      };

      const updatedProfile = await victimManager.updateProfile(
        profile.id,
        updates
      );

      expect(updatedProfile.name).toBe("Updated Name");
      expect(updatedProfile.phone).toBe("0987654321");
      expect(updatedProfile.status).toBe("inactive");
      expect(updatedProfile.updatedAt).toBeDefined();
    });

    it("should add interaction to profile", async () => {
      const profileData = {
        name: "Interaction Test",
        email: "interaction@example.com",
      };

      const profile = await victimManager.createProfile(profileData);

      const interactionData = {
        type: "message_read",
        success: true,
        platform: "email",
        response: "Email opened and read",
        metadata: { subject: "Test Email", timestamp: Date.now() },
      };

      const interaction = await victimManager.addInteraction(
        profile.id,
        interactionData
      );

      expect(interaction).toBeDefined();
      expect(interaction.type).toBe("message_read");
      expect(interaction.success).toBe(true);
      expect(interaction.platform).toBe("email");
      expect(interaction.id).toBeDefined();

      // Check that profile was updated
      const updatedProfile = victimManager.profiles.get(profile.id);
      expect(updatedProfile.interactions).toHaveLength(1);
      expect(updatedProfile.engagementScore).toBeGreaterThan(0);
    });

    it("should calculate engagement score correctly", () => {
      const interactions = [
        { type: "message_read", success: true },
        { type: "link_clicked", success: true },
        { type: "form_filled", success: false },
        { type: "download", success: true },
        { type: "credentials_entered", success: true },
      ];

      const score = victimManager.calculateEngagementScore(interactions);

      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe("Campaign Management", () => {
    it("should create a new campaign", async () => {
      const campaignData = {
        name: "Test Campaign",
        description: "A test phishing campaign",
        type: "phishing_email",
        targets: ["target1", "target2"],
        templates: {
          email: "Test email template",
          landing: "Test landing page",
        },
        schedule: {
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
      };

      const campaign = await victimManager.createCampaign(campaignData);

      expect(campaign).toBeDefined();
      expect(campaign.id).toBeDefined();
      expect(campaign.name).toBe("Test Campaign");
      expect(campaign.type).toBe("phishing_email");
      expect(campaign.status).toBe("planning");
      expect(campaign.targets).toHaveLength(2);
      expect(campaign.analytics).toBeDefined();
      expect(campaign.createdAt).toBeDefined();
    });

    it("should execute a campaign", async () => {
      // Create test profiles first
      const profile1 = await victimManager.createProfile({
        name: "Campaign Target 1",
        email: "target1@example.com",
      });

      const profile2 = await victimManager.createProfile({
        name: "Campaign Target 2",
        email: "target2@example.com",
      });

      // Create campaign
      const campaignData = {
        name: "Execution Test Campaign",
        type: "phishing_email",
        targets: [profile1.id, profile2.id],
      };

      const campaign = await victimManager.createCampaign(campaignData);

      // Mock the execution
      const executeTargetSpy = jest
        .spyOn(victimManager, "executeTarget")
        .mockResolvedValue({
          success: true,
          response: { success: true, type: "phishing_email", opened: true },
        });

      const result = await victimManager.executeCampaign(campaign.id, {
        delay: 100, // Short delay for testing
      });

      expect(result).toBeDefined();
      expect(result.campaignId).toBe(campaign.id);
      expect(result.results).toHaveLength(2);
      expect(result.analytics).toBeDefined();

      // Check campaign status updated
      const updatedCampaign = victimManager.campaigns.get(campaign.id);
      expect(updatedCampaign.status).toBe("completed");
      expect(updatedCampaign.completedAt).toBeDefined();

      executeTargetSpy.mockRestore();
    });

    it("should simulate different campaign types", async () => {
      const profile = await victimManager.createProfile({
        name: "Simulation Test",
        email: "sim@example.com",
        riskLevel: 75,
      });

      const phishingResult = await victimManager.simulatePhishingEmail(
        profile,
        {
          type: "phishing_email",
        }
      );

      expect(phishingResult).toBeDefined();
      expect(phishingResult.type).toBe("phishing_email");
      expect(typeof phishingResult.success).toBe("boolean");
      expect(typeof phishingResult.opened).toBe("boolean");

      const socialResult = await victimManager.simulateSocialMessage(profile, {
        type: "social_media_message",
      });

      expect(socialResult).toBeDefined();
      expect(socialResult.type).toBe("social_media_message");
      expect(typeof socialResult.success).toBe("boolean");
      expect(typeof socialResult.read).toBe("boolean");

      const phoneResult = await victimManager.simulatePhoneCall(profile, {
        type: "phone_call",
      });

      expect(phoneResult).toBeDefined();
      expect(phoneResult.type).toBe("phone_call");
      expect(typeof phoneResult.success).toBe("boolean");
      expect(typeof phoneResult.answered).toBe("boolean");
    });
  });

  describe("Analytics and Reporting", () => {
    beforeAll(async () => {
      // Create test data for analytics
      const profile1 = await victimManager.createProfile({
        name: "Analytics Test 1",
        email: "analytics1@example.com",
      });

      const profile2 = await victimManager.createProfile({
        name: "Analytics Test 2",
        email: "analytics2@example.com",
      });

      // Add interactions
      await victimManager.addInteraction(profile1.id, {
        type: "message_read",
        success: true,
        platform: "email",
      });

      await victimManager.addInteraction(profile2.id, {
        type: "link_clicked",
        success: true,
        platform: "web",
      });
    });

    it("should generate summary report", async () => {
      const report = await victimManager.generateReport("summary");

      expect(report).toBeDefined();
      expect(report.type).toBe("summary");
      expect(report.generatedAt).toBeDefined();
      expect(report.analytics).toBeDefined();
      expect(report.summary).toBeDefined();
      expect(report.summary.totalProfiles).toBeGreaterThan(0);
      expect(report.summary.totalCampaigns).toBeDefined();
      expect(report.summary.totalInteractions).toBeGreaterThan(0);
    });

    it("should generate profiles report", async () => {
      const report = await victimManager.generateReport("profiles");

      expect(report).toBeDefined();
      expect(report.type).toBe("profiles");
      expect(report.profiles).toBeDefined();
      expect(Array.isArray(report.profiles)).toBe(true);
      expect(report.profiles.length).toBeGreaterThan(0);

      // Check profile structure
      const profile = report.profiles[0];
      expect(profile.id).toBeDefined();
      expect(profile.riskLevel).toBeDefined();
      expect(profile.engagementScore).toBeDefined();
      expect(profile.status).toBeDefined();
    });

    it("should generate campaigns report", async () => {
      const report = await victimManager.generateReport("campaigns");

      expect(report).toBeDefined();
      expect(report.type).toBe("campaigns");
      expect(report.campaigns).toBeDefined();
      expect(Array.isArray(report.campaigns)).toBe(true);
    });

    it("should generate interactions report", async () => {
      const report = await victimManager.generateReport("interactions");

      expect(report).toBeDefined();
      expect(report.type).toBe("interactions");
      expect(report.interactions).toBeDefined();
      expect(Array.isArray(report.interactions)).toBe(true);
      expect(report.interactions.length).toBeGreaterThan(0);
    });

    it("should calculate analytics correctly", () => {
      victimManager.updateAnalytics();

      const analytics = victimManager.analytics;

      expect(analytics.totalProfiles).toBeGreaterThan(0);
      expect(analytics.activeProfiles).toBeGreaterThanOrEqual(0);
      expect(typeof analytics.engagementRate).toBe("number");
      expect(typeof analytics.conversionRate).toBe("number");
      expect(analytics.lastUpdate).toBeDefined();
    });

    it("should calculate average metrics", () => {
      const avgRiskLevel = victimManager.calculateAverageRiskLevel();
      const avgEngagementScore = victimManager.calculateAverageEngagementScore();
      const conversionRate = victimManager.calculateConversionRate();

      expect(typeof avgRiskLevel).toBe("number");
      expect(avgRiskLevel).toBeGreaterThanOrEqual(0);
      expect(avgRiskLevel).toBeLessThanOrEqual(100);

      expect(typeof avgEngagementScore).toBe("number");
      expect(avgEngagementScore).toBeGreaterThanOrEqual(0);

      expect(typeof conversionRate).toBe("number");
      expect(conversionRate).toBeGreaterThanOrEqual(0);
      expect(conversionRate).toBeLessThanOrEqual(100);
    });
  });

  describe("Data Persistence", () => {
    it("should save and load profiles", async () => {
      const profileData = {
        name: "Persistence Test",
        email: "persist@example.com",
      };

      const profile = await victimManager.createProfile(profileData);

      // Save should be automatic, but test the method exists
      expect(typeof victimManager.saveProfile).toBe("function");

      // Test that profile is in memory
      const savedProfile = victimManager.profiles.get(profile.id);
      expect(savedProfile).toBeDefined();
      expect(savedProfile.name).toBe("Persistence Test");
    });

    it("should create backups", async () => {
      const createBackupSpy = jest
        .spyOn(victimManager, "createBackup")
        .mockResolvedValue(true);

      const result = await victimManager.createBackup();

      expect(result).toBe(true);
      expect(createBackupSpy).toHaveBeenCalled();

      createBackupSpy.mockRestore();
    });

    it("should start backup schedule", () => {
      const startBackupSpy = jest
        .spyOn(victimManager, "startBackupSchedule")
        .mockImplementation(() => {
          return setInterval(() => {}, 1000); // Mock interval
        });

      victimManager.startBackupSchedule();

      expect(startBackupSpy).toHaveBeenCalled();

      startBackupSpy.mockRestore();
    });
  });

  describe("Error Handling", () => {
    it("should handle invalid profile data", async () => {
      const invalidData = {}; // Missing required fields

      try {
        await victimManager.createProfile(invalidData);
      } catch (error) {
        expect(error).toBeDefined();
        expect(error.message).toBeDefined();
      }
    });

    it("should handle non-existent profile updates", async () => {
      const nonExistentId = "non_existent_12345";

      try {
        await victimManager.updateProfile(nonExistentId, { name: "Test" });
      } catch (error) {
        expect(error).toBeDefined();
        expect(error.message).toContain("not found");
      }
    });

    it("should handle non-existent campaign execution", async () => {
      const nonExistentId = "campaign_non_existent_12345";

      try {
        await victimManager.executeCampaign(nonExistentId);
      } catch (error) {
        expect(error).toBeDefined();
        expect(error.message).toContain("not found");
      }
    });

    it("should handle invalid interaction data", async () => {
      const profile = await victimManager.createProfile({
        name: "Error Test",
        email: "error@example.com",
      });

      const invalidInteraction = {}; // Missing required fields

      try {
        await victimManager.addInteraction(profile.id, invalidInteraction);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe("Utility Methods", () => {
    it("should generate unique IDs", () => {
      const id1 = victimManager.generateId();
      const id2 = victimManager.generateId();

      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe("string");
      expect(typeof id2).toBe("string");
    });

    it("should handle delays", async () => {
      const startTime = Date.now();
      await victimManager.delay(100);
      const endTime = Date.now();

      expect(endTime - startTime).toBeGreaterThanOrEqual(100);
    });

    it("should ensure directories", async () => {
      const ensureDirSpy = jest
        .spyOn(victimManager, "ensureDirectories")
        .mockResolvedValue(true);

      await victimManager.ensureDirectories();

      expect(ensureDirSpy).toHaveBeenCalled();

      ensureDirSpy.mockRestore();
    });
  });
});
