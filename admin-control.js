/**
 * Admin Intervention System
 * Xử lý can thiệp từ Admin khi cần 2FA/OTP
 */

const SessionManager = require("./session-manager.js");
const readline = require("readline");

class AdminIntervention {
  constructor() {
    this.sessionManager = new SessionManager();
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    this.setupEventListeners();
    console.log("👨‍💼 Admin Intervention System ready");
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    this.sessionManager.on("status_update", (update) => {
      if (update.status === "waiting_user_action") {
        this.handleInterventionRequired(update);
      }
    });
  }

  /**
   * Xử lý khi cần can thiệp
   */
  async handleInterventionRequired(update) {
    console.log(`\n⚠️ INTERVENTION REQUIRED for ${update.accountId}`);
    console.log(`Platform: ${update.platform}`);
    console.log(`Message: ${update.message}`);
    console.log(`Current URL: ${update.currentUrl}`);

    if (update.currentUrl.includes("two_step_verification")) {
      await this.handle2FAIntervention(update);
    } else {
      await this.handleGenericIntervention(update);
    }
  }

  /**
   * Xử lý 2FA intervention
   */
  async handle2FAIntervention(update) {
    console.log(`\n🔐 2FA Required for ${update.accountId}`);
    console.log("Options:");
    console.log("1. Enter 2FA code");
    console.log("2. Skip this account");
    console.log("3. Close session");

    const choice = await this.askQuestion("Choose option (1-3): ");

    switch (choice) {
      case "1":
        const code = await this.askQuestion("Enter 2FA code: ");
        await this.submit2FACode(update.sessionId, code);
        break;
      case "2":
        console.log(`⏭️ Skipping ${update.accountId}`);
        break;
      case "3":
        await this.sessionManager.forceCloseSession(update.accountId);
        console.log(`🔒 Session closed for ${update.accountId}`);
        break;
      default:
        console.log("Invalid option");
    }
  }

  /**
   * Submit 2FA code
   */
  async submit2FACode(sessionId, code) {
    try {
      // Tìm session bằng sessionId
      const session = Array.from(
        this.sessionManager.activeSessions.values()
      ).find((s) => s.id === sessionId);

      if (!session || !session.page) {
        throw new Error("Session not found or page closed");
      }

      console.log(`🔢 Submitting 2FA code for ${session.accountId}`);

      // Tìm input field cho 2FA code
      const codeInput =
        (await session.page.$('input[name="approvals_code"]')) ||
        (await session.page.$('input[id*="code"]')) ||
        (await session.page.$('input[type="text"]'));

      if (codeInput) {
        await codeInput.type(code);

        // Tìm submit button
        const submitBtn =
          (await session.page.$('button[type="submit"]')) ||
          (await session.page.$('button[name="submit"]')) ||
          (await session.page.$("#checkpointSubmitButton"));

        if (submitBtn) {
          await submitBtn.click();

          // Wait for navigation
          await session.page.waitForNavigation({ timeout: 15000 });

          const newUrl = await session.page.url();
          session.currentUrl = newUrl;

          // Kiểm tra có về trang chủ
          if (this.sessionManager.isValidHomeUrl(newUrl, session.platform)) {
            session.homeUrl = newUrl;
            session.status = "success";
            session.lastActivity = Date.now();

            this.sessionManager.emitStatusUpdate(
              session,
              "success",
              "2FA completed, login successful"
            );
            console.log(
              `✅ 2FA completed successfully for ${session.accountId}`
            );

            // Duy trì phiên
            await this.sessionManager.maintainSession(session);
          } else {
            console.log(
              `⚠️ 2FA submitted but still need verification for ${session.accountId}`
            );
            this.sessionManager.emitStatusUpdate(
              session,
              "waiting_user_action",
              "Additional verification required"
            );
          }
        }
      }
    } catch (error) {
      console.error(`❌ 2FA submission failed:`, error);
      this.sessionManager.emitStatusUpdate(
        session,
        "failed",
        `2FA submission failed: ${error.message}`
      );
    }
  }

  /**
   * Generic intervention handler
   */
  async handleGenericIntervention(update) {
    console.log(`\n🛠️ Generic Intervention for ${update.accountId}`);
    console.log("Session is maintained. Admin can:");
    console.log("1. Manual browser intervention");
    console.log("2. Close session");

    const choice = await this.askQuestion("Choose option (1-2): ");

    if (choice === "2") {
      await this.sessionManager.forceCloseSession(update.accountId);
      console.log(`🔒 Session closed for ${update.accountId}`);
    } else {
      console.log(`🖱️ Manual intervention mode for ${update.accountId}`);
      console.log("Browser window remains open for manual intervention...");
    }
  }

  /**
   * Helper to ask questions
   */
  askQuestion(question) {
    return new Promise((resolve) => {
      this.rl.question(question, (answer) => {
        resolve(answer.trim());
      });
    });
  }

  /**
   * Start interactive session
   */
  async startInteractiveSession() {
    console.log(`
👨‍💼 Admin Intervention System

Available commands:
- start <accountId> <platform> <email> <password>  # Start auto login
- status <accountId>                               # Check session status
- close <accountId>                                # Close session
- list                                             # List all sessions
- help                                             # Show this help
- exit                                             # Exit system

Examples:
  start user1 facebook email@gmail.com password123
  status user1
  close user1
    `);

    while (true) {
      const input = await this.askQuestion("\n👨‍💼 Admin> ");
      const [command, ...args] = input.split(" ");

      try {
        await this.executeCommand(command, args);
      } catch (error) {
        console.error(`❌ Command failed: ${error.message}`);
      }

      if (command === "exit") break;
    }

    this.rl.close();
  }

  /**
   * Execute admin commands
   */
  async executeCommand(command, args) {
    switch (command) {
      case "start":
        if (args.length < 4) {
          console.log("Usage: start <accountId> <platform> <email> <password>");
          return;
        }

        const [accountId, platform, email, password] = args;
        const credentials =
          platform === "instagram"
            ? { username: email, password }
            : { email, password };

        const result = await this.sessionManager.startAutoLogin(
          accountId,
          platform,
          credentials
        );
        console.log(`Result: ${JSON.stringify(result, null, 2)}`);
        break;

      case "status":
        if (args.length < 1) {
          console.log("Usage: status <accountId>");
          return;
        }

        const info = this.sessionManager.getSessionInfo(args[0]);
        if (info) {
          console.log(`Session Info: ${JSON.stringify(info, null, 2)}`);
        } else {
          console.log(`No active session for ${args[0]}`);
        }
        break;

      case "close":
        if (args.length < 1) {
          console.log("Usage: close <accountId>");
          return;
        }

        await this.sessionManager.forceCloseSession(args[0]);
        console.log(`Session closed for ${args[0]}`);
        break;

      case "list":
        const sessions = this.sessionManager.getAllSessions();
        if (sessions.length === 0) {
          console.log("No active sessions");
        } else {
          console.log("Active Sessions:");
          sessions.forEach((session) => {
            console.log(
              `  ${session.accountId} (${session.platform}): ${session.status}`
            );
          });
        }
        break;

      case "help":
        console.log(`
Available commands:
- start <accountId> <platform> <email> <password>
- status <accountId>
- close <accountId>
- list
- exit
        `);
        break;

      case "exit":
        console.log("👋 Exiting Admin Intervention System");
        break;

      default:
        console.log(
          `Unknown command: ${command}. Type 'help' for available commands.`
        );
    }
  }
}

// Run if called directly
if (require.main === module) {
  const admin = new AdminIntervention();
  admin.startInteractiveSession().catch(console.error);
}

module.exports = AdminIntervention;
