#!/usr/bin/env node

/**
 * Script chuyển đổi môi trường BVOTE Admin Panel
 * Sử dụng: node switch-environment.js [mock|real|production]
 */

const fs = require("fs");
const path = require("path");

const environments = {
  mock: {
    VITE_USE_MOCK: "1",
    VITE_API_URL: "http://localhost:3000/api",
    VITE_SOCKET_URL: "http://localhost:3000",
    VITE_APP_NAME: "BVOTE Admin (Mock Mode)",
    VITE_BUILD_VERSION: "1.0.0-mock",
    VITE_DEPLOYMENT_ENV: "development",
  },
  real: {
    VITE_USE_MOCK: "0",
    VITE_API_URL: "https://programbvote2025.online/api",
    VITE_SOCKET_URL: "https://programbvote2025.online",
    VITE_APP_NAME: "BVOTE Admin",
    VITE_BUILD_VERSION: "1.0.0-real",
    VITE_DEPLOYMENT_ENV: "production",
  },
  production: {
    VITE_USE_MOCK: "0",
    VITE_API_URL: "https://programbvote2025.online/api",
    VITE_SOCKET_URL: "https://programbvote2025.online",
    VITE_APP_NAME: "BVOTE Admin",
    VITE_BUILD_VERSION: "1.0.0-production",
    VITE_DEPLOYMENT_ENV: "production",
    VITE_ENABLE_CONSOLE_LOGS: "0",
    VITE_LOG_LEVEL: "error",
  },
};

function updateEnvFile(envType) {
  const envPath = path.join(__dirname, ".env");
  const backupPath = path.join(__dirname, `.env.backup.${Date.now()}`);

  // Backup current .env
  if (fs.existsSync(envPath)) {
    fs.copyFileSync(envPath, backupPath);
    console.log(`✅ Đã backup .env hiện tại -> ${path.basename(backupPath)}`);
  }

  // Read current .env content
  let currentEnv = {};
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf8");
    content.split("\n").forEach((line) => {
      const [key, value] = line.split("=");
      if (key && value) {
        currentEnv[key.trim()] = value.trim();
      }
    });
  }

  // Update with new environment
  const newEnv = { ...currentEnv, ...environments[envType] };

  // Generate new .env content
  let envContent = `# BVOTE Admin - ${envType.toUpperCase()} Configuration\n`;
  envContent += `# Generated: ${new Date().toISOString()}\n\n`;

  Object.entries(newEnv).forEach(([key, value]) => {
    envContent += `${key}=${value}\n`;
  });

  // Write new .env file
  fs.writeFileSync(envPath, envContent);
  console.log(`✅ Đã cập nhật .env cho môi trường: ${envType.toUpperCase()}`);

  return newEnv;
}

function showCurrentConfig() {
  const envPath = path.join(__dirname, ".env");
  if (!fs.existsSync(envPath)) {
    console.log("❌ Không tìm thấy file .env");
    return;
  }

  const content = fs.readFileSync(envPath, "utf8");
  const useMock = content.includes("VITE_USE_MOCK=1");
  const apiUrl = content.match(/VITE_API_URL=(.+)/)?.[1] || "Not set";
  const socketUrl = content.match(/VITE_SOCKET_URL=(.+)/)?.[1] || "Not set";

  console.log("\n📊 CẤU HÌNH HIỆN Tại:");
  console.log("=".repeat(50));
  console.log(`Chế độ: ${useMock ? "🧪 MOCK MODE" : "🌐 REAL MODE"}`);
  console.log(`API URL: ${apiUrl}`);
  console.log(`Socket URL: ${socketUrl}`);
  console.log("=".repeat(50));
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  console.log("🔄 BVOTE Admin Panel - Environment Switcher\n");

  if (!command || command === "status") {
    showCurrentConfig();
    console.log("\n📝 Sử dụng:");
    console.log(
      "node switch-environment.js mock       # Chuyển sang mock mode"
    );
    console.log(
      "node switch-environment.js real       # Chuyển sang real mode"
    );
    console.log(
      "node switch-environment.js production # Chuyển sang production mode"
    );
    console.log(
      "node switch-environment.js status     # Xem cấu hình hiện tại"
    );
    return;
  }

  if (!environments[command]) {
    console.log(`❌ Môi trường không hợp lệ: ${command}`);
    console.log("Các môi trường có sẵn: mock, real, production");
    return;
  }

  console.log(`🔄 Chuyển đổi sang môi trường: ${command.toUpperCase()}`);

  try {
    const newConfig = updateEnvFile(command);

    console.log("\n✅ CHUYỂN ĐỔI THÀNH CÔNG!");
    console.log("\n📋 Cấu hình mới:");
    Object.entries(environments[command]).forEach(([key, value]) => {
      console.log(`  ${key}=${value}`);
    });

    console.log("\n🚀 Bước tiếp theo:");
    if (command === "mock") {
      console.log("1. npm run dev          # Chạy development server");
      console.log("2. Truy cập: http://localhost:5174");
    } else {
      console.log("1. npm run build:prod   # Build cho production");
      console.log("2. Upload dist/ lên server");
      console.log("3. Cấu hình proxy backend");
    }
  } catch (error) {
    console.error("❌ Lỗi khi chuyển đổi môi trường:", error.message);
  }
}

if (require.main === module) {
  main();
}

module.exports = { updateEnvFile, environments };
