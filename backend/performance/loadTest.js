/**
 * Load Testing Script
 * Performance testing for BVOTE Backend API
 */

import http from "http";
import https from "https";
import { performance } from "perf_hooks";

class LoadTester {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || "http://localhost:3000";
    this.concurrency = options.concurrency || 10;
    this.duration = options.duration || 30000; // 30 seconds
    this.rampUp = options.rampUp || 5000; // 5 seconds
    this.endpoints = options.endpoints || [
      { path: "/health", method: "GET", weight: 10 },
      {
        path: "/api/auth/login",
        method: "POST",
        weight: 3,
        body: {
          email: "user@bvote.com",
          password: "password123",
        },
      },
      { path: "/api/auth/me", method: "GET", weight: 2, requiresAuth: true },
    ];

    this.results = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      responseTimes: [],
      errorTypes: {},
      statusCodes: {},
      startTime: null,
      endTime: null,
    };

    this.authToken = null;
    this.isRunning = false;
  }

  async authenticate() {
    console.log("🔐 Authenticating for load test...");

    return new Promise((resolve, reject) => {
      const postData = JSON.stringify({
        email: "user@bvote.com",
        password: "password123",
      });

      const options = {
        hostname: this.getHostname(),
        port: this.getPort(),
        path: "/api/auth/login",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(postData),
        },
      };

      const req = (this.baseUrl.startsWith("https") ? https : http).request(
        options,
        (res) => {
          let data = "";

          res.on("data", (chunk) => {
            data += chunk;
          });

          res.on("end", () => {
            try {
              const response = JSON.parse(data);
              if (response.token) {
                this.authToken = response.token;
                console.log("✅ Authentication successful");
                resolve();
              } else {
                reject(new Error("No token received"));
              }
            } catch (error) {
              reject(error);
            }
          });
        }
      );

      req.on("error", reject);
      req.write(postData);
      req.end();
    });
  }

  getHostname() {
    return new URL(this.baseUrl).hostname;
  }

  getPort() {
    return (
      new URL(this.baseUrl).port ||
      (this.baseUrl.startsWith("https") ? 443 : 80)
    );
  }

  selectEndpoint() {
    const totalWeight = this.endpoints.reduce((sum, ep) => sum + ep.weight, 0);
    let random = Math.random() * totalWeight;

    for (const endpoint of this.endpoints) {
      random -= endpoint.weight;
      if (random <= 0) {
        return endpoint;
      }
    }

    return this.endpoints[0];
  }

  async makeRequest(endpoint) {
    return new Promise((resolve) => {
      const startTime = performance.now();

      const postData = endpoint.body ? JSON.stringify(endpoint.body) : null;

      const options = {
        hostname: this.getHostname(),
        port: this.getPort(),
        path: endpoint.path,
        method: endpoint.method,
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "BVOTE-LoadTester/1.0",
        },
      };

      if (postData) {
        options.headers["Content-Length"] = Buffer.byteLength(postData);
      }

      if (endpoint.requiresAuth && this.authToken) {
        options.headers["Authorization"] = `Bearer ${this.authToken}`;
      }

      const req = (this.baseUrl.startsWith("https") ? https : http).request(
        options,
        (res) => {
          let data = "";

          res.on("data", (chunk) => {
            data += chunk;
          });

          res.on("end", () => {
            const endTime = performance.now();
            const responseTime = endTime - startTime;

            this.recordResult({
              success: res.statusCode >= 200 && res.statusCode < 400,
              statusCode: res.statusCode,
              responseTime,
              endpoint: endpoint.path,
              error: null,
            });

            resolve();
          });
        }
      );

      req.on("error", (error) => {
        const endTime = performance.now();
        const responseTime = endTime - startTime;

        this.recordResult({
          success: false,
          statusCode: 0,
          responseTime,
          endpoint: endpoint.path,
          error: error.message,
        });

        resolve();
      });

      req.setTimeout(10000, () => {
        req.destroy();
        this.recordResult({
          success: false,
          statusCode: 0,
          responseTime: 10000,
          endpoint: endpoint.path,
          error: "Timeout",
        });
        resolve();
      });

      if (postData) {
        req.write(postData);
      }

      req.end();
    });
  }

  recordResult(result) {
    this.results.totalRequests++;

    if (result.success) {
      this.results.successfulRequests++;
    } else {
      this.results.failedRequests++;

      const errorType = result.error || `HTTP ${result.statusCode}`;
      this.results.errorTypes[errorType] =
        (this.results.errorTypes[errorType] || 0) + 1;
    }

    this.results.responseTimes.push(result.responseTime);
    this.results.statusCodes[result.statusCode] =
      (this.results.statusCodes[result.statusCode] || 0) + 1;
  }

  async runWorker(workerId) {
    const workerStartDelay = (this.rampUp / this.concurrency) * workerId;
    await this.sleep(workerStartDelay);

    console.log(`🚀 Worker ${workerId + 1} started`);

    while (this.isRunning) {
      const endpoint = this.selectEndpoint();
      await this.makeRequest(endpoint);

      // Small delay between requests to simulate real usage
      await this.sleep(Math.random() * 100);
    }

    console.log(`✅ Worker ${workerId + 1} completed`);
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  calculateStats() {
    const responseTimes = this.results.responseTimes.sort((a, b) => a - b);
    const totalTime = this.results.endTime - this.results.startTime;

    return {
      summary: {
        totalRequests: this.results.totalRequests,
        successfulRequests: this.results.successfulRequests,
        failedRequests: this.results.failedRequests,
        successRate:
          (
            (this.results.successfulRequests / this.results.totalRequests) *
            100
          ).toFixed(2) + "%",
        requestsPerSecond: (
          this.results.totalRequests /
          (totalTime / 1000)
        ).toFixed(2),
        duration: (totalTime / 1000).toFixed(2) + "s",
      },
      responseTimes: {
        min: Math.min(...responseTimes).toFixed(2) + "ms",
        max: Math.max(...responseTimes).toFixed(2) + "ms",
        avg:
          (
            responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
          ).toFixed(2) + "ms",
        p50:
          responseTimes[Math.floor(responseTimes.length * 0.5)].toFixed(2) +
          "ms",
        p90:
          responseTimes[Math.floor(responseTimes.length * 0.9)].toFixed(2) +
          "ms",
        p95:
          responseTimes[Math.floor(responseTimes.length * 0.95)].toFixed(2) +
          "ms",
        p99:
          responseTimes[Math.floor(responseTimes.length * 0.99)].toFixed(2) +
          "ms",
      },
      statusCodes: this.results.statusCodes,
      errors: this.results.errorTypes,
    };
  }

  async run() {
    console.log("🎯 Starting BVOTE Backend Load Test");
    console.log(`📊 Configuration:`);
    console.log(`   Target: ${this.baseUrl}`);
    console.log(`   Concurrency: ${this.concurrency} users`);
    console.log(`   Duration: ${this.duration / 1000}s`);
    console.log(`   Ramp-up: ${this.rampUp / 1000}s`);
    console.log("");

    try {
      // Authenticate first
      await this.authenticate();

      // Start the test
      this.isRunning = true;
      this.results.startTime = performance.now();

      // Create workers
      const workers = [];
      for (let i = 0; i < this.concurrency; i++) {
        workers.push(this.runWorker(i));
      }

      // Stop after duration
      setTimeout(() => {
        this.isRunning = false;
        console.log("⏰ Test duration reached, stopping workers...");
      }, this.duration);

      // Wait for all workers to complete
      await Promise.all(workers);

      this.results.endTime = performance.now();

      // Calculate and display results
      const stats = this.calculateStats();

      console.log("\n📈 LOAD TEST RESULTS");
      console.log("=".repeat(50));
      console.log("📊 Summary:");
      Object.entries(stats.summary).forEach(([key, value]) => {
        console.log(`   ${key.padEnd(20)}: ${value}`);
      });

      console.log("\n⏱️  Response Times:");
      Object.entries(stats.responseTimes).forEach(([key, value]) => {
        console.log(`   ${key.padEnd(20)}: ${value}`);
      });

      console.log("\n📋 Status Codes:");
      Object.entries(stats.statusCodes).forEach(([code, count]) => {
        console.log(`   HTTP ${code.padEnd(15)}: ${count}`);
      });

      if (Object.keys(stats.errors).length > 0) {
        console.log("\n❌ Errors:");
        Object.entries(stats.errors).forEach(([error, count]) => {
          console.log(`   ${error.padEnd(20)}: ${count}`);
        });
      }

      console.log("\n✅ Load test completed successfully!");

      // Performance assessment
      const successRate = parseFloat(stats.summary.successRate);
      const avgResponseTime = parseFloat(stats.responseTimes.avg);

      console.log("\n🎯 Performance Assessment:");
      if (successRate >= 99 && avgResponseTime <= 200) {
        console.log("   🟢 EXCELLENT - System performing exceptionally well");
      } else if (successRate >= 95 && avgResponseTime <= 500) {
        console.log("   🟡 GOOD - System performing within acceptable limits");
      } else if (successRate >= 90 && avgResponseTime <= 1000) {
        console.log("   🟠 FAIR - System showing signs of stress");
      } else {
        console.log("   🔴 POOR - System may be overloaded");
      }
    } catch (error) {
      console.error("❌ Load test failed:", error.message);
      process.exit(1);
    }
  }
}

// CLI interface
const args = process.argv.slice(2);
const config = {
  baseUrl: "http://localhost:3000",
  concurrency: 10,
  duration: 30000,
  rampUp: 5000,
};

// Parse command line arguments
args.forEach((arg, index) => {
  if (arg === "--url" && args[index + 1]) {
    config.baseUrl = args[index + 1];
  } else if (arg === "--concurrency" && args[index + 1]) {
    config.concurrency = parseInt(args[index + 1]);
  } else if (arg === "--duration" && args[index + 1]) {
    config.duration = parseInt(args[index + 1]) * 1000;
  } else if (arg === "--ramp-up" && args[index + 1]) {
    config.rampUp = parseInt(args[index + 1]) * 1000;
  }
});

// Run load test if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const loadTester = new LoadTester(config);
  loadTester.run().catch(console.error);
}

export default LoadTester;
