/**
 * Enhanced Control Panel Component
 * Bảng điều khiển với các nút phát sáng, màu xanh dương, bo tròn
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { motion } from "framer-motion";
import {
  LogIn,
  UserPlus,
  CheckCircle,
  Shield,
  Mail,
  Phone,
  Key,
  RotateCcw,
  Zap,
  Settings,
  Power,
  Chrome,
} from "lucide-react";
import toast from "react-hot-toast";

const EnhancedControlPanel = ({ onAction }) => {
  const [autoLoginEnabled, setAutoLoginEnabled] = useState(true);
  const [loadingStates, setLoadingStates] = useState({});

  const setLoading = (actionId, isLoading) => {
    setLoadingStates((prev) => ({
      ...prev,
      [actionId]: isLoading,
    }));
  };

  const handleAction = async (actionId, actionName, handler) => {
    setLoading(actionId, true);
    try {
      await handler();
      toast.success(`${actionName} thành công!`);
      onAction?.(actionId, actionName);
    } catch (error) {
      toast.error(`Lỗi ${actionName}: ${error.message}`);
    } finally {
      setLoading(actionId, false);
    }
  };

  const controlActions = [
    {
      id: "auto_login",
      name: "Auto Login",
      icon: LogIn,
      color: "from-blue-500 to-blue-600",
      description: "Khởi động auto login",
      action: () => console.log("Auto Login triggered"),
    },
    {
      id: "create_login",
      name: "Tạo Login",
      icon: UserPlus,
      color: "from-green-500 to-green-600",
      description: "Tạo request login mới",
      action: () => console.log("Create Login triggered"),
    },
    {
      id: "approve",
      name: "Phê duyệt",
      icon: CheckCircle,
      color: "from-emerald-500 to-emerald-600",
      description: "Phê duyệt requests",
      action: () => console.log("Approve triggered"),
    },
    {
      id: "otp",
      name: "OTP",
      icon: Shield,
      color: "from-purple-500 to-purple-600",
      description: "Quản lý OTP",
      action: () => console.log("OTP triggered"),
    },
    {
      id: "email",
      name: "Email",
      icon: Mail,
      color: "from-orange-500 to-orange-600",
      description: "Cấu hình email",
      action: () => console.log("Email triggered"),
    },
    {
      id: "phone",
      name: "Số điện thoại",
      icon: Phone,
      color: "from-cyan-500 to-cyan-600",
      description: "Quản lý số điện thoại",
      action: () => console.log("Phone triggered"),
    },
    {
      id: "password",
      name: "Mật Khẩu",
      icon: Key,
      color: "from-red-500 to-red-600",
      description: "Quản lý mật khẩu",
      action: () => console.log("Password triggered"),
    },
    {
      id: "reset",
      name: "Reset",
      icon: RotateCcw,
      color: "from-gray-500 to-gray-600",
      description: "Reset hệ thống",
      action: () => console.log("Reset triggered"),
    },
  ];

  const quickToggleActions = [
    {
      id: "auto_toggle",
      name: autoLoginEnabled ? "Tắt Auto" : "Bật Auto",
      icon: Power,
      enabled: autoLoginEnabled,
      action: () => setAutoLoginEnabled(!autoLoginEnabled),
    },
    {
      id: "chrome_config",
      name: "Chrome Config",
      icon: Chrome,
      action: () => console.log("Chrome Config triggered"),
    },
    {
      id: "system_settings",
      name: "Cài đặt",
      icon: Settings,
      action: () => console.log("System Settings triggered"),
    },
  ];

  const buttonVariants = {
    hover: {
      scale: 1.05,
      boxShadow: "0 10px 25px rgba(59, 130, 246, 0.3)",
      transition: { duration: 0.2 },
    },
    tap: { scale: 0.95 },
    initial: { scale: 1 },
  };

  return (
    <div className="space-y-6">
      {/* Main Control Panel */}
      <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl text-white">
            <Zap className="h-6 w-6 text-blue-400" />
            Bảng Điều Khiển Chính
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {controlActions.map((action) => {
              const IconComponent = action.icon;
              const isLoading = loadingStates[action.id];

              return (
                <motion.div
                  key={action.id}
                  variants={buttonVariants}
                  initial="initial"
                  whileHover="hover"
                  whileTap="tap"
                  className="relative"
                >
                  <Button
                    onClick={() =>
                      handleAction(action.id, action.name, action.action)
                    }
                    disabled={isLoading}
                    className={`
                      w-full h-20 flex flex-col items-center justify-center gap-2
                      bg-gradient-to-br ${action.color}
                      hover:shadow-lg hover:shadow-blue-500/25
                      border-0 rounded-xl text-white font-medium
                      transition-all duration-300 ease-out
                      ${
                        isLoading
                          ? "opacity-70 cursor-not-allowed"
                          : "hover:brightness-110"
                      }
                      relative overflow-hidden
                    `}
                    style={{
                      boxShadow:
                        "0 4px 15px rgba(59, 130, 246, 0.2), inset 0 1px 2px rgba(255, 255, 255, 0.1)",
                    }}
                  >
                    {/* Glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                    {isLoading ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
                    ) : (
                      <IconComponent className="h-6 w-6 drop-shadow-sm" />
                    )}
                    <span className="text-xs text-center leading-tight drop-shadow-sm">
                      {action.name}
                    </span>
                  </Button>

                  {/* Tooltip */}
                  <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                    {action.description}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Toggle Section */}
      <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-white">
            <Settings className="h-5 w-5 text-blue-400" />
            Điều Khiển Nhanh
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {quickToggleActions.map((action) => {
              const IconComponent = action.icon;
              const isEnabled = action.enabled;

              return (
                <motion.div
                  key={action.id}
                  variants={buttonVariants}
                  initial="initial"
                  whileHover="hover"
                  whileTap="tap"
                >
                  <Button
                    onClick={action.action}
                    variant={isEnabled === false ? "destructive" : "default"}
                    className={`
                      h-12 px-6 flex items-center gap-2 rounded-lg
                      ${
                        isEnabled === false
                          ? "bg-red-500/20 text-red-300 border-red-500/30 hover:bg-red-500/30"
                          : "bg-blue-500/20 text-blue-300 border-blue-500/30 hover:bg-blue-500/30"
                      }
                      transition-all duration-200
                    `}
                  >
                    <IconComponent className="h-4 w-4" />
                    {action.name}
                    {action.id === "auto_toggle" && (
                      <Badge
                        variant={autoLoginEnabled ? "default" : "destructive"}
                        className="ml-2 text-xs"
                      >
                        {autoLoginEnabled ? "ON" : "OFF"}
                      </Badge>
                    )}
                  </Button>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Status Indicators */}
      <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-slate-700">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div
                className={`w-3 h-3 rounded-full mx-auto mb-2 ${
                  autoLoginEnabled ? "bg-green-400 animate-pulse" : "bg-red-400"
                }`}
              />
              <p className="text-xs text-gray-300">Auto Login</p>
              <p className="text-xs text-gray-500">
                {autoLoginEnabled ? "Hoạt động" : "Tắt"}
              </p>
            </div>

            <div className="text-center">
              <div className="w-3 h-3 rounded-full bg-blue-400 animate-pulse mx-auto mb-2" />
              <p className="text-xs text-gray-300">Chrome Profiles</p>
              <p className="text-xs text-gray-500">5 Active</p>
            </div>

            <div className="text-center">
              <div className="w-3 h-3 rounded-full bg-yellow-400 animate-pulse mx-auto mb-2" />
              <p className="text-xs text-gray-300">Pending Approvals</p>
              <p className="text-xs text-gray-500">3 Waiting</p>
            </div>

            <div className="text-center">
              <div className="w-3 h-3 rounded-full bg-purple-400 animate-pulse mx-auto mb-2" />
              <p className="text-xs text-gray-300">OTP Requests</p>
              <p className="text-xs text-gray-500">1 Active</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedControlPanel;
