import React, { useState, useEffect } from "react";
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
  History,
  ThumbsUp,
  ThumbsDown,
  Flag,
  HelpCircle,
  Send,
  Search,
  Filter,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useToast } from "../components/ui/use-toast";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { apiService } from "../services/apiService";
import AutoLoginIntegration from "../components/AutoLoginIntegration";

const UserDashboardPage = () => {
  // User stats and data
  const [userStats, setUserStats] = useState({
    totalLogins: 0,
    successfulLogins: 0,
    failedLogins: 0,
    lastLoginTime: null,
    adminConnected: false,
  });

  const [accessHistory, setAccessHistory] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [adminNotifications, setAdminNotifications] = useState([]);

  // Auto login status
  const [autoLoginStatus, setAutoLoginStatus] = useState({
    enabled: false,
    platform: null,
    status: "idle", // idle, pending, processing, completed, failed
    lastAttempt: null,
  });

  // User preferences
  const [userPreferences, setUserPreferences] = useState({
    autoApproveLogins: false,
    enableNotifications: true,
    allowAdminControl: true,
    preferredPlatform: "facebook",
  });

  // UI states
  const [loading, setLoading] = useState(true);
  const [showAutoLogin, setShowAutoLogin] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [feedbackLoading, setFeedbackLoading] = useState(new Map());

  const { user, logout } = useAuth();
  const { socket, isConnected } = useSocket();
  const { toast } = useToast();

  // Load initial data
  useEffect(() => {
    loadUserData();
  }, []);

  // WebSocket integration for admin connection
  useEffect(() => {
    setUserStats((prev) => ({ ...prev, adminConnected: isConnected }));
  }, [isConnected]);

  // WebSocket listeners for real-time updates
  useEffect(() => {
    if (!socket) return;

    const handleAdminLoginRequest = (data) => {
      setAutoLoginStatus({
        enabled: true,
        platform: data.platform,
        status: "pending",
        lastAttempt: new Date().toISOString(),
      });

      setShowAutoLogin(true);

      toast({
        title: `🔐 Admin Login Request`,
        description: `Admin yêu cầu đăng nhập ${data.platform}`,
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

      // Update access history if completed
      if (data.status === "completed") {
        const newRecord = {
          id: Date.now(),
          platform: data.platform,
          email: user?.email || "user@example.com",
          status: "success",
          timestamp: data.timestamp,
          method: "auto_login",
          duration: data.duration || 15000,
          ipAddress: "192.168.1.100",
        };
        setAccessHistory((prev) => [newRecord, ...prev]);

        // Update stats
        setUserStats((prev) => ({
          ...prev,
          totalLogins: prev.totalLogins + 1,
          successfulLogins: prev.successfulLogins + 1,
          lastLoginTime: data.timestamp,
        }));
      }
    };

    const handleAdminNotification = (data) => {
      setAdminNotifications((prev) => [
        {
          id: Date.now(),
          type: "system_notification",
          message: data.message,
          timestamp: new Date().toISOString(),
          status: "received",
        },
        ...prev.slice(0, 9),
      ]);

      toast({
        title: `🔔 ${data.title || "Admin Notification"}`,
        description: data.message,
        duration: data.duration || 4000,
      });
    };

    const handleFeedbackResponse = (data) => {
      setAdminNotifications((prev) => [
        {
          id: Date.now(),
          type: "feedback_response",
          message: `Admin đã phản hồi feedback của bạn`,
          timestamp: new Date().toISOString(),
          status: "received",
          details: data,
        },
        ...prev.slice(0, 9),
      ]);

      toast({
        title: "💬 Admin Response",
        description: data.adminResponse || "Admin đã phản hồi feedback của bạn",
        duration: 4000,
      });
    };

    socket.on("admin:login_request", handleAdminLoginRequest);
    socket.on("login:status_update", handleLoginStatusUpdate);
    socket.on("admin:notification", handleAdminNotification);
    socket.on("feedback:admin_response", handleFeedbackResponse);

    return () => {
      socket.off("admin:login_request", handleAdminLoginRequest);
      socket.off("login:status_update", handleLoginStatusUpdate);
      socket.off("admin:notification", handleAdminNotification);
      socket.off("feedback:admin_response", handleFeedbackResponse);
    };
  }, [socket, user, toast]);

  const loadUserData = async () => {
    try {
      setLoading(true);

      // Load user stats, access history, and preferences in parallel
      const [stats, history, prefs] = await Promise.all([
        apiService.getUserStats().catch(() => generateMockStats()),
        apiService.getUserAccessHistory().catch(() => generateMockHistory()),
        apiService.getUserPreferences().catch(() => userPreferences),
      ]);

      setUserStats(stats);
      setAccessHistory(history);
      setUserPreferences(prefs);

      // Generate recent activity from access history
      const activity = history.slice(0, 10).map((record, index) => ({
        id: record.id + 1000,
        type: "login_attempt",
        platform: record.platform,
        status: record.status === "success" ? "completed" : "failed",
        timestamp: record.timestamp,
        details: { method: record.method, duration: record.duration },
      }));
      setRecentActivity(activity);
    } catch (error) {
      console.error("Failed to load user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateMockStats = () => ({
    totalLogins: 23,
    successfulLogins: 19,
    failedLogins: 4,
    lastLoginTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    adminConnected: isConnected,
  });

  const generateMockHistory = () => [
    {
      id: 1,
      platform: "Facebook",
      email: user?.email || "user@example.com",
      status: "success",
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      method: "auto_login",
      duration: 15000,
      ipAddress: "192.168.1.100",
    },
    {
      id: 2,
      platform: "Google",
      email: user?.email || "user@example.com",
      status: "success",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      method: "manual",
      duration: 25000,
      ipAddress: "192.168.1.100",
    },
    {
      id: 3,
      platform: "Instagram",
      email: user?.email || "user@example.com",
      status: "failed",
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      method: "auto_login",
      duration: 0,
      ipAddress: "192.168.1.100",
      error: "Captcha verification failed",
    },
  ];

  const sendFeedback = async (type, message = "") => {
    const feedbackId = `feedback_${Date.now()}`;
    setFeedbackLoading((prev) => new Map(prev).set(feedbackId, true));

    try {
      await apiService.sendUserFeedback({
        type,
        message,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      });

      // Add to recent activity
      setRecentActivity((prev) => [
        {
          id: Date.now(),
          type: "feedback_sent",
          feedbackType: type,
          status: "sent",
          timestamp: new Date().toISOString(),
          details: { message },
        },
        ...prev.slice(0, 19),
      ]);

      const feedbackLabels = {
        positive: "tích cực",
        negative: "tiêu cực",
        report: "báo cáo lỗi",
        question: "câu hỏi",
      };

      toast({
        title: `📝 Feedback Sent`,
        description: `Đã gửi feedback ${feedbackLabels[type]} thành công`,
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "❌ Send Failed",
        description: "Không thể gửi feedback",
        variant: "destructive",
      });
    } finally {
      setFeedbackLoading((prev) => {
        const newMap = new Map(prev);
        newMap.delete(feedbackId);
        return newMap;
      });
    }
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
      success: {
        color: "bg-green-500/20 text-green-400",
        icon: CheckCircle,
        text: "Success",
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

  const getPlatformIcon = (platform) => {
    const icons = {
      facebook: "📘",
      google: "🔍",
      instagram: "📷",
      tiktok: "🎵",
      twitter: "🐦",
      linkedin: "💼",
    };
    return icons[platform?.toLowerCase()] || "🌐";
  };

  const getActivityIcon = (type) => {
    const icons = {
      login_attempt: Zap,
      feedback_sent: MessageSquare,
      admin_notification: Bell,
      system_update: Settings,
    };
    return icons[type] || Activity;
  };

  // Filter access history
  const filteredHistory = accessHistory.filter((record) => {
    const matchesSearch =
      !searchQuery ||
      record.platform.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      filterStatus === "all" || record.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

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
            {/* Connection Status */}
            <div
              className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                isConnected
                  ? "bg-green-500/20 text-green-400 border border-green-500/30"
                  : "bg-red-500/20 text-red-400 border border-red-500/30"
              }`}
            >
              {isConnected ? (
                <>
                  <Wifi className="w-4 h-4" />
                  Admin Connected
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4" />
                  Disconnected
                </>
              )}
            </div>

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
                  <p className="text-gray-400 text-sm">Auto Login</p>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(autoLoginStatus.status)}
                  </div>
                </div>
                <Zap className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Notifications</p>
                  <p className="text-2xl font-bold text-orange-400">
                    {adminNotifications.length}
                  </p>
                </div>
                <Bell className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Access History */}
          <Card className="bg-gray-800/50 border-gray-700 lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5 text-blue-500" />
                  Access History
                </CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 w-40 bg-gray-700 border-gray-600 text-white text-sm"
                    />
                  </div>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded text-white"
                  >
                    <option value="all">All</option>
                    <option value="success">Success</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredHistory.length > 0 ? (
                  filteredHistory.slice(0, 8).map((record) => (
                    <div
                      key={record.id}
                      className="flex items-center gap-3 p-3 bg-gray-700/30 rounded-lg"
                    >
                      <div className="text-2xl">
                        {getPlatformIcon(record.platform)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium">
                            {record.platform}
                          </span>
                          {getStatusBadge(record.status)}
                        </div>
                        <div className="text-sm text-gray-400">
                          {record.email} •{" "}
                          {new Date(record.timestamp).toLocaleString("vi-VN")}
                        </div>
                        {record.method && (
                          <div className="text-xs text-gray-500">
                            Method: {record.method} • Duration:{" "}
                            {record.duration
                              ? `${Math.round(record.duration / 1000)}s`
                              : "N/A"}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No access history found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions & Settings */}
          <div className="space-y-6">
            {/* Quick Feedback */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-green-500" />
                  Quick Feedback
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => sendFeedback("positive")}
                    disabled={feedbackLoading.size > 0}
                    className="bg-green-600 hover:bg-green-700 text-white"
                    size="sm"
                  >
                    <ThumbsUp className="w-4 h-4 mr-1" />
                    Good
                  </Button>
                  <Button
                    onClick={() => sendFeedback("negative")}
                    disabled={feedbackLoading.size > 0}
                    variant="outline"
                    className="border-red-500 text-red-400 hover:bg-red-500/20"
                    size="sm"
                  >
                    <ThumbsDown className="w-4 h-4 mr-1" />
                    Issue
                  </Button>
                  <Button
                    onClick={() => sendFeedback("report")}
                    disabled={feedbackLoading.size > 0}
                    variant="outline"
                    className="border-orange-500 text-orange-400 hover:bg-orange-500/20"
                    size="sm"
                  >
                    <Flag className="w-4 h-4 mr-1" />
                    Report
                  </Button>
                  <Button
                    onClick={() => sendFeedback("question")}
                    disabled={feedbackLoading.size > 0}
                    variant="outline"
                    className="border-blue-500 text-blue-400 hover:bg-blue-500/20"
                    size="sm"
                  >
                    <HelpCircle className="w-4 h-4 mr-1" />
                    Help
                  </Button>
                </div>
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
                  recentActivity.slice(0, 6).map((activity) => {
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
                            {activity.type === "feedback_sent" &&
                              `Feedback sent: ${activity.feedbackType}`}
                            {activity.type === "admin_notification" &&
                              "Admin notification received"}
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

      {/* Auto Login Integration Modal */}
      <AutoLoginIntegration
        isVisible={showAutoLogin}
        onClose={() => setShowAutoLogin(false)}
      />
    </div>
  );
};

export default UserDashboardPage;
