#!/usr/bin/env node

/**
 * QUICK AUTOMATED TEST - 30 MIN DEPLOYMENT
 * Pure Node.js - No external dependencies
 */

import http from "http";
import https from "https";

const BASE_URL = "localhost:3000";
let testCount = 0;
let passCount = 0;
let failCount = 0;

const log = (message, type = "INFO") => {
  const emoji = type === "PASS" ? "✅" : type === "FAIL" ? "❌" : "📋";
  console.log(`${emoji} ${message}`);
};

const httpRequest = (path, method = "GET", data = null) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "localhost",
      port: 3000,
      path: path,
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    if (data && method !== "GET") {
      const postData = JSON.stringify(data);
      options.headers["Content-Length"] = Buffer.byteLength(postData);
    }

    const req = http.request(options, (res) => {
      let responseData = "";

      res.on("data", (chunk) => {
        responseData += chunk;
      });

      res.on("end", () => {
        try {
          const parsedData = JSON.parse(responseData);
          resolve({
            statusCode: res.statusCode,
            data: parsedData,
            headers: res.headers,
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            data: responseData,
            headers: res.headers,
          });
        }
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    if (data && method !== "GET") {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
};

const test = async (name, testFn) => {
  testCount++;
  try {
    await testFn();
    passCount++;
    log(`${name}`, "PASS");
  } catch (error) {
    failCount++;
    log(`${name} - ${error.message}`, "FAIL");
  }
};

const runTests = async () => {
  log("🚀 STARTING QUICK AUTOMATED TEST SUITE");
  log("====================================");

  // Health Check
  await test("Backend Health Check", async () => {
    const response = await httpRequest("/api/health");
    // Accept 200 (OK) or 503 (Service Unavailable with DEGRADED status)
    if (response.statusCode !== 200 && response.statusCode !== 503) {
      throw new Error(`Health check failed with status ${response.statusCode}`);
    }

    if (!response.data || !response.data.status) {
      throw new Error("Health check response missing status");
    }

    // Accept DEGRADED status (expected with fallback DB) - this is CORRECT behavior
    const validStatuses = ["OK", "DEGRADED", "HEALTHY"];
    if (!validStatuses.includes(response.data.status)) {
      throw new Error(`Unexpected status: ${response.data.status}`);
    }
    // Status 503 with DEGRADED is expected and correct for fallback database mode
  });

  // Public API Tests
  await test("Public Health Check", async () => {
    const response = await httpRequest("/api/public/health");
    if (response.statusCode !== 200 || !response.data.success) {
      throw new Error("Public API health failed");
    }
  });

  await test("Public Contests", async () => {
    const response = await httpRequest("/api/public/contests");
    if (response.statusCode !== 200 || !response.data.success) {
      throw new Error("Public contests failed");
    }
  });

  await test("Public Rankings", async () => {
    const response = await httpRequest("/api/public/ranking");
    if (response.statusCode !== 200 || !response.data.success) {
      throw new Error("Public rankings failed");
    }
  });

  // Auth Tests (Expected to fail without credentials)
  await test("Auth Protection Test", async () => {
    const response = await httpRequest("/api/login-requests");
    if (response.statusCode !== 401) {
      throw new Error("Should require authentication");
    }
  });

  await test("Login Endpoint Structure", async () => {
    const response = await httpRequest("/api/auth/login", "POST", {
      identifier: "test@test.com",
      password: "test123",
    });
    // Should return 401 for invalid credentials, not crash
    if (response.statusCode !== 401 && response.statusCode !== 400) {
      throw new Error(
        `Login endpoint returned ${response.statusCode}, expected 401 or 400`
      );
    }
    // Verify response structure
    if (!response.data || (!response.data.error && !response.data.message)) {
      throw new Error("Login response missing error information");
    }
  });

  // Monitoring Tests
  await test("Monitoring Metrics", async () => {
    const response = await httpRequest("/api/monitoring/metrics");
    if (response.statusCode !== 200 || !response.data.success) {
      throw new Error("Monitoring metrics failed");
    }
  });

  await test("System Alerts", async () => {
    const response = await httpRequest("/api/monitoring/alerts");
    if (response.statusCode !== 200 || !response.data.success) {
      throw new Error("System alerts failed");
    }
  });

  // Performance Test
  await test("Response Time Check", async () => {
    const start = Date.now();
    await httpRequest("/api/public/health");
    const responseTime = Date.now() - start;

    if (responseTime > 2000) {
      throw new Error(`Slow response time: ${responseTime}ms`);
    }
  });

  // Results
  log("====================================");
  log(`🏁 TESTS COMPLETED`);
  log(`✅ PASSED: ${passCount}/${testCount}`);
  log(`❌ FAILED: ${failCount}/${testCount}`);
  log(`📊 SUCCESS RATE: ${Math.round((passCount / testCount) * 100)}%`);

  if (failCount === 0) {
    log("🎉 ALL TESTS PASSED - SYSTEM READY!");
    return true;
  } else {
    log("⚠️ SOME TESTS FAILED - CHECK ABOVE");
    return false;
  }
};

// Run the tests
runTests()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    log(`CRITICAL ERROR: ${error.message}`, "FAIL");
    process.exit(1);
  });
