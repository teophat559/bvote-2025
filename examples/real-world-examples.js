#!/usr/bin/env node

/**
 * Real-World Social Media Automation Examples
 *
 * This file contains practical, real-world examples of how to use
 * the social media login automation system for common tasks.
 *
 * ⚠️ IMPORTANT: Update credentials and respect platform Terms of Service
 */

import AutoLogin from "../libs/auto-login.js";
import ZaloLogin from "../libs/zalo-login.js";
import GmailLogin from "../libs/gmail-login.js";
import InstagramLogin from "../libs/instagram-login.js";
import FacebookLogin from "../libs/login_facebook.js";
import { SOCIAL_LOGIN_CONFIG } from "../config/social-login-config.js";

// ==========================================
// EXAMPLE 1: Customer Support Automation
// ==========================================

async function example1_customerSupportBot() {
  console.log("\n🤖 === Customer Support Bot Example ===");

  try {
    const autoLogin = new AutoLogin();
    await autoLogin.initialize("customer-support");

    // Login to multiple platforms for customer support
    const supportAccounts = [
      {
        platform: "facebook",
        credentials: {
          email: process.env.SUPPORT_FB_EMAIL,
          password: process.env.SUPPORT_FB_PASSWORD,
        },
      },
      {
        platform: "zalo",
        credentials: {
          phone: process.env.SUPPORT_ZALO_PHONE,
          password: process.env.SUPPORT_ZALO_PASSWORD,
        },
      },
    ];

    console.log("Logging into support platforms...");
    const loginResults = await autoLogin.batchLogin(supportAccounts, {
      concurrent: false,
      delay: 3000,
    });

    // Check successful logins
    const successfulLogins = loginResults.filter((r) => r.success);
    console.log(
      `✅ Logged into ${successfulLogins.length}/${loginResults.length} platforms`
    );

    // Automated responses to common inquiries
    const commonResponses = {
      "giá cả":
        "Chào bạn! Bảng giá sản phẩm của chúng tôi: [link]. Bạn có cần tư vấn thêm không?",
      "giao hàng":
        "Thời gian giao hàng thường là 2-3 ngày làm việc. Bạn ở khu vực nào ạ?",
      "bảo hành":
        "Sản phẩm được bảo hành 12 tháng. Bạn cần hỗ trợ gì về bảo hành không?",
      "thanh toán":
        "Chúng tôi hỗ trợ thanh toán COD, chuyển khoản, và ví điện tử. Bạn muốn dùng phương thức nào?",
    };

    // Monitor and respond (this would be part of a larger monitoring system)
    console.log("📢 Customer support bot ready. Monitoring messages...");

    // Example: Send a proactive message
    if (autoLogin.getSession("zalo")) {
      const proactiveResult = await autoLogin.performAction(
        "zalo",
        "sendMessage",
        {
          recipient: "customer_name",
          message:
            "Chào bạn! Cảm ơn bạn đã liên hệ với chúng tôi. Chúng tôi sẽ hỗ trợ bạn ngay.",
        }
      );

      if (proactiveResult.success) {
        console.log("✅ Proactive customer message sent");
      }
    }

    await autoLogin.saveAllSessions();
    return { success: true, activePlatforms: successfulLogins.length };
  } catch (error) {
    console.error("❌ Customer support bot error:", error.message);
    return { success: false, error: error.message };
  }
}

// ==========================================
// EXAMPLE 2: Social Media Marketing Campaign
// ==========================================

async function example2_marketingCampaign() {
  console.log("\n📢 === Marketing Campaign Example ===");

  try {
    const campaign = {
      message:
        "🎉 Flash Sale hôm nay! Giảm giá 50% tất cả sản phẩm. Nhanh tay đặt hàng!",
      hashtags: "#FlashSale #GiamGia #MuaNgay",
      targetAudience: ["followers", "groups", "pages"],
    };

    // Instagram marketing
    const instagram = new InstagramLogin({
      headless: true,
      screenshots: false,
    });

    await instagram.initialize();

    const igLogin = await instagram.login({
      username: process.env.MARKETING_IG_USER,
      password: process.env.MARKETING_IG_PASS,
    });

    if (igLogin.success) {
      console.log("✅ Instagram marketing account ready");

      // Post campaign image (you would provide a real image)
      // const postResult = await instagram.postPhoto("./campaign-image.jpg",
      //   `${campaign.message} ${campaign.hashtags}`);

      // Follow target users for engagement
      const targetUsers = ["user1", "user2", "user3"];

      for (const user of targetUsers) {
        const followResult = await instagram.followUser(user);
        console.log(`📱 Follow ${user}: ${followResult.success ? "✅" : "❌"}`);

        // Add delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }

    // Facebook marketing
    const facebook = new FacebookLogin({
      headless: true,
      screenshots: false,
    });

    await facebook.initialize();

    const fbLogin = await facebook.login({
      email: process.env.MARKETING_FB_EMAIL,
      password: process.env.MARKETING_FB_PASS,
    });

    if (fbLogin.success) {
      console.log("✅ Facebook marketing account ready");

      // Post campaign status
      const statusResult = await facebook.postStatus(
        `${campaign.message} ${campaign.hashtags}`
      );

      if (statusResult.success) {
        console.log("✅ Facebook campaign post published");
      }
    }

    await instagram.close();
    await facebook.close();

    return { success: true, campaign: campaign.message };
  } catch (error) {
    console.error("❌ Marketing campaign error:", error.message);
    return { success: false, error: error.message };
  }
}

// ==========================================
// EXAMPLE 3: Email Newsletter Automation
// ==========================================

async function example3_emailNewsletter() {
  console.log("\n📧 === Email Newsletter Example ===");

  try {
    const gmail = new GmailLogin({
      headless: true,
      screenshots: false,
      timeout: 60000,
    });

    await gmail.initialize();

    // Login with app password (recommended for Gmail)
    const loginResult = await gmail.login({
      email: process.env.NEWSLETTER_EMAIL,
      appPassword: process.env.NEWSLETTER_APP_PASSWORD, // Use App Password, not regular password
    });

    if (!loginResult.success) {
      throw new Error(`Gmail login failed: ${loginResult.error}`);
    }

    console.log("✅ Newsletter Gmail account ready");

    // Newsletter content
    const newsletter = {
      subject: "🗞️ Tin tức tuần này - Cập nhật sản phẩm mới",
      template: `
        <h2>Chào bạn!</h2>
        <p>Dưới đây là những tin tức nổi bật tuần này:</p>

        <h3>🆕 Sản phẩm mới</h3>
        <ul>
          <li>Sản phẩm A - Giá đặc biệt</li>
          <li>Sản phẩm B - Hot trend</li>
        </ul>

        <h3>🎯 Khuyến mãi đặc biệt</h3>
        <p>Giảm 20% cho đơn hàng đầu tiên. Mã: WELCOME20</p>

        <p>Trân trọng,<br>Đội ngũ Marketing</p>

        <hr>
        <small>Để hủy nhận email, click <a href="#">tại đây</a></small>
      `,
    };

    // Subscriber list (in reality, this would come from a database)
    const subscribers = [
      "subscriber1@example.com",
      "subscriber2@example.com",
      "subscriber3@example.com",
    ];

    console.log(
      `📬 Sending newsletter to ${subscribers.length} subscribers...`
    );

    let successCount = 0;

    for (const subscriber of subscribers) {
      try {
        const emailResult = await gmail.sendEmail(
          subscriber,
          newsletter.subject,
          newsletter.template
        );

        if (emailResult.success) {
          successCount++;
          console.log(`✅ Sent to ${subscriber}`);
        } else {
          console.log(
            `❌ Failed to send to ${subscriber}: ${emailResult.error}`
          );
        }

        // Rate limiting - wait between emails
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error) {
        console.log(`❌ Email error for ${subscriber}: ${error.message}`);
      }
    }

    console.log(
      `📊 Newsletter sent: ${successCount}/${subscribers.length} successful`
    );

    await gmail.close();

    return {
      success: true,
      sent: successCount,
      total: subscribers.length,
    };
  } catch (error) {
    console.error("❌ Newsletter error:", error.message);
    return { success: false, error: error.message };
  }
}

// ==========================================
// EXAMPLE 4: Social Listening & Analytics
// ==========================================

async function example4_socialListening() {
  console.log("\n👂 === Social Listening Example ===");

  try {
    const autoLogin = new AutoLogin();
    await autoLogin.initialize("social-listening");

    // Monitor multiple platforms for brand mentions
    const monitoringAccounts = [
      {
        platform: "facebook",
        credentials: {
          email: process.env.MONITORING_FB_EMAIL,
          password: process.env.MONITORING_FB_PASS,
        },
      },
      {
        platform: "instagram",
        credentials: {
          username: process.env.MONITORING_IG_USER,
          password: process.env.MONITORING_IG_PASS,
        },
      },
    ];

    const loginResults = await autoLogin.batchLogin(monitoringAccounts, {
      concurrent: true, // Parallel login for faster setup
    });

    const activePlatforms = loginResults.filter((r) => r.success).length;
    console.log(`✅ Monitoring ${activePlatforms} platforms`);

    // Keywords to monitor
    const keywords = [
      "tên thương hiệu",
      "sản phẩm chính",
      "#hashtag_thương_hiệu",
      "@tên_tài_khoản",
    ];

    console.log(`👁️ Monitoring keywords: ${keywords.join(", ")}`);

    // This would be part of a larger monitoring system
    const mentions = {
      positive: 0,
      negative: 0,
      neutral: 0,
      total: 0,
    };

    // Simulate finding mentions and sentiment analysis
    console.log("🔍 Analyzing social mentions...");

    // In a real implementation, you would:
    // 1. Search for keywords on each platform
    // 2. Collect posts/comments containing keywords
    // 3. Analyze sentiment using AI/NLP
    // 4. Store results in database
    // 5. Generate reports

    mentions.positive = 15;
    mentions.negative = 3;
    mentions.neutral = 8;
    mentions.total = mentions.positive + mentions.negative + mentions.neutral;

    console.log("📊 Social Listening Results:");
    console.log(`   Total mentions: ${mentions.total}`);
    console.log(
      `   Positive: ${mentions.positive} (${Math.round(
        (mentions.positive / mentions.total) * 100
      )}%)`
    );
    console.log(
      `   Negative: ${mentions.negative} (${Math.round(
        (mentions.negative / mentions.total) * 100
      )}%)`
    );
    console.log(
      `   Neutral: ${mentions.neutral} (${Math.round(
        (mentions.neutral / mentions.total) * 100
      )}%)`
    );

    // Alert for negative mentions
    if (mentions.negative > 5) {
      console.log("🚨 Alert: High negative mention count detected!");

      // Auto-response to negative mentions (carefully implement)
      // await autoLogin.performAction("facebook", "postStatus", {
      //   message: "Thank you for your feedback. We're working to improve!"
      // });
    }

    await autoLogin.saveAllSessions();
    return { success: true, mentions };
  } catch (error) {
    console.error("❌ Social listening error:", error.message);
    return { success: false, error: error.message };
  }
}

// ==========================================
// EXAMPLE 5: Multi-Account Content Distribution
// ==========================================

async function example5_contentDistribution() {
  console.log("\n🌐 === Content Distribution Example ===");

  try {
    // Content to distribute
    const content = {
      title: "🔥 Bài viết viral mới",
      text: "Khám phá bí quyết thành công trong kinh doanh online! 🚀",
      hashtags: "#KinhDoanh #Online #ThanhCong #Viral",
      image: "./content-image.jpg", // Would be a real image path
    };

    // Multiple accounts for wider reach
    const distributionAccounts = [
      {
        platform: "facebook",
        accounts: [
          { email: "account1@example.com", password: "pass1" },
          { email: "account2@example.com", password: "pass2" },
        ],
      },
      {
        platform: "instagram",
        accounts: [
          { username: "account1", password: "pass1" },
          { username: "account2", password: "pass2" },
        ],
      },
    ];

    const results = { facebook: [], instagram: [] };

    // Distribute to Facebook accounts
    for (const account of distributionAccounts[0].accounts) {
      try {
        const facebook = new FacebookLogin({
          headless: true,
          profilePath: `./browser-profiles/fb-${account.email.split("@")[0]}`,
        });

        await facebook.initialize();

        const loginResult = await facebook.login(account);

        if (loginResult.success) {
          const postResult = await facebook.postStatus(
            `${content.title}\n\n${content.text}\n\n${content.hashtags}`
          );

          results.facebook.push({
            account: account.email,
            success: postResult.success,
            error: postResult.error || null,
          });

          console.log(
            `📘 Facebook ${account.email}: ${postResult.success ? "✅" : "❌"}`
          );
        }

        await facebook.close();

        // Delay between accounts to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 10000));
      } catch (error) {
        results.facebook.push({
          account: account.email,
          success: false,
          error: error.message,
        });
        console.log(`📘 Facebook ${account.email}: ❌ ${error.message}`);
      }
    }

    // Distribute to Instagram accounts
    for (const account of distributionAccounts[1].accounts) {
      try {
        const instagram = new InstagramLogin({
          headless: true,
          profilePath: `./browser-profiles/ig-${account.username}`,
        });

        await instagram.initialize();

        const loginResult = await instagram.login(account);

        if (loginResult.success) {
          // Note: Would need real image file for posting
          // const postResult = await instagram.postPhoto(
          //   content.image,
          //   `${content.title}\n\n${content.text}\n\n${content.hashtags}`
          // );

          // For demo, just mark as successful
          const postResult = { success: true };

          results.instagram.push({
            account: account.username,
            success: postResult.success,
            error: postResult.error || null,
          });

          console.log(
            `📱 Instagram ${account.username}: ${
              postResult.success ? "✅" : "❌"
            }`
          );
        }

        await instagram.close();

        // Delay between accounts
        await new Promise((resolve) => setTimeout(resolve, 15000));
      } catch (error) {
        results.instagram.push({
          account: account.username,
          success: false,
          error: error.message,
        });
        console.log(`📱 Instagram ${account.username}: ❌ ${error.message}`);
      }
    }

    // Summary
    const totalSuccess = [
      ...results.facebook.filter((r) => r.success),
      ...results.instagram.filter((r) => r.success),
    ].length;

    const totalAccounts =
      distributionAccounts[0].accounts.length +
      distributionAccounts[1].accounts.length;

    console.log(
      `📊 Content distributed to ${totalSuccess}/${totalAccounts} accounts`
    );

    return {
      success: totalSuccess > 0,
      results,
      stats: { success: totalSuccess, total: totalAccounts },
    };
  } catch (error) {
    console.error("❌ Content distribution error:", error.message);
    return { success: false, error: error.message };
  }
}

// ==========================================
// MAIN DEMO RUNNER
// ==========================================

async function runRealWorldExamples() {
  console.log("🌟 Real-World Social Media Automation Examples");
  console.log("===============================================");
  console.log("⚠️  Set your credentials in environment variables!");
  console.log("⚠️  Respect platform Terms of Service!");
  console.log("⚠️  Use responsibly and ethically!\n");

  try {
    // Run examples (uncomment the ones you want to test)

    // const result1 = await example1_customerSupportBot();
    // console.log("Customer Support Result:", result1);

    // const result2 = await example2_marketingCampaign();
    // console.log("Marketing Campaign Result:", result2);

    // const result3 = await example3_emailNewsletter();
    // console.log("Email Newsletter Result:", result3);

    // const result4 = await example4_socialListening();
    // console.log("Social Listening Result:", result4);

    const result5 = await example5_contentDistribution();
    console.log("Content Distribution Result:", result5);

    console.log("\n✅ Real-world examples completed!");
    console.log("\n💡 Pro Tips:");
    console.log("   1. Use environment variables for credentials");
    console.log("   2. Implement proper error handling");
    console.log("   3. Add rate limiting between actions");
    console.log("   4. Monitor platform policy changes");
    console.log("   5. Use session management for efficiency");
    console.log("   6. Always respect Terms of Service");
  } catch (error) {
    console.error("❌ Examples failed:", error.message);
  }
}

// Environment variables example
console.log("\n📋 Required Environment Variables:");
console.log("SUPPORT_FB_EMAIL=your-support@example.com");
console.log("SUPPORT_FB_PASSWORD=your-password");
console.log("SUPPORT_ZALO_PHONE=0123456789");
console.log("SUPPORT_ZALO_PASSWORD=your-password");
console.log("MARKETING_IG_USER=your-marketing-username");
console.log("MARKETING_IG_PASS=your-password");
console.log("NEWSLETTER_EMAIL=newsletter@example.com");
console.log("NEWSLETTER_APP_PASSWORD=your-app-password");
console.log("... (and so on)\n");

// Run examples if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runRealWorldExamples()
    .then(() => {
      console.log("\n🏁 All examples completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Fatal error:", error.message);
      process.exit(1);
    });
}

export {
  example1_customerSupportBot,
  example2_marketingCampaign,
  example3_emailNewsletter,
  example4_socialListening,
  example5_contentDistribution,
  runRealWorldExamples,
};
