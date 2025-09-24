import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const port = process.env.PORT || 3002;
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

  let filePath = path.join(distPath, req.url === "/" ? "index.html" : req.url);

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
            res.writeHead(200, { "Content-Type": "text/html" });
            res.end(indexContent, "utf-8");
          }
        });
      } else {
        res.writeHead(500);
        res.end("Server Error: " + error.code);
      }
    } else {
      res.writeHead(200, { "Content-Type": mimeType });
      res.end(content, "utf-8");
    }
  });
});

server.listen(port, "localhost", () => {
  console.log(
    `🚀 BVOTE Admin Panel Server running at http://localhost:${port}`
  );
  console.log(`📁 Serving files from: ${distPath}`);
  console.log(`🌐 Access Admin Panel: http://localhost:${port}`);
});

server.on("error", (err) => {
  console.error("Server error:", err);
});
