// Orchestrated E2E on port 3000: user authenticates, then admin authenticates and sends command
import { io } from "socket.io-client";
import fs from "fs";
import path from "path";

const SOCKET_URL = process.env.SOCKET_URL || "http://localhost:3000";

function readToken(fileName) {
  try {
    const p = path.resolve(process.cwd(), fileName);
    if (fs.existsSync(p)) return fs.readFileSync(p, "utf8").trim();
  } catch {}
  return "";
}

const userToken = process.env.USER_TOKEN || readToken("test-logs/user.jwt");
const adminToken = process.env.ADMIN_TOKEN || readToken("test-logs/admin.jwt");

if (!userToken || !adminToken) {
  console.error(
    "[E2E] Missing tokens. Ensure test-logs/user.jwt and admin.jwt exist."
  );
  process.exit(2);
}

const userSocket = io(SOCKET_URL, {
  transports: ["polling"],
  autoConnect: true,
  forceNew: true,
  reconnectionAttempts: 2,
  extraHeaders: {
    Origin: "http://localhost:5173",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
  },
});
let adminSocket = null;
let done = false;

function safeExit(code = 0) {
  if (done) return;
  done = true;
  try {
    userSocket.disconnect();
  } catch {}
  try {
    adminSocket && adminSocket.disconnect();
  } catch {}
  process.exit(code);
}

// User flow
userSocket.on("connect", () => {
  console.log(`[USER] connected: ${userSocket.id}`);
  try {
    userSocket.emit("authenticate", { token: userToken, clientType: "user" });
  } catch {}
});

userSocket.on("auth:success", (data) => {
  console.log("[USER] auth:success", JSON.stringify(data));

  // After user is authenticated, bring up admin and send command
  adminSocket = io(SOCKET_URL, {
    transports: ["polling"],
    autoConnect: true,
    forceNew: true,
    reconnectionAttempts: 2,
    extraHeaders: {
      Origin: "http://localhost:5173",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    },
  });

  adminSocket.on("connect", () => {
    console.log(`[ADMIN] connected: ${adminSocket.id}`);
    try {
      adminSocket.emit("authenticate", {
        token: adminToken,
        clientType: "admin",
      });
    } catch {}
  });

  adminSocket.on("auth:success", (info) => {
    console.log("[ADMIN] auth:success", JSON.stringify(info));
    const payload = {
      type: "notify",
      message: "Hello from admin E2E",
      title: "E2E Test",
      priority: "normal",
      timestamp: new Date().toISOString(),
    };
    console.log("[ADMIN] sending admin:command", JSON.stringify(payload));
    adminSocket.emit("admin:command", payload);
  });

  adminSocket.on("error", (err) => {
    console.log("[ADMIN] error", JSON.stringify(err));
  });

  adminSocket.on("command:response", (res) => {
    console.log("[ADMIN] command:response", JSON.stringify(res));
  });
});

userSocket.on("user:command", (cmd) => {
  console.log("[USER] user:command", JSON.stringify(cmd));
  setTimeout(() => safeExit(0), 300);
});

userSocket.on("auth:error", (err) => {
  console.log("[USER] auth:error", JSON.stringify(err));
});

userSocket.on("disconnect", (reason) => {
  console.log("[USER] disconnected:", reason);
});

userSocket.on("connect_error", (err) => {
  console.log("[USER] connect_error:", err?.message || String(err));
});

// Safety timeout
setTimeout(() => {
  console.log("[E2E] timeout");
  safeExit(1);
}, 15000);
