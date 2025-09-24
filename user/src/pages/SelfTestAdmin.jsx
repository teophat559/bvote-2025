import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSocket } from "../context/SocketContext";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { toast } from "../components/ui/use-toast";

const SelfTestAdmin = () => {
  const { isConnected } = useSocket();
  const [logs, setLogs] = useState([]);
  const runningRef = useRef(false);

  const log = (message) => {
    setLogs((prev) =>
      [{ ts: new Date().toLocaleTimeString(), message }, ...prev].slice(0, 50)
    );
  };

  const pushAdminCommand = (type, message) => {
    const cmd = {
      id: `cmd_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      type,
      message,
      timestamp: new Date().toISOString(),
      adminId: "self-test",
      processed: false,
    };
    const commands = JSON.parse(localStorage.getItem("adminCommands") || "[]");
    commands.unshift(cmd);
    localStorage.setItem(
      "adminCommands",
      JSON.stringify(commands.slice(0, 20))
    );
    log(`Pushed command '${type}' to localStorage`);
  };

  const runOTPTest = () => {
    pushAdminCommand("approve-otp", "[SELF-TEST] Yêu cầu mã OTP");
    toast({ title: "SELF-TEST", description: "Đã gửi OTP command" });
  };

  const runKYCTest = () => {
    pushAdminCommand("request.verify", "[SELF-TEST] Yêu cầu KYC");
    toast({ title: "SELF-TEST", description: "Đã gửi KYC command" });
  };

  const runForceLogoutTest = () => {
    pushAdminCommand("force.logout", "[SELF-TEST] Buộc đăng xuất");
    toast({ title: "SELF-TEST", description: "Đã gửi Force Logout command" });
  };

  const runAll = async () => {
    if (runningRef.current) return;
    runningRef.current = true;
    log("Starting self-test sequence: OTP → KYC → Force Logout");
    runOTPTest();
    await new Promise((r) => setTimeout(r, 1500));
    runKYCTest();
    await new Promise((r) => setTimeout(r, 2000));
    runForceLogoutTest();
    // Sau force logout, app sẽ điều hướng /login
    runningRef.current = false;
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="bg-slate-900 border-slate-700">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-white text-xl font-semibold">
              Self-Test: Admin → User Realtime
            </h1>
            <span
              className={`px-2 py-1 rounded text-xs font-medium ${
                isConnected
                  ? "bg-green-600/20 text-green-300 border border-green-600/40"
                  : "bg-red-600/20 text-red-300 border border-red-600/40"
              }`}
            >
              {isConnected ? "Socket Connected" : "Socket Disconnected"}
            </span>
          </div>

          <div className="flex gap-2">
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={runOTPTest}
            >
              Gửi OTP
            </Button>
            <Button
              className="bg-indigo-600 hover:bg-indigo-700"
              onClick={runKYCTest}
            >
              Gửi KYC
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={runForceLogoutTest}
            >
              Gửi Force Logout
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={runAll}
            >
              Chạy tất cả
            </Button>
          </div>

          <div className="text-slate-300 text-sm">
            Ghi chú: Self-test đẩy lệnh vào localStorage để SocketContext chuyển
            thành sự kiện user:command.
          </div>

          <div className="bg-slate-800/70 border border-slate-700 rounded p-3 max-h-64 overflow-auto">
            {logs.length === 0 ? (
              <div className="text-slate-500 text-sm">
                Chưa có log. Hãy chạy test.
              </div>
            ) : (
              <ul className="space-y-1">
                {logs.map((l, idx) => (
                  <li key={idx} className="text-slate-300 text-xs">
                    <span className="text-slate-500">[{l.ts}]</span> {l.message}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SelfTestAdmin;
