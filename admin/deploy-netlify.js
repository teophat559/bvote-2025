#!/usr/bin/env node

/**
 * Tự động deploy Admin Panel lên Netlify
 * BVOTE 2025 - Admin Auto Deploy Script
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const SITE_NAME = "admin-bvote";
const BUILD_DIR = "./dist";

console.log("🚀 Bắt đầu auto deploy Admin Panel lên Netlify...\n");

// Hàm thực hiện lệnh shell
function runCommand(command, description) {
  console.log(`📋 ${description}...`);
  try {
    const output = execSync(command, {
      stdio: "inherit",
      cwd: process.cwd(),
    });
    console.log(`✅ ${description} - Thành công!\n`);
    return output;
  } catch (error) {
    console.error(`❌ ${description} - Thất bại:`, error.message);
    process.exit(1);
  }
}

async function deployToNetlify() {
  try {
    // 1. Kiểm tra môi trường
    console.log("🔍 Kiểm tra môi trường...");

    if (!fs.existsSync("package.json")) {
      throw new Error("package.json không tồn tại");
    }

    // 2. Cài đặt dependencies
    runCommand("npm install", "Cài đặt dependencies");

    // 3. Build project
    runCommand("npm run build", "Build admin panel");

    // 4. Kiểm tra thư mục build
    if (!fs.existsSync(BUILD_DIR)) {
      throw new Error(`Thư mục build ${BUILD_DIR} không tồn tại`);
    }

    console.log("✅ Build hoàn tất! Thư mục dist đã sẵn sàng\n");

    // 5. Kiểm tra Netlify CLI
    try {
      execSync("netlify --version", { stdio: "pipe" });
    } catch (error) {
      throw new Error(
        "Netlify CLI chưa được cài đặt. Chạy: npm install -g netlify-cli"
      );
    }

    // 6. Deploy lên Netlify
    console.log("🌐 Deploying lên Netlify...");

    // Tạo site mới nếu chưa có
    try {
      runCommand("netlify status", "Kiểm tra trạng thái Netlify");
    } catch (error) {
      console.log("🔗 Chưa liên kết với Netlify site. Đang tạo mới...");
      runCommand(`netlify init --manual`, "Khởi tạo Netlify site");
    }

    // Deploy production
    runCommand(`netlify deploy --prod --dir=${BUILD_DIR}`, "Deploy production");

    console.log("🎉 Deploy thành công!");
    console.log("🌐 Admin Panel đã được deploy lên Netlify");

    // Hiển thị thông tin site
    try {
      const siteInfo = execSync("netlify status --json", { encoding: "utf8" });
      const site = JSON.parse(siteInfo);

      console.log("\n📊 Thông tin deployment:");
      console.log(`🔗 Site URL: ${site.site_url || "Đang cập nhật..."}`);
      console.log(`📱 Admin URL: ${site.admin_url || "Đang cập nhật..."}`);
      console.log(`🆔 Site ID: ${site.id || "Đang cập nhật..."}`);
    } catch (error) {
      console.log(
        "ℹ️ Không thể lấy thông tin site (có thể do chưa deploy xong)"
      );
    }
  } catch (error) {
    console.error("❌ Deploy thất bại:", error.message);
    process.exit(1);
  }
}

// Chạy deploy
deployToNetlify();
