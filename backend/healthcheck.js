/**
 * Health Check Script for Docker
 * Tests if the server is responding correctly
 */

import http from "http";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const options = {
  host: "localhost",
  port: process.env.PORT || 3000,
  path: "/health",
  timeout: 2000,
  method: "GET",
};

const request = http.request(options, (res) => {
  console.log(`Health check status: ${res.statusCode}`);

  if (res.statusCode === 200) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});

request.on("error", (err) => {
  console.log("Health check failed:", err.message);
  process.exit(1);
});

request.on("timeout", () => {
  console.log("Health check timeout");
  request.destroy();
  process.exit(1);
});

request.end();
