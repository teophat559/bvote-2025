import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const port = process.env.PORT || 3001;
const distPath = path.join(__dirname, "dist");

const mimeTypes = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".wav": "audio/wav",
  ".mp4": "video/mp4",
  ".woff": "application/font-woff",
  ".ttf": "application/font-ttf",
  ".eot": "application/vnd.ms-fontobject",
  ".otf": "application/font-otf",
  ".wasm": "application/wasm",
};

const server = http.createServer((req, res) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);

  // CORS headers để tránh lỗi fetch
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  let filePath = path.join(distPath, req.url === "/" ? "index.html" : req.url);

  // Security check: prevent directory traversal
  if (!filePath.startsWith(distPath)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  // Remove query parameters
  filePath = filePath.split("?")[0];

  // Handle SPA routing - serve index.html for non-file requests
  if (!path.extname(filePath) && !fs.existsSync(filePath)) {
    filePath = path.join(distPath, "index.html");
  }

  const extname = String(path.extname(filePath)).toLowerCase();
  const mimeType = mimeTypes[extname] || "application/octet-stream";

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === "ENOENT") {
        // File not found, serve index.html for SPA routing
        fs.readFile(path.join(distPath, "index.html"), (err, indexContent) => {
          if (err) {
            res.writeHead(500);
            res.end("Server Error");
          } else {
            res.writeHead(200, {
              "Content-Type": "text/html",
              "Cache-Control": "no-cache",
            });
            res.end(indexContent, "utf-8");
          }
        });
      } else {
        res.writeHead(500);
        res.end("Server Error: " + error.code);
      }
    } else {
      // Add cache headers for static assets
      const headers = { "Content-Type": mimeType };

      if (extname === ".js" || extname === ".css") {
        headers["Cache-Control"] = "public, max-age=31536000"; // 1 year
      } else if (extname === ".html") {
        headers["Cache-Control"] = "no-cache"; // Don't cache HTML
      }

      res.writeHead(200, headers);
      res.end(content, "utf-8");
    }
  });
});

server.listen(port, "0.0.0.0", () => {
  console.log(
    `🚀 BVOTE User Interface Server running at http://localhost:${port}`
  );
  console.log(`📁 Serving files from: ${distPath}`);
  console.log(`🌐 Access User Interface: http://localhost:${port}`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`❌ Port ${port} is already in use`);
    process.exit(1);
  } else {
    console.error("❌ Server error:", err);
  }
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n⏹️ Shutting down User Interface Server...");
  server.close(() => {
    console.log("✅ User Interface Server stopped");
    process.exit(0);
  });
});

process.on("SIGTERM", () => {
  console.log("\n⏹️ Shutting down User Interface Server...");
  server.close(() => {
    console.log("✅ User Interface Server stopped");
    process.exit(0);
  });
});
