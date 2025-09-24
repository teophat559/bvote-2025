// E2E admin socket client
import { io } from "socket.io-client";
import fs from "fs";
import path from "path";

const url = process.env.SOCKET_URL || "http://localhost:3000";
let token = process.env.ADMIN_TOKEN || "";
if (!token) {
  try {
    const filePath = path.resolve(process.cwd(), "test-logs/admin.jwt");
    if (fs.existsSync(filePath)) {
      token = fs.readFileSync(filePath, "utf8").trim();
    }
  } catch {}
}
if (!token) token = "mock_token_for_testing"; // fallback for simple-server

const socket = io(url, {
  transports: ["polling"],
  autoConnect: true,
});

let sent = false;

function safeExit(code = 0) {
  try {
    socket.disconnect();
  } catch {}
  process.exit(code);
}

socket.on("connect", () => {
  console.log(`[ADMIN] connected: ${socket.id}`);
  try {
    socket.emit("authenticate", { token, clientType: "admin" });
  } catch {}
});

socket.on("auth:success", (data) => {
  console.log("[ADMIN] auth:success", JSON.stringify(data));
  const payload = {
    type: "notify",
    message: "Hello from admin E2E",
    title: "E2E Test",
    priority: "normal",
    timestamp: new Date().toISOString(),
  };
  console.log("[ADMIN] sending admin:command", JSON.stringify(payload));
  socket.emit("admin:command", payload);
  sent = true;
});

socket.on("error", (err) => {
  console.log("[ADMIN] error", JSON.stringify(err));
});

socket.on("command:response", (res) => {
  console.log("[ADMIN] command:response", JSON.stringify(res));
  setTimeout(() => safeExit(0), 500);
});

// Safety timeout (10s)
setTimeout(() => {
  if (!sent) {
    console.log("[ADMIN] timeout before sending command");
    safeExit(1);
  }
}, 10000);
