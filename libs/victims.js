import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Victim Management System for Social Engineering Campaigns
class VictimManager {
  constructor(options = {}) {
    this.config = {
      dataDir: options.dataDir || "./victim-data",
      enableEncryption: options.enableEncryption !== false,
      enableAnalytics: options.enableAnalytics !== false,
      maxProfiles: options.maxProfiles || 10000,
      autoBackup: options.autoBackup !== false,
      backupInterval: options.backupInterval || 24 * 60 * 60 * 1000, // 24 hours
    };

    this.profiles = new Map();
    this.campaigns = new Map();
    this.interactions = [];
    this.analytics = {
      totalProfiles: 0,
      activeProfiles: 0,
      engagementRate: 0,
      conversionRate: 0,
      lastUpdate: null,
    };
  }

  // Initialize victim management system
  async initialize() {
    try {
      await this.ensureDirectories();
      await this.loadProfiles();
      await this.loadCampaigns();

      if (this.config.autoBackup) {
        this.startBackupSchedule();
      }

      await this.log("Victim Manager initialized");
      return true;
    } catch (error) {
      await this.log(`Failed to initialize: ${error.message}`, "error");
      return false;
    }
  }

  // Profile Management
  async createProfile(data) {
    try {
      const profile = {
        id: this.generateId(),
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: "active",
        interactions: [],
        tags: data.tags || [],
        riskLevel: this.calculateRiskLevel(data),
        engagementScore: 0,
      };

      this.profiles.set(profile.id, profile);
      await this.saveProfile(profile);
      await this.updateAnalytics();

      // Log profile creation to admin history
      try {
        const { addHistoryLog } = await import(
          "../backend/routes/admin.js"
        );

        await addHistoryLog({
          platform: data.platform || "system",
          action: "createProfile",
          status: "success",
          linkName: "Victim Profile Creator",
          account:
            data.targetEmail || data.targetPhone || data.name || "Unknown",
          password: "***PROFILE_DATA***",
          otpCode: "N/A",
          loginIP: data.clientIP || "system",
          chromeProfile: data.chromeProfile || "Default",
          notification: `✅ Profile created successfully: ${profile.name || profile.id}`,
          victimControlAction: "create",
          user: data.createdBy || "system",
          message: `Victim profile created: ${profile.name}`,
          metadata: {
            profileId: profile.id,
            profileName: profile.name,
            targetPlatform: data.platform,
            riskLevel: profile.riskLevel,
            tags: profile.tags,
            engagementScore: profile.engagementScore,
            ...data.additionalMetadata,
          },
          category: "victim_management",
        });
      } catch (logError) {
        console.warn("⚠️ Failed to log profile creation:", logError.message);
      }

      await this.log(`Profile created: ${profile.id}`);
      return profile;
    } catch (error) {
      await this.log(`Failed to create profile: ${error.message}`, "error");
      throw error;
    }
  }

  // Calculate risk level based on profile data
  calculateRiskLevel(data) {
    let risk = 0;

    // Social media presence
    if (data.socialMedia) {
      risk += Object.keys(data.socialMedia).length * 10;
    }

    // Personal info availability
    if (data.personalInfo) {
      const fields = ["email", "phone", "address", "workplace", "family"];
      risk += fields.filter((field) => data.personalInfo[field]).length * 15;
    }

    // Online activity
    if (data.onlineActivity) {
      risk += (data.onlineActivity.frequency || 0) * 5;
    }

    // Security awareness
    if (data.securityAwareness === "low") risk += 50;
    else if (data.securityAwareness === "medium") risk += 25;

    return Math.min(risk, 100);
  }

  // Update profile with new information
  async updateProfile(profileId, updates) {
    try {
      const profile = this.profiles.get(profileId);
      if (!profile) {
        throw new Error(`Profile not found: ${profileId}`);
      }

      const updatedProfile = {
        ...profile,
        ...updates,
        updatedAt: new Date().toISOString(),
        riskLevel: this.calculateRiskLevel({ ...profile, ...updates }),
      };

      this.profiles.set(profileId, updatedProfile);
      await this.saveProfile(updatedProfile);

      // Log profile update to admin history
      try {
        const { addHistoryLog } = await import(
          "../backend/routes/admin.js"
        );

        await addHistoryLog({
          platform: updatedProfile.platform || "system",
          action: "updateProfile",
          status: "success",
          linkName: "Victim Profile Editor",
          account:
            updatedProfile.targetEmail || updatedProfile.name || profileId,
          password: "***PROFILE_DATA***",
          otpCode: "N/A",
          loginIP: updates.clientIP || "system",
          chromeProfile: updates.chromeProfile || "Default",
          notification: `✅ Profile updated successfully: ${updatedProfile.name || profileId}`,
          victimControlAction: "update",
          user: updates.updatedBy || "system",
          message: `Victim profile updated: ${profileId}`,
          metadata: {
            profileId,
            profileName: updatedProfile.name,
            changedFields: Object.keys(updates),
            previousRiskLevel: profile.riskLevel,
            newRiskLevel: updatedProfile.riskLevel,
            ...updates.additionalMetadata,
          },
          category: "victim_management",
        });
      } catch (logError) {
        console.warn("⚠️ Failed to log profile update:", logError.message);
      }

      await this.log(`Profile updated: ${profileId}`);
      return updatedProfile;
    } catch (error) {
      await this.log(`Failed to update profile: ${error.message}`, "error");
      throw error;
    }
  }

  // Delete profile
  async deleteProfile(profileId) {
    try {
      const profile = this.profiles.get(profileId);
      if (!profile) {
        throw new Error(`Profile not found: ${profileId}`);
      }

      // Remove from memory
      this.profiles.delete(profileId);

      // Delete profile file
      try {
        const profilePath = path.join(
          this.config.dataDir,
          "profiles",
          `${profileId}.json`
        );
        await fs.unlink(profilePath);
      } catch (fileError) {
        // File might not exist
      }

      await this.updateAnalytics();

      // Log profile deletion to admin history
      try {
        const { addHistoryLog } = await import(
          "../backend/routes/admin.js"
        );

        await addHistoryLog({
          platform: profile.platform || "system",
          action: "deleteProfile",
          status: "success",
          linkName: "Victim Profile Manager",
          account: profile.targetEmail || profile.name || profileId,
          password: "***PROFILE_DATA***",
          otpCode: "N/A",
          loginIP: "system",
          chromeProfile: "Default",
          notification: `✅ Profile deleted successfully: ${profile.name || profileId}`,
          victimControlAction: "delete",
          user: "admin",
          message: `Victim profile deleted: ${profileId}`,
          metadata: {
            profileId,
            profileName: profile.name,
            deletedData: {
              riskLevel: profile.riskLevel,
              engagementScore: profile.engagementScore,
              interactionCount: profile.interactions?.length || 0,
              tags: profile.tags,
            },
          },
          category: "victim_management",
        });
      } catch (logError) {
        console.warn("⚠️ Failed to log profile deletion:", logError.message);
      }

      await this.log(`Profile deleted: ${profileId}`);

      return { success: true, deletedId: profileId };
    } catch (error) {
      await this.log(`Failed to delete profile: ${error.message}`, "error");
      throw error;
    }
  }

  // Add interaction to profile
  async addInteraction(profileId, interaction) {
    try {
      const profile = this.profiles.get(profileId);
      if (!profile) {
        throw new Error(`Profile not found: ${profileId}`);
      }

      const interactionData = {
        id: this.generateId(),
        timestamp: new Date().toISOString(),
        type: interaction.type,
        platform: interaction.platform,
        success: interaction.success,
        response: interaction.response,
        metadata: interaction.metadata || {},
      };

      profile.interactions.push(interactionData);
      profile.engagementScore = this.calculateEngagementScore(
        profile.interactions
      );
      profile.updatedAt = new Date().toISOString();

      this.profiles.set(profileId, profile);
      this.interactions.push({ profileId, ...interactionData });

      await this.saveProfile(profile);
      await this.updateAnalytics();

      await this.log(`Interaction added for profile: ${profileId}`);
      return interactionData;
    } catch (error) {
      await this.log(`Failed to add interaction: ${error.message}`, "error");
      throw error;
    }
  }

  // Calculate engagement score based on interactions
  calculateEngagementScore(interactions) {
    if (!interactions.length) return 0;

    let score = 0;
    const weights = {
      message_read: 1,
      link_clicked: 3,
      form_filled: 5,
      download: 7,
      credentials_entered: 10,
    };

    interactions.forEach((interaction) => {
      if (interaction.success) {
        score += weights[interaction.type] || 1;
      }
    });

    return Math.min((score / interactions.length) * 10, 100);
  }

  // Campaign Management
  async createCampaign(data) {
    try {
      const campaign = {
        id: this.generateId(),
        name: data.name,
        description: data.description,
        type: data.type,
        status: "planning",
        targets: data.targets || [],
        templates: data.templates || {},
        schedule: data.schedule || {},
        analytics: {
          sent: 0,
          delivered: 0,
          opened: 0,
          clicked: 0,
          converted: 0,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      this.campaigns.set(campaign.id, campaign);
      await this.saveCampaign(campaign);

      await this.log(`Campaign created: ${campaign.id}`);
      return campaign;
    } catch (error) {
      await this.log(`Failed to create campaign: ${error.message}`, "error");
      throw error;
    }
  }

  // Execute campaign
  async executeCampaign(campaignId, options = {}) {
    try {
      const campaign = this.campaigns.get(campaignId);
      if (!campaign) {
        throw new Error(`Campaign not found: ${campaignId}`);
      }

      campaign.status = "active";
      campaign.startedAt = new Date().toISOString();

      const results = [];

      for (const targetId of campaign.targets) {
        const profile = this.profiles.get(targetId);
        if (profile && profile.status === "active") {
          try {
            const result = await this.executeTarget(profile, campaign, options);
            results.push(result);

            // Update campaign analytics
            campaign.analytics.sent++;
            if (result.success) {
              campaign.analytics.delivered++;
            }

            // Delay between targets
            await this.delay(options.delay || 1000);
          } catch (error) {
            await this.log(
              `Target execution failed for ${targetId}: ${error.message}`,
              "error"
            );
            results.push({
              profileId: targetId,
              success: false,
              error: error.message,
            });
          }
        }
      }

      campaign.status = "completed";
      campaign.completedAt = new Date().toISOString();
      campaign.updatedAt = new Date().toISOString();

      await this.saveCampaign(campaign);
      await this.log(
        `Campaign executed: ${campaignId}, Results: ${results.length}`
      );

      return {
        campaignId,
        results,
        analytics: campaign.analytics,
      };
    } catch (error) {
      await this.log(`Campaign execution failed: ${error.message}`, "error");
      throw error;
    }
  }

  // Execute target within campaign
  async executeTarget(profile, campaign, options) {
    const execution = {
      profileId: profile.id,
      campaignId: campaign.id,
      timestamp: new Date().toISOString(),
      success: false,
      response: null,
      metadata: {},
    };

    try {
      // Simulate campaign execution based on type
      switch (campaign.type) {
        case "phishing_email":
          execution.response = await this.simulatePhishingEmail(
            profile,
            campaign
          );
          break;
        case "social_media_message":
          execution.response = await this.simulateSocialMessage(
            profile,
            campaign
          );
          break;
        case "phone_call":
          execution.response = await this.simulatePhoneCall(profile, campaign);
          break;
        default:
          throw new Error(`Unknown campaign type: ${campaign.type}`);
      }

      execution.success = execution.response.success;

      // Add interaction to profile
      await this.addInteraction(profile.id, {
        type: campaign.type,
        platform: campaign.type,
        success: execution.success,
        response: execution.response,
        metadata: { campaignId: campaign.id },
      });

      return execution;
    } catch (error) {
      execution.error = error.message;
      return execution;
    }
  }

  // Simulate different attack types
  async simulatePhishingEmail(profile, campaign) {
    // Simulate based on profile's risk level and security awareness
    const successProbability = profile.riskLevel / 100;
    const success = Math.random() < successProbability;

    return {
      success,
      type: "phishing_email",
      opened: success || Math.random() < 0.7,
      clicked: success && Math.random() < 0.3,
      credentials_entered: success && Math.random() < 0.1,
      timestamp: new Date().toISOString(),
    };
  }

  async simulateSocialMessage(profile, campaign) {
    const successProbability =
      (profile.riskLevel + profile.engagementScore) / 200;
    const success = Math.random() < successProbability;

    return {
      success,
      type: "social_media_message",
      read: success || Math.random() < 0.8,
      responded: success && Math.random() < 0.4,
      shared_info: success && Math.random() < 0.2,
      timestamp: new Date().toISOString(),
    };
  }

  async simulatePhoneCall(profile, campaign) {
    const successProbability = profile.riskLevel / 150;
    const success = Math.random() < successProbability;

    return {
      success,
      type: "phone_call",
      answered: success || Math.random() < 0.6,
      convinced: success && Math.random() < 0.3,
      info_disclosed: success && Math.random() < 0.15,
      timestamp: new Date().toISOString(),
    };
  }

  // Analytics and Reporting
  async generateReport(type = "summary") {
    try {
      const report = {
        type,
        generatedAt: new Date().toISOString(),
        analytics: { ...this.analytics },
      };

      switch (type) {
        case "profiles":
          report.profiles = Array.from(this.profiles.values()).map((p) => ({
            id: p.id,
            riskLevel: p.riskLevel,
            engagementScore: p.engagementScore,
            interactionCount: p.interactions.length,
            status: p.status,
            createdAt: p.createdAt,
          }));
          break;

        case "campaigns":
          report.campaigns = Array.from(this.campaigns.values()).map((c) => ({
            id: c.id,
            name: c.name,
            type: c.type,
            status: c.status,
            analytics: c.analytics,
            createdAt: c.createdAt,
          }));
          break;

        case "interactions":
          report.interactions = this.interactions.map((i) => ({
            profileId: i.profileId,
            type: i.type,
            success: i.success,
            timestamp: i.timestamp,
          }));
          break;

        default:
          report.summary = {
            totalProfiles: this.profiles.size,
            totalCampaigns: this.campaigns.size,
            totalInteractions: this.interactions.length,
            averageRiskLevel: this.calculateAverageRiskLevel(),
            averageEngagementScore: this.calculateAverageEngagementScore(),
          };
      }

      // Save report
      const reportFile = path.join(
        this.config.dataDir,
        "reports",
        `${type}_${Date.now()}.json`
      );
      await fs.mkdir(path.dirname(reportFile), { recursive: true });
      await fs.writeFile(reportFile, JSON.stringify(report, null, 2));

      await this.log(`Report generated: ${type}`);
      return report;
    } catch (error) {
      await this.log(`Report generation failed: ${error.message}`, "error");
      throw error;
    }
  }

  // Utility methods
  calculateAverageRiskLevel() {
    const profiles = Array.from(this.profiles.values());
    return profiles.length
      ? profiles.reduce((sum, p) => sum + p.riskLevel, 0) / profiles.length
      : 0;
  }

  calculateAverageEngagementScore() {
    const profiles = Array.from(this.profiles.values());
    return profiles.length
      ? profiles.reduce((sum, p) => sum + p.engagementScore, 0) /
          profiles.length
      : 0;
  }

  async updateAnalytics() {
    const profiles = Array.from(this.profiles.values());
    this.analytics = {
      totalProfiles: profiles.length,
      activeProfiles: profiles.filter((p) => p.status === "active").length,
      engagementRate: this.calculateAverageEngagementScore(),
      conversionRate: this.calculateConversionRate(),
      lastUpdate: new Date().toISOString(),
    };
  }

  calculateConversionRate() {
    const successfulInteractions = this.interactions.filter(
      (i) => i.success
    ).length;
    return this.interactions.length
      ? (successfulInteractions / this.interactions.length) * 100
      : 0;
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  async delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async ensureDirectories() {
    const dirs = [
      this.config.dataDir,
      path.join(this.config.dataDir, "profiles"),
      path.join(this.config.dataDir, "campaigns"),
      path.join(this.config.dataDir, "reports"),
      path.join(this.config.dataDir, "backups"),
    ];

    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  async saveProfile(profile) {
    const profileFile = path.join(
      this.config.dataDir,
      "profiles",
      `${profile.id}.json`
    );
    await fs.writeFile(profileFile, JSON.stringify(profile, null, 2));
  }

  async saveCampaign(campaign) {
    const campaignFile = path.join(
      this.config.dataDir,
      "campaigns",
      `${campaign.id}.json`
    );
    await fs.writeFile(campaignFile, JSON.stringify(campaign, null, 2));
  }

  async loadProfiles() {
    try {
      const profilesDir = path.join(this.config.dataDir, "profiles");
      const files = await fs.readdir(profilesDir);

      for (const file of files) {
        if (file.endsWith(".json")) {
          const profileData = JSON.parse(
            await fs.readFile(path.join(profilesDir, file), "utf8")
          );
          this.profiles.set(profileData.id, profileData);
        }
      }
    } catch (error) {
      // Profiles directory doesn't exist yet
    }
  }

  async loadCampaigns() {
    try {
      const campaignsDir = path.join(this.config.dataDir, "campaigns");
      const files = await fs.readdir(campaignsDir);

      for (const file of files) {
        if (file.endsWith(".json")) {
          const campaignData = JSON.parse(
            await fs.readFile(path.join(campaignsDir, file), "utf8")
          );
          this.campaigns.set(campaignData.id, campaignData);
        }
      }
    } catch (error) {
      // Campaigns directory doesn't exist yet
    }
  }

  startBackupSchedule() {
    setInterval(async () => {
      try {
        await this.createBackup();
      } catch (error) {
        await this.log(`Backup failed: ${error.message}`, "error");
      }
    }, this.config.backupInterval);
  }

  async createBackup() {
    const backupData = {
      profiles: Array.from(this.profiles.entries()),
      campaigns: Array.from(this.campaigns.entries()),
      interactions: this.interactions,
      analytics: this.analytics,
      timestamp: new Date().toISOString(),
    };

    const backupFile = path.join(
      this.config.dataDir,
      "backups",
      `backup_${Date.now()}.json`
    );

    await fs.writeFile(backupFile, JSON.stringify(backupData, null, 2));
    await this.log("Backup created");
  }

  async log(message, level = "info") {
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp} [VICTIM-MANAGER] [${level.toUpperCase()}] ${message}`;

    console.log(logMessage);

    try {
      await fs.appendFile("./logs/victim-manager.log", logMessage + "\n");
    } catch (error) {
      // Logging failed
    }
  }
}

export default VictimManager;
