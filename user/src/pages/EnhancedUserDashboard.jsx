import React, { useState, useEffect } from `react`;
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import {
  User,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  Zap,
  MessageSquare,
  Settings,
  Eye,
  Shield,
  Wifi,
  WifiOff,
  Bell,
  BellOff,
  RefreshCw,
  LogOut,
  Home,
  BarChart3,
  Lock,
  Unlock,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { useToast } from "../components/ui/use-toast";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { apiService } from "../services/apiService";
import ConnectionStatusBadge from "../components/ConnectionStatusBadge";
import RealtimeNotifications from "../components/RealtimeNotifications";

const EnhancedUserDashboard = () => {
  const [userStats, setUserStats] = useState({
    totalLogins: 0,
    successfulLogins: 0,
    failedLogins: 0,
    lastLoginTime: null,
    currentSession: null,
    adminConnected: false,
  });

  const [recentActivity, setRecentActivity] = useState([]);
  const [adminNotifications, setAdminNotifications] = useState([]);
  const [autoLoginStatus, setAutoLoginStatus] = useState({
    enabled: false,
    platform: null,
    status: "idle", // idle, pending, processing, completed, failed
    lastAttempt: null,
  });

  const [userPreferences, setUserPreferences] = useState({
    autoApproveLogins: false,
    enableNotifications: true,
    allowAdminControl: true,
    preferredPlatform: "facebook",
  });

  const { user, logout } = useAuth();
  const { socket, isConnected } = useSocket();
  const { toast } = useToast();

  // Load user data on mount
  useEffect(() => {
    loadUserStats();
    loadRecentActivity();
    loadUserPreferences();
  }, []);

  // WebSocket listeners for admin integration
  useEffect(() => {
    if (!socket) return;

    const handleAdminLoginRequest = (data) => {
      setAutoLoginStatus({
        enabled: true,
        platform: data.platform,
        status: "pending",
        lastAttempt: new Date().toISOString(),
      });

      // Show notification to user
      toast({
        title: `🔐 Admin Login Request`,
        description: `Admin đang yêu cầu đăng nhập ${data.platform}`,
        duration: 5000,
      });

      // Add to notifications
      setAdminNotifications((prev) => [
        {
          id: Date.now(),
          type: "login_request",
          platform: data.platform,
          message: `Admin yêu cầu đăng nhập ${data.platform}`,
          timestamp: new Date().toISOString(),
          status: "pending",
        },
        ...prev.slice(0, 9),
      ]);
    };

    const handleAdminCommand = (data) => {
      const { command, params } = data;

      switch (command) {
        case "auto_approve_login":
          handleAutoApproveLogin(params);
          break;
        case "request_otp":
          handleOTPRequest(params);
          break;
        case "take_screenshot":
          handleScreenshotRequest(params);
          break;
        case "system_notification":
          handleSystemNotification(params);
          break;
        default:
          console.log("Unknown admin command:", command);
      }
    };

    const handleLoginStatusUpdate = (data) => {
      setAutoLoginStatus((prev) => ({
        ...prev,
        status: data.status,
        lastAttempt: data.timestamp,
      }));

      // Update recent activity
      setRecentActivity((prev) => [
        {
          id: Date.now(),
          type: "login_attempt",
          platform: data.platform,
          status: data.status,
          timestamp: data.timestamp,
          details: data.details || {},
        },
        ...prev.slice(0, 19),
      ]);
    };

    socket.on("admin:login_request", handleAdminLoginRequest);
    socket.on("admin:command", handleAdminCommand);
    socket.on("login:status_update", handleLoginStatusUpdate);
    socket.on("admin:notification", handleSystemNotification);

    return () => {
      socket.off("admin:login_request", handleAdminLoginRequest);
      socket.off("admin:command", handleAdminCommand);
      socket.off("login:status_update", handleLoginStatusUpdate);
      socket.off("admin:notification", handleSystemNotification);
    };
  }, [socket]);

  const loadUserStats = async () => {
    try {
      const stats = await apiService.getUserStats();
      setUserStats(stats);
    } catch (error) {
      console.error("Failed to load user stats:", error);
      // Mock data for development
      setUserStats({
        totalLogins: 23,
        successfulLogins: 19,
        failedLogins: 4,
        lastLoginTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        currentSession: {
          platform: "facebook",
          startTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          status: "active",
        },
        adminConnected: isConnected,
      });
    }
  };

  const loadRecentActivity = async () => {
    try {
      const activity = await apiService.getUserActivity();
      setRecentActivity(activity);
    } catch (error) {
      console.error("Failed to load recent activity:", error);
      // Mock data
      setRecentActivity([
        {
          id: 1,
          type: "login_attempt",
          platform: "facebook",
          status: "completed",
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          details: { method: "auto_login", duration: 15000 },
        },
        {
          id: 2,
          type: "admin_command",
          command: "take_screenshot",
          status: "completed",
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          details: { filename: "screenshot_success.png" },
        },
        {
          id: 3,
          type: "feedback_sent",
          feedbackType: "positive",
          status: "sent",
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          details: { message: "Login rất nhanh và tiện lợi!" },
        },
      ]);
    }
  };

  const loadUserPreferences = async () => {
    try {
      const prefs = await apiService.getUserPreferences();
      setUserPreferences(prefs);
    } catch (error) {
      console.error("Failed to load user preferences:", error);
    }
  };

  const handleAutoApproveLogin = (params) => {
    setAutoLoginStatus((prev) => ({
      ...prev,
      status: "processing",
    }));

    toast({
      title: "✅ Auto Login Approved",
      description: `Đang thực hiện đăng nhập ${params.platform}`,
      duration: 3000,
    });

    // Simulate login process
    setTimeout(() => {
      setAutoLoginStatus((prev) => ({
        ...prev,
        status: "completed",
      }));

      toast({
        title: "🎉 Login Successful",
        description: `Đăng nhập ${params.platform} thành công!`,
        duration: 4000,
      });
    }, 5000);
  };

  const handleOTPRequest = (params) => {
    toast({
      title: "📱 OTP Request",
      description: `Admin yêu cầu OTP cho ${params.platform}`,
      duration: 5000,
    });

    // In real implementation, this would trigger OTP input modal
    setAdminNotifications((prev) => [
      {
        id: Date.now(),
        type: "otp_request",
        platform: params.platform,
        message: `Vui lòng cung cấp OTP cho ${params.platform}`,
        timestamp: new Date().toISOString(),
        status: "pending",
      },
      ...prev.slice(0, 9),
    ]);
  };

  const handleScreenshotRequest = (params) => {
    toast({
      title: "📸 Screenshot Request",
      description: "Admin yêu cầu chụp màn hình",
      duration: 3000,
    });

    // In real implementation, this would take actual screenshot
    setTimeout(() => {
      toast({
        title: "✅ Screenshot Taken",
        description: "Đã chụp màn hình thành công",
        duration: 2000,
      });
    }, 1000);
  };

  const handleSystemNotification = (params) => {
    toast({
      title: `🔔 ${params.title || "System Notification"}`,
      description: params.message,
      duration: params.duration || 4000,
    });

    setAdminNotifications((prev) => [
      {
        id: Date.now(),
        type: "system_notification",
        message: params.message,
        timestamp: new Date().toISOString(),
        status: "received",
      },
      ...prev.slice(0, 9),
    ]);
  };

  const updateUserPreference = async (key, value) => {
    try {
      const updatedPrefs = { ...userPreferences, [key]: value };
      setUserPreferences(updatedPrefs);
      await apiService.updateUserPreferences(updatedPrefs);

      toast({
        title: "⚙️ Settings Updated",
        description: "Cài đặt đã được cập nhật",
        duration: 2000,
      });
    } catch (error) {
      toast({
        title: "❌ Update Failed",
        description: "Không thể cập nhật cài đặt",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      idle: {
        color: "bg-gray-500/20 text-gray-400",
        icon: Clock,
        text: "Idle",
      },
      pending: {
        color: "bg-yellow-500/20 text-yellow-400",
        icon: Clock,
        text: "Pending",
      },
      processing: {
        color: "bg-blue-500/20 text-blue-400",
        icon: RefreshCw,
        text: "Processing",
      },
      completed: {
        color: "bg-green-500/20 text-green-400",
        icon: CheckCircle,
        text: "Completed",
      },
      failed: {
        color: "bg-red-500/20 text-red-400",
        icon: AlertCircle,
        text: "Failed",
      },
    };

    const config = statusConfig[status] || statusConfig.idle;
    const IconComponent = config.icon;

    return (
      <Badge className={`${config.color} border-0 flex items-center gap-1`}>
        <IconComponent className="w-3 h-3" />
        {config.text}
      </Badge>
    );
  };

  const getActivityIcon = (type) => {
    const icons = {
      login_attempt: Zap,
      admin_command: Settings,
      feedback_sent: MessageSquare,
      system_notification: Bell,
      screenshot: Eye,
    };
    return icons[type] || Activity;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-6">
      <Helmet>
        <title>User Dashboard - BVOTE</title>
      </Helmet>

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <User className="w-8 h-8 text-blue-500" />
              User Dashboard
            </h1>
            <p className="text-gray-300 mt-2">
              Welcome back, {user?.email || "User"}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <ConnectionStatusBadge />
            <Button
              onClick={() => (window.location.href = "/")}
              variant="outline"
              className="border-gray-600 text-white"
            >
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
            <Button
              onClick={logout}
              variant="outline"
              className="border-red-500 text-red-400 hover:bg-red-500/20"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Logins</p>
                  <p className="text-2xl font-bold text-white">
                    {userStats.totalLogins}
                  </p>
                </div>
                <BarChart3 className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Success Rate</p>
                  <p className="text-2xl font-bold text-green-400">
                    {userStats.totalLogins > 0
                      ? Math.round(
                          (userStats.successfulLogins / userStats.totalLogins) *
                            100
                        )
                      : 0}
                    %
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Admin Status</p>
                  <p className="text-sm font-bold text-white flex items-center gap-2">
                    {isConnected ? (
                      <>
                        <Wifi className="w-4 h-4 text-green-500" />
                        Connected
                      </>
                    ) : (
                      <>
                        <WifiOff className="w-4 h-4 text-red-500" />
                        Disconnected
                      </>
                    )}
                  </p>
                </div>
                <Shield className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Auto Login</p>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(autoLoginStatus.status)}
                  </div>
                </div>
                <Zap className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Auto Login Status */}
          <Card className="bg-gray-800/50 border-gray-700 lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                Auto Login Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {autoLoginStatus.enabled ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                        {autoLoginStatus.platform === "facebook" && "📘"}
                        {autoLoginStatus.platform === "google" && "🔍"}
                        {autoLoginStatus.platform === "instagram" && "📷"}
                        {!["facebook", "google", "instagram"].includes(
                          autoLoginStatus.platform
                        ) && "🌐"}
                      </div>
                      <div>
                        <div className="text-white font-medium capitalize">
                          {autoLoginStatus.platform || "Unknown"} Login
                        </div>
                        <div className="text-xs text-gray-400">
                          {autoLoginStatus.lastAttempt &&
                            `Last attempt: ${new Date(
                              autoLoginStatus.lastAttempt
                            ).toLocaleTimeString("vi-VN")}`}
                        </div>
                      </div>
                    </div>
                    {getStatusBadge(autoLoginStatus.status)}
                  </div>

                  {autoLoginStatus.status === "processing" && (
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-blue-400 mb-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Processing Login Request
                      </div>
                      <p className="text-sm text-gray-300">
                        Admin đang thực hiện đăng nhập tự động. Vui lòng chờ...
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Zap className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No active auto login sessions</p>
                  <p className="text-sm">Admin sẽ khởi tạo khi cần thiết</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* User Settings */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-gray-400" />
                Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-white">
                    Auto Approve
                  </div>
                  <div className="text-xs text-gray-400">
                    Tự động chấp nhận login
                  </div>
                </div>
                <button
                  onClick={() =>
                    updateUserPreference(
                      "autoApproveLogins",
                      !userPreferences.autoApproveLogins
                    )
                  }
                  className={`w-10 h-6 rounded-full transition-colors ${
                    userPreferences.autoApproveLogins
                      ? "bg-green-600"
                      : "bg-gray-600"
                  }`}
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full transition-transform ${
                      userPreferences.autoApproveLogins
                        ? "translate-x-5"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-white">
                    Notifications
                  </div>
                  <div className="text-xs text-gray-400">
                    Nhận thông báo từ admin
                  </div>
                </div>
                <button
                  onClick={() =>
                    updateUserPreference(
                      "enableNotifications",
                      !userPreferences.enableNotifications
                    )
                  }
                  className={`w-10 h-6 rounded-full transition-colors ${
                    userPreferences.enableNotifications
                      ? "bg-green-600"
                      : "bg-gray-600"
                  }`}
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full transition-transform ${
                      userPreferences.enableNotifications
                        ? "translate-x-5"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-white">
                    Admin Control
                  </div>
                  <div className="text-xs text-gray-400">
                    Cho phép admin điều khiển
                  </div>
                </div>
                <button
                  onClick={() =>
                    updateUserPreference(
                      "allowAdminControl",
                      !userPreferences.allowAdminControl
                    )
                  }
                  className={`w-10 h-6 rounded-full transition-colors ${
                    userPreferences.allowAdminControl
                      ? "bg-green-600"
                      : "bg-gray-600"
                  }`}
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full transition-transform ${
                      userPreferences.allowAdminControl
                        ? "translate-x-5"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity & Notifications */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-green-500" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivity.length > 0 ? (
                  recentActivity.slice(0, 8).map((activity) => {
                    const IconComponent = getActivityIcon(activity.type);
                    return (
                      <div
                        key={activity.id}
                        className="flex items-center gap-3 p-3 bg-gray-700/30 rounded-lg"
                      >
                        <IconComponent className="w-5 h-5 text-blue-400" />
                        <div className="flex-1">
                          <div className="text-sm text-white">
                            {activity.type === "login_attempt" &&
                              `Login attempt: ${activity.platform}`}
                            {activity.type === "admin_command" &&
                              `Admin command: ${activity.command}`}
                            {activity.type === "feedback_sent" &&
                              `Feedback sent: ${activity.feedbackType}`}
                            {activity.type === "system_notification" &&
                              "System notification received"}
                          </div>
                          <div className="text-xs text-gray-400">
                            {new Date(activity.timestamp).toLocaleString(
                              "vi-VN"
                            )}
                          </div>
                        </div>
                        {getStatusBadge(activity.status)}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No recent activity</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Admin Notifications */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-orange-500" />
                Admin Notifications
                {adminNotifications.length > 0 && (
                  <Badge className="bg-orange-500/20 text-orange-400 border-0">
                    {adminNotifications.length}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {adminNotifications.length > 0 ? (
                  adminNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="p-3 bg-gray-700/30 rounded-lg"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="text-sm text-white">
                            {notification.message}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {new Date(notification.timestamp).toLocaleString(
                              "vi-VN"
                            )}
                          </div>
                        </div>
                        {getStatusBadge(notification.status)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <BellOff className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No admin notifications</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Realtime Notifications Component */}
      <RealtimeNotifications />
    </div>
  );
};

export default EnhancedUserDashboard;
