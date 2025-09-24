#!/usr/bin/env node

/**
 * Auto Deploy All Components - BVOTE 2025
 * Chạy tự động deploy cho tất cả: Admin Panel + User Interface
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

console.log("🚀 BVOTE 2025 - AUTO DEPLOY ALL COMPONENTS\n");

// Hàm thực hiện lệnh với error handling
function runCommand(command, description, cwd = process.cwd()) {
  console.log(`📋 ${description}...`);
  try {
    const output = execSync(command, {
      stdio: "inherit",
      cwd: cwd,
    });
    console.log(`✅ ${description} - Thành công!\n`);
    return output;
  } catch (error) {
    console.error(`❌ ${description} - Thất bại:`, error.message);
    throw error;
  }
}

async function deployAll() {
  try {
    console.log("🎯 Bắt đầu deploy tất cả components...\n");

    // 1. Deploy Admin Panel
    console.log("🔧 === DEPLOYING ADMIN PANEL ===");
    const adminPath = path.join(process.cwd(), "admin");

    if (!fs.existsSync(adminPath)) {
      throw new Error("Thư mục admin không tồn tại!");
    }

    // Build và deploy admin
    runCommand("npm install", "Cài đặt admin dependencies", adminPath);
    runCommand("npm run build", "Build admin panel", adminPath);
    runCommand(
      "netlify deploy --prod --dir=dist",
      "Deploy admin to Netlify",
      adminPath
    );

    console.log("✅ Admin Panel deployed successfully!\n");

    // 2. Deploy User Interface
    console.log("👥 === DEPLOYING USER INTERFACE ===");
    const userPath = path.join(process.cwd(), "user");

    if (!fs.existsSync(userPath)) {
      throw new Error("Thư mục user không tồn tại!");
    }

    // Build và deploy user
    runCommand("npm install", "Cài đặt user dependencies", userPath);
    runCommand("npm run build", "Build user interface", userPath);
    runCommand(
      "netlify deploy --prod --dir=dist",
      "Deploy user to Netlify",
      userPath
    );

    console.log("✅ User Interface deployed successfully!\n");

    // 3. Hiển thị thông tin deployment
    console.log("🎉 === DEPLOYMENT HOÀN THÀNH ===");
    console.log("📊 Thông tin các site đã deploy:");

    try {
      // Lấy thông tin admin site
      const adminInfo = execSync("netlify status --json", {
        encoding: "utf8",
        cwd: adminPath,
      });
      const adminSite = JSON.parse(adminInfo);
      console.log(
        `🔧 Admin Panel: ${adminSite.site_url ||
          "https://admin-bvote-2025.netlify.app"}`
      );

      // Lấy thông tin user site
      const userInfo = execSync("netlify status --json", {
        encoding: "utf8",
        cwd: userPath,
      });
      const userSite = JSON.parse(userInfo);
      console.log(
        `👥 User Interface: ${userSite.site_url ||
          "https://user-bvote-2025.netlify.app"}`
      );
    } catch (error) {
      console.log("🔧 Admin Panel: https://admin-bvote-2025.netlify.app");
      console.log("👥 User Interface: https://user-bvote-2025.netlify.app");
    }

    console.log("⚡ Backend API: http://localhost:3000");

    console.log(
      "\n🎊 Tất cả components đã được deploy thành công lên Netlify!"
    );
    console.log("🌐 Hệ thống BVOTE 2025 sẵn sàng sử dụng!");
  } catch (error) {
    console.error("\n❌ Auto deploy thất bại:", error.message);
    console.error("💡 Hãy kiểm tra lỗi và thử lại.");
    process.exit(1);
  }
}

// Chạy deployment
deployAll();
