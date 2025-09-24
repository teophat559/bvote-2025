// E2E user socket client
import { io } from "socket.io-client";
import fs from "fs";
import path from "path";

const url = process.env.SOCKET_URL || "http://localhost:3000";
let token = process.env.USER_TOKEN || "";
if (!token) {
  try {
    const filePath = path.resolve(process.cwd(), "test-logs/user.jwt");
    if (fs.existsSync(filePath)) {
      token = fs.readFileSync(filePath, "utf8").trim();
    }
  } catch {}
}
if (!token) token = "mock_token_for_testing"; // fallback for simple-server

const socket = io(url, {
  transports: ["polling"],
  autoConnect: true,
  forceNew: true,
  reconnectionAttempts: 2,
  extraHeaders: { Origin: "http://localhost:5173" },
});

let didReceiveCommand = false;
let exitTimer = null;

function safeExit(code = 0) {
  try {
    socket.disconnect();
  } catch {}
  process.exit(code);
}

socket.on("connect", () => {
  console.log(`[USER] connected: ${socket.id}`);
  try {
    socket.emit("authenticate", { token, clientType: "user" });
  } catch {}
});

socket.on("auth:success", (data) => {
  console.log("[USER] auth:success", JSON.stringify(data));
});

socket.on("auth:error", (err) => {
  console.log("[USER] auth:error", JSON.stringify(err));
  safeExit(2);
});

socket.on("user:command", (cmd) => {
  didReceiveCommand = true;
  console.log("[USER] user:command", JSON.stringify(cmd));
  clearTimeout(exitTimer);
  exitTimer = setTimeout(() => safeExit(0), 500);
});

socket.on("disconnect", (reason) => {
  console.log("[USER] disconnected:", reason);
  if (!didReceiveCommand) {
    safeExit(1);
  }
});

socket.on("connect_error", (err) => {
  console.log("[USER] connect_error:", err?.message || String(err));
});

// Safety timeout (10s)
setTimeout(() => {
  if (!didReceiveCommand) {
    console.log("[USER] timeout waiting for command");
    safeExit(1);
  }
}, 10000);
