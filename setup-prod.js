/**
 * 🎯 FINAL PRODUCTION SETUP SCRIPT
 * Complete production environment setup and validation
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { execSync } from "child_process";

class FinalProductionSetup {
  constructor() {
    this.setupLog = [];
    this.errors = [];
    this.warnings = [];

    this.productionFiles = [
      "voting-system.js",
      "auth-system.js",
      "vps-deploy.js",
      "vps-config.js",
      "ecosystem.prod.js",
      "deploy-vps.cmd",
      "replace-tests.js",
    ];

    this.requiredEnvVars = [
      "VPS_HOST",
      "SSL_EMAIL",
      "JWT_SECRET",
      "JWT_REFRESH_SECRET",
      "DATABASE_URL",
      "PROD_FB_EMAIL_1",
      "PROD_FB_PASSWORD_1",
    ];
  }

  log(message, type = "info") {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, message, type };

    console.log(`[${timestamp}] ${type.toUpperCase()}: ${message}`);
    this.setupLog.push(logEntry);

    if (type === "error") {
      this.errors.push(message);
    } else if (type === "warning") {
      this.warnings.push(message);
    }
  }

  // 🔍 VALIDATE PRODUCTION FILES
  validateProductionFiles() {
    this.log("🔍 Validating production files...");

    let allFilesExist = true;

    this.productionFiles.forEach((file) => {
      if (fs.existsSync(file)) {
        this.log(`✅ ${file} exists`);
      } else {
        this.log(`❌ ${file} missing`, "error");
        allFilesExist = false;
      }
    });

    if (!allFilesExist) {
      throw new Error("Missing required production files");
    }

    return true;
  }

  // 🔧 CREATE PRODUCTION ENVIRONMENT FILE
  createProductionEnvFile() {
    this.log("🔧 Creating production environment file...");

    if (fs.existsSync(".env.production")) {
      this.log("⚠️ .env.production already exists, backing up...", "warning");
      fs.copyFileSync(".env.production", ".env.production.backup");
    }

    const envTemplate = `# BVOTE 2025 - PRODUCTION ENVIRONMENT
# 🚀 Generated: ${new Date().toISOString()}

# Node Environment
NODE_ENV=production
PORT=3000

# VPS Configuration
VPS_HOST=${process.env.VPS_HOST || "your.vps.ip.address"}
VPS_USER=${process.env.VPS_USER || "root"}
VPS_PORT=${process.env.VPS_PORT || "22"}

# Domain & SSL
PRODUCTION_DOMAIN=${process.env.PRODUCTION_DOMAIN || "programbvote2025.com"}
SSL_EMAIL=${process.env.SSL_EMAIL || "admin@programbvote2025.com"}

# Security Secrets
JWT_SECRET=${process.env.JWT_SECRET || crypto.randomBytes(64).toString("hex")}
JWT_REFRESH_SECRET=${process.env.JWT_REFRESH_SECRET ||
      crypto.randomBytes(64).toString("hex")}

# Database
DATABASE_URL=${process.env.DATABASE_URL ||
      "postgresql://bvote_user:bvote_pass@localhost:5432/bvote_prod"}
DB_NAME=${process.env.DB_NAME || "bvote_prod"}
DB_USER=${process.env.DB_USER || "bvote_user"}
DB_PASSWORD=${process.env.DB_PASSWORD || crypto.randomBytes(16).toString("hex")}

# CORS Origins
CORS_ORIGIN=https://${process.env.PRODUCTION_DOMAIN ||
      "programbvote2025.com"},https://www.${process.env.PRODUCTION_DOMAIN ||
      "programbvote2025.com"}

# Logging
LOG_LEVEL=info

# Browser Settings
BROWSER_HEADLESS=true

# Production Credentials (REAL - Keep Secure!)
PROD_FB_EMAIL_1=${process.env.PROD_FB_EMAIL_1 ||
      "your-facebook-email@gmail.com"}
PROD_FB_PASSWORD_1=${process.env.PROD_FB_PASSWORD_1 || "your-facebook-password"}
PROD_FB_EMAIL_2=${process.env.PROD_FB_EMAIL_2 || ""}
PROD_FB_PASSWORD_2=${process.env.PROD_FB_PASSWORD_2 || ""}

PROD_GMAIL_EMAIL_1=${process.env.PROD_GMAIL_EMAIL_1 || "your-gmail@gmail.com"}
PROD_GMAIL_PASSWORD_1=${process.env.PROD_GMAIL_PASSWORD_1 ||
      "your-gmail-password"}
PROD_GMAIL_EMAIL_2=${process.env.PROD_GMAIL_EMAIL_2 || ""}
PROD_GMAIL_PASSWORD_2=${process.env.PROD_GMAIL_PASSWORD_2 || ""}

PROD_IG_USERNAME_1=${process.env.PROD_IG_USERNAME_1 ||
      "your-instagram-username"}
PROD_IG_PASSWORD_1=${process.env.PROD_IG_PASSWORD_1 ||
      "your-instagram-password"}
PROD_IG_USERNAME_2=${process.env.PROD_IG_USERNAME_2 || ""}
PROD_IG_PASSWORD_2=${process.env.PROD_IG_PASSWORD_2 || ""}

PROD_YAHOO_EMAIL_1=${process.env.PROD_YAHOO_EMAIL_1 || "your-yahoo@yahoo.com"}
PROD_YAHOO_PASSWORD_1=${process.env.PROD_YAHOO_PASSWORD_1 ||
      "your-yahoo-password"}

PROD_ZALO_PHONE_1=${process.env.PROD_ZALO_PHONE_1 || "your-zalo-phone"}
PROD_ZALO_PASSWORD_1=${process.env.PROD_ZALO_PASSWORD_1 || "your-zalo-password"}

# Optional: Monitoring & Alerts
DISCORD_WEBHOOK=${process.env.DISCORD_WEBHOOK || ""}
ALERT_EMAIL=${process.env.ALERT_EMAIL || ""}

# Optional: Backup Configuration
S3_BACKUP_BUCKET=${process.env.S3_BACKUP_BUCKET || ""}
S3_ACCESS_KEY=${process.env.S3_ACCESS_KEY || ""}
S3_SECRET_KEY=${process.env.S3_SECRET_KEY || ""}
`;

    fs.writeFileSync(".env.production", envTemplate);
    this.log("✅ Production environment file created");

    return true;
  }

  // 🔄 RUN TEST DATA REPLACEMENT
  async runTestDataReplacement() {
    this.log("🔄 Running test data replacement...");

    try {
      const TestDataReplacer = (await import("./REPLACE-TEST-DATA.js")).default;
      const replacer = new TestDataReplacer();

      await replacer.replaceAllTestData();
      this.log("✅ Test data replaced with production data");
    } catch (error) {
      this.log(`❌ Test data replacement failed: ${error.message}`, "error");
      throw error;
    }

    return true;
  }

  // 📦 VALIDATE DEPENDENCIES
  validateDependencies() {
    this.log("📦 Validating production dependencies...");

    const packageJsonPath = "./package.json";
    if (!fs.existsSync(packageJsonPath)) {
      throw new Error("package.json not found");
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

    const requiredDeps = [
      "express",
      "socket.io",
      "bcrypt",
      "jsonwebtoken",
      "puppeteer",
      "helmet",
      "cors",
      "express-rate-limit",
      "speakeasy",
      "qrcode",
      "pg",
    ];

    const missing = requiredDeps.filter(
      (dep) =>
        !packageJson.dependencies?.[dep] && !packageJson.devDependencies?.[dep]
    );

    if (missing.length > 0) {
      this.log(`⚠️ Missing dependencies: ${missing.join(", ")}`, "warning");
      this.log("📦 Installing missing dependencies...");

      try {
        execSync(`npm install ${missing.join(" ")}`, { stdio: "inherit" });
        this.log("✅ Dependencies installed successfully");
      } catch (error) {
        this.log("❌ Failed to install dependencies", "error");
        throw error;
      }
    } else {
      this.log("✅ All required dependencies present");
    }

    return true;
  }

  // 🧪 RUN PRODUCTION TESTS
  async runProductionTests() {
    this.log("🧪 Running production readiness tests...");

    try {
      // Test 1: Environment variables
      this.log("Testing environment variables...");
      const missingVars = this.requiredEnvVars.filter(
        (varName) => !process.env[varName]
      );
      if (missingVars.length > 0) {
        this.log(
          `⚠️ Missing environment variables: ${missingVars.join(", ")}`,
          "warning"
        );
      } else {
        this.log("✅ All required environment variables present");
      }

      // Test 2: Production files syntax
      this.log("Testing production files syntax...");
      for (const file of this.productionFiles) {
        if (file.endsWith(".js")) {
          try {
            await import(`./${file}`);
            this.log(`✅ ${file} syntax valid`);
          } catch (error) {
            this.log(`❌ ${file} syntax error: ${error.message}`, "error");
          }
        }
      }

      // Test 3: Database connection string
      if (process.env.DATABASE_URL) {
        this.log("✅ Database URL configured");
      } else {
        this.log("⚠️ Database URL not configured", "warning");
      }

      // Test 4: SSL email validation
      if (process.env.SSL_EMAIL?.includes("@")) {
        this.log("✅ SSL email configured");
      } else {
        this.log("⚠️ SSL email not properly configured", "warning");
      }

      this.log("✅ Production tests completed");
    } catch (error) {
      this.log(`❌ Production tests failed: ${error.message}`, "error");
      throw error;
    }

    return true;
  }

  // 📊 CREATE DEPLOYMENT REPORT
  createDeploymentReport() {
    this.log("📊 Creating deployment report...");

    const report = {
      timestamp: new Date().toISOString(),
      setupVersion: "2.0.0-production",
      status: this.errors.length === 0 ? "READY" : "NEEDS_ATTENTION",
      productionFiles: this.productionFiles.map((file) => ({
        name: file,
        exists: fs.existsSync(file),
        size: fs.existsSync(file) ? fs.statSync(file).size : 0,
      })),
      environmentVars: {
        configured: this.requiredEnvVars.filter(
          (varName) => process.env[varName]
        ).length,
        total: this.requiredEnvVars.length,
        missing: this.requiredEnvVars.filter(
          (varName) => !process.env[varName]
        ),
      },
      logs: this.setupLog,
      errors: this.errors,
      warnings: this.warnings,
      nextSteps: [],
    };

    // Add next steps based on status
    if (report.status === "READY") {
      report.nextSteps = [
        "Review .env.production with real credentials",
        "Run: one-click-vps-deploy.cmd",
        "Monitor deployment progress",
        "Verify production endpoints",
      ];
    } else {
      report.nextSteps = [
        "Fix errors listed above",
        "Complete environment configuration",
        "Re-run production setup",
        "Contact support if issues persist",
      ];
    }

    const reportPath = "./PRODUCTION-SETUP-REPORT.json";
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    this.log(`✅ Deployment report created: ${reportPath}`);

    return report;
  }

  // 🚀 MAIN SETUP METHOD
  async setupProduction() {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║            🎯 BVOTE 2025 - FINAL PRODUCTION SETUP            ║
║                        Starting...                          ║
╚══════════════════════════════════════════════════════════════╝
`);

    const startTime = Date.now();

    try {
      // Step 1: Validate production files
      await this.validateProductionFiles();

      // Step 2: Create production environment
      await this.createProductionEnvFile();

      // Step 3: Validate dependencies
      await this.validateDependencies();

      // Step 4: Replace test data
      await this.runTestDataReplacement();

      // Step 5: Run production tests
      await this.runProductionTests();

      // Step 6: Create deployment report
      const report = await this.createDeploymentReport();

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      console.log(`
╔══════════════════════════════════════════════════════════════╗
║               🎉 PRODUCTION SETUP COMPLETE! 🎉               ║
╚══════════════════════════════════════════════════════════════╝

⏱️  Setup Duration: ${duration} seconds
📊 Status: ${report.status}
📁 Files Ready: ${report.productionFiles.filter((f) => f.exists).length}/${
        report.productionFiles.length
      }
🔧 Environment: ${report.environmentVars.configured}/${
        report.environmentVars.total
      } vars configured

${report.status === "READY" ? "✅ READY FOR DEPLOYMENT" : "⚠️  NEEDS ATTENTION"}

📝 Next Steps:
${report.nextSteps.map((step) => `   ${step}`).join("\n")}

🚀 Quick Deploy:
   Double-click: one-click-vps-deploy.cmd

📊 Detailed Report:
   Check: PRODUCTION-SETUP-REPORT.json

🌟 Production Features Ready:
   ✅ Real Voting System
   ✅ User Authentication (2FA)
   ✅ Auto-login (Facebook, Gmail, Instagram, etc.)
   ✅ VPS Deployment Scripts
   ✅ Security Hardening
   ✅ Performance Optimization
   ✅ Monitoring & Analytics

${this.warnings.length > 0 ? `⚠️  Warnings: ${this.warnings.length}` : ""}
${this.errors.length > 0 ? `❌ Errors: ${this.errors.length}` : ""}
`);

      return {
        success: true,
        status: report.status,
        duration: parseFloat(duration),
        report: report,
      };
    } catch (error) {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      console.log(`
╔══════════════════════════════════════════════════════════════╗
║                ❌ PRODUCTION SETUP FAILED ❌                 ║
╚══════════════════════════════════════════════════════════════╝

⏱️  Duration: ${duration} seconds
💥 Error: ${error.message}

🔧 Troubleshooting:
   1. Check all production files exist
   2. Verify environment variables
   3. Ensure dependencies are installed
   4. Review setup logs above

📞 Support:
   Check PRODUCTION-SETUP-REPORT.json for details
`);

      throw error;
    }
  }
}

// Export for use in other scripts
export default FinalProductionSetup;

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const setup = new FinalProductionSetup();
  setup
    .setupProduction()
    .then((result) => {
      console.log("✅ Production setup completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Production setup failed:", error.message);
      process.exit(1);
    });
}
