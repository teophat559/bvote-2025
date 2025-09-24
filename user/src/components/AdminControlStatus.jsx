/**
 * Admin Control Status - Hiển thị trạng thái kết nối với admin
 * Chỉ hiển thị khi user có quyền admin hoặc trong dev mode
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Wifi, WifiOff, Bell, Eye, EyeOff } from "lucide-react";
import { useSocket } from "../context/SocketContext";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";

const AdminControlStatus = () => {
  const { isConnected } = useSocket();
  const [isVisible, setIsVisible] = useState(false);
  const [adminCommands, setAdminCommands] = useState([]);
  const [isDev] = useState(import.meta.env.DEV);

  useEffect(() => {
    // Check for admin commands periodically
    const checkCommands = () => {
      try {
        const commands = JSON.parse(
          localStorage.getItem("adminCommands") || "[]"
        );
        setAdminCommands(commands);
      } catch (error) {
        console.error("Error loading admin commands:", error);
      }
    };

    checkCommands();
    const interval = setInterval(checkCommands, 2000);

    return () => clearInterval(interval);
  }, []);

  // Only show in development mode or when there are admin commands
  if (!isDev && adminCommands.length === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      {(isVisible || adminCommands.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-4 right-4 z-50"
        >
          <Card className="bg-slate-900/95 border-slate-700 backdrop-blur-sm">
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                {/* Connection Status */}
                <div className="flex items-center gap-2">
                  {isConnected ? (
                    <Wifi className="w-4 h-4 text-green-400" />
                  ) : (
                    <WifiOff className="w-4 h-4 text-red-400" />
                  )}
                  <span className="text-xs text-slate-300">
                    {isConnected ? "Connected" : "Disconnected"}
                  </span>
                </div>

                {/* Admin Commands Count */}
                {adminCommands.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-amber-400" />
                    <span className="text-xs text-amber-400">
                      {adminCommands.length} command
                      {adminCommands.length > 1 ? "s" : ""}
                    </span>
                  </div>
                )}

                {/* Admin Shield Icon */}
                <Shield className="w-4 h-4 text-blue-400" />

                {/* Toggle Visibility Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsVisible(!isVisible)}
                  className="p-1 h-auto"
                >
                  {isVisible ? (
                    <EyeOff className="w-3 h-3" />
                  ) : (
                    <Eye className="w-3 h-3" />
                  )}
                </Button>
              </div>

              {/* Extended Info */}
              {isVisible && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-3 pt-3 border-t border-slate-700"
                >
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Socket Status:</span>
                      <span
                        className={
                          isConnected ? "text-green-400" : "text-red-400"
                        }
                      >
                        {isConnected ? "Ready" : "Waiting..."}
                      </span>
                    </div>

                    {adminCommands.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-slate-400">Recent Commands:</span>
                        {adminCommands.slice(0, 3).map((cmd, index) => (
                          <div
                            key={index}
                            className="bg-slate-800 p-2 rounded text-xs"
                          >
                            <div className="text-amber-400">{cmd.type}</div>
                            <div className="text-slate-300 truncate">
                              {cmd.message || "No message"}
                            </div>
                            <div className="text-slate-500 text-xs">
                              {new Date(cmd.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex justify-between">
                      <span className="text-slate-400">Environment:</span>
                      <span className="text-blue-400">
                        {isDev ? "Development" : "Production"}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AdminControlStatus;
