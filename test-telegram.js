/**
 * Test Telegram Integration - BVOTE 2025
 */

import TelegramService from "./backend/services/TelegramService.js";

console.log("🧪 Testing Telegram Integration...\n");

// Test connection
async function testTelegram() {
  try {
    console.log("📱 Testing Telegram connection...");
    const result = await TelegramService.testConnection();

    if (result.success) {
      console.log("✅ Telegram test successful!");

      // Test different message types
      console.log("\n📊 Testing different notification types...");

      // Test error notification
      await TelegramService.sendError(
        new Error("Test error message"),
        "Testing system"
      );

      // Test voting alert
      await TelegramService.sendVotingAlert({
        user: "test_user",
        action: "Vote Cast",
        contest: "Miss Beauty 2025",
        ip: "192.168.1.100",
        details: "Test voting notification",
      });

      // Test admin alert
      await TelegramService.sendAdminAlert({
        admin: "admin_user",
        action: "User Management",
        target: "test_user",
        ip: "192.168.1.101",
        details: "Test admin action notification",
      });

      // Test security alert
      await TelegramService.sendSecurityAlert({
        threat: "Multiple failed login attempts",
        ip: "192.168.1.102",
        details: "5 failed attempts in 1 minute",
        action: "IP temporarily blocked",
      });

      // Test daily summary
      await TelegramService.sendDailySummary({
        totalVotes: 150,
        activeUsers: 45,
        newUsers: 12,
        apiRequests: 2500,
        errors: 3,
        uptime: "99.9%",
      });

      console.log("\n🎉 All Telegram tests completed!");
      console.log("📱 Check your Telegram chat for the test messages.");
    } else {
      console.log("❌ Telegram test failed:", result.message);
    }
  } catch (error) {
    console.error("❌ Test error:", error.message);
  }
}

testTelegram();
