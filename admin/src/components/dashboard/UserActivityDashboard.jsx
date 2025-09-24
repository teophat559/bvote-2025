/**
 * User Activity Dashboard Component
 * Enhanced real-time user activity monitoring with detailed analytics
 */

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { useSocket } from "../../hooks/useSocket";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Eye,
  MousePointer2,
  Vote,
  LogIn,
  LogOut,
  MessageSquare,
  Search,
  Filter,
  RefreshCw,
  BarChart3,
  PieChart,
  TrendingUp,
  Activity,
  Globe,
  Smartphone,
  Monitor,
  Mouse,
  Keyboard,
  Clock,
  MapPin,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

const UserActivityDashboard = () => {
  const { socket, isConnected } = useSocket();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterUser, setFilterUser] = useState("all");
  const [activeTab, setActiveTab] = useState("live");

  // User activity statistics
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalActivities: 0,
    byType: {},
    byHour: {},
    topPages: {},
    deviceStats: {},
  });

  useEffect(() => {
    if (!socket) return;

    const handleUserActivity = (data) => {
      console.log("📊 Received user activity:", data);

      setActivities((prev) => {
        const newActivities = [{ id: Date.now(), ...data }, ...prev];
        return newActivities.slice(0, 100); // Keep last 100 activities
      });

      // Update statistics
      updateStatistics(data);
      setLoading(false);
    };

    const handleUserActivitiesBatch = (batchData) => {
      console.log("📦 Received batch activities:", batchData);

      if (batchData.data && batchData.data.count) {
        setActivities((prev) => {
          const newActivity = {
            id: `batch-${Date.now()}`,
            type: "user.batch_activities",
            message: `Batch của ${batchData.data.count} hoạt động`,
            timestamp: batchData.timestamp,
            severity: "INFO",
            source: "batch",
            data: batchData.data,
          };
          return [newActivity, ...prev.slice(0, 99)];
        });
      }
    };

    // Listen for admin feed events that contain user activities
    socket.on("admin:feed", (data) => {
      if (data.type === "user.activity" || data.type.startsWith("user.")) {
        handleUserActivity(data);
      } else if (data.type === "user.batch_activities") {
        handleUserActivitiesBatch(data);
      }
    });

    // Request initial data
    setTimeout(() => setLoading(false), 1000);

    return () => {
      socket.off("admin:feed");
    };
  }, [socket]);

  const updateStatistics = (activity) => {
    setStats((prev) => {
      const newStats = { ...prev };

      // Update total activities
      newStats.totalActivities += 1;

      // Update by type
      const type = activity.data?.type || activity.type;
      newStats.byType[type] = (newStats.byType[type] || 0) + 1;

      // Update by hour
      const hour = new Date(activity.timestamp).getHours();
      newStats.byHour[hour] = (newStats.byHour[hour] || 0) + 1;

      // Update top pages
      if (activity.data?.page) {
        newStats.topPages[activity.data.page] =
          (newStats.topPages[activity.data.page] || 0) + 1;
      }

      // Update device stats
      if (activity.data?.userAgent) {
        const device = getDeviceType(activity.data.userAgent);
        newStats.deviceStats[device] = (newStats.deviceStats[device] || 0) + 1;
      }

      return newStats;
    });
  };

  const getDeviceType = (userAgent) => {
    if (!userAgent) return "Unknown";
    if (/Mobile|Android|iPhone|iPad/.test(userAgent)) return "Mobile";
    if (/Tablet/.test(userAgent)) return "Tablet";
    return "Desktop";
  };

  const getActivityIcon = (type) => {
    const iconMap = {
      "page.view": Eye,
      "user.click": MousePointer2,
      "vote.cast": Vote,
      "auth.login": LogIn,
      "auth.logout": LogOut,
      "session.start": LogIn,
      "session.end": LogOut,
      "user.form_submit": Keyboard,
      "user.scroll": Mouse,
      "auto_login.request": MessageSquare,
      default: Activity,
    };

    return iconMap[type] || iconMap.default;
  };

  const getActivityColor = (severity) => {
    const colorMap = {
      INFO: "text-blue-500",
      SUCCESS: "text-green-500",
      WARNING: "text-yellow-500",
      ERROR: "text-red-500",
      ACTION: "text-purple-500",
    };
    return colorMap[severity] || colorMap.INFO;
  };

  const filteredActivities = useMemo(() => {
    return activities.filter((activity) => {
      if (filterType !== "all" && !activity.type?.includes(filterType))
        return false;
      if (filterUser !== "all" && activity.data?.userId !== filterUser)
        return false;
      if (
        searchQuery &&
        !activity.message?.toLowerCase().includes(searchQuery.toLowerCase())
      )
        return false;
      return true;
    });
  }, [activities, filterType, filterUser, searchQuery]);

  const uniqueUsers = useMemo(() => {
    const users = new Set();
    activities.forEach((activity) => {
      if (activity.data?.userId) {
        users.add(activity.data.userId);
      }
    });
    return Array.from(users);
  }, [activities]);

  const topActivityTypes = useMemo(() => {
    return Object.entries(stats.byType)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
  }, [stats.byType]);

  const topPages = useMemo(() => {
    return Object.entries(stats.topPages)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
  }, [stats.topPages]);

  return (
    <div className="space-y-6">
      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">
                  Người dùng online
                </p>
                <p className="text-2xl font-bold">{uniqueUsers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Activity className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Tổng hoạt động</p>
                <p className="text-2xl font-bold">{stats.totalActivities}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Hoạt động/phút</p>
                <p className="text-2xl font-bold">
                  {(
                    stats.totalActivities /
                    Math.max(1, (Date.now() - Date.now() + 60000) / 60000)
                  ).toFixed(1)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Globe className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Trang phổ biến</p>
                <p className="text-sm font-medium">
                  {topPages[0]?.[0] || "N/A"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            User Activity Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="live">Live Activities</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
            </TabsList>

            <TabsContent value="live" className="space-y-4">
              {/* Filters */}
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  <Input
                    placeholder="Tìm kiếm hoạt động..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-64"
                  />
                </div>

                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Lọc theo loại" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="page">Xem trang</SelectItem>
                    <SelectItem value="click">Click</SelectItem>
                    <SelectItem value="vote">Bình chọn</SelectItem>
                    <SelectItem value="auth">Xác thực</SelectItem>
                    <SelectItem value="auto_login">Auto Login</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterUser} onValueChange={setFilterUser}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Lọc theo user" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả user</SelectItem>
                    {uniqueUsers.map((userId) => (
                      <SelectItem key={userId} value={userId}>
                        {userId}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Badge variant="secondary">
                  {filteredActivities.length} / {activities.length}
                </Badge>
              </div>

              {/* Live Activities Feed */}
              <div className="border rounded-lg">
                <ScrollArea className="h-96">
                  {!isConnected ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                      <RefreshCw className="h-8 w-8 animate-spin mb-2" />
                      <p>Đang kết nối...</p>
                    </div>
                  ) : loading ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                      <RefreshCw className="h-8 w-8 animate-spin mb-2" />
                      <p>Đang tải hoạt động...</p>
                    </div>
                  ) : filteredActivities.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                      <Eye className="h-12 w-12 mb-2" />
                      <p>Chưa có hoạt động nào</p>
                    </div>
                  ) : (
                    <AnimatePresence initial={false}>
                      {filteredActivities.map((activity) => {
                        const Icon = getActivityIcon(
                          activity.data?.type || activity.type
                        );
                        const colorClass = getActivityColor(activity.severity);

                        return (
                          <motion.div
                            key={activity.id}
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="flex items-start gap-3 p-4 border-b last:border-b-0 hover:bg-muted/50 transition-colors"
                          >
                            <Icon
                              className={`h-5 w-5 flex-shrink-0 ${colorClass}`}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-xs">
                                  {activity.data?.type || activity.type}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(
                                    new Date(activity.timestamp),
                                    {
                                      addSuffix: true,
                                      locale: vi,
                                    }
                                  )}
                                </span>
                              </div>

                              <p className="text-sm font-medium">
                                {activity.message}
                              </p>

                              {activity.data && (
                                <div className="mt-2 text-xs text-muted-foreground space-y-1">
                                  {activity.data.userId && (
                                    <div>👤 User: {activity.data.userId}</div>
                                  )}
                                  {activity.data.page && (
                                    <div>📄 Trang: {activity.data.page}</div>
                                  )}
                                  {activity.data.action && (
                                    <div>
                                      ⚡ Hành động: {activity.data.action}
                                    </div>
                                  )}
                                  {activity.data.contestantId && (
                                    <div>
                                      🏆 Thí sinh: {activity.data.contestantId}
                                    </div>
                                  )}
                                  {activity.data.sessionId && (
                                    <div>
                                      🔑 Session:{" "}
                                      {activity.data.sessionId.slice(0, 12)}...
                                    </div>
                                  )}
                                  {activity.data.userAgent && (
                                    <div>
                                      💻 Device:{" "}
                                      {getDeviceType(activity.data.userAgent)}
                                    </div>
                                  )}
                                  {activity.data.screenResolution && (
                                    <div>
                                      📺 Screen:{" "}
                                      {activity.data.screenResolution}
                                    </div>
                                  )}
                                  {activity.data.referrer && (
                                    <div>
                                      🔗 Referrer: {activity.data.referrer}
                                    </div>
                                  )}
                                  {activity.data.ipAddress && (
                                    <div>🌐 IP: {activity.data.ipAddress}</div>
                                  )}
                                  {activity.data.platform && (
                                    <div>
                                      🚀 Platform: {activity.data.platform}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  )}
                </ScrollArea>
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Top Activity Types */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Loại hoạt động phổ biến
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {topActivityTypes.map(([type, count]) => (
                        <div
                          key={type}
                          className="flex items-center justify-between"
                        >
                          <span className="text-sm">{type}</span>
                          <Badge variant="secondary">{count}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Top Pages */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Trang được xem nhiều
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {topPages.map(([page, count]) => (
                        <div
                          key={page}
                          className="flex items-center justify-between"
                        >
                          <span className="text-sm truncate flex-1">
                            {page}
                          </span>
                          <Badge variant="secondary">{count}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Device Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Thiết bị</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(stats.deviceStats).map(
                        ([device, count]) => (
                          <div
                            key={device}
                            className="flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              {device === "Desktop" && (
                                <Monitor className="h-4 w-4" />
                              )}
                              {device === "Mobile" && (
                                <Smartphone className="h-4 w-4" />
                              )}
                              {device === "Tablet" && (
                                <Smartphone className="h-4 w-4" />
                              )}
                              <span className="text-sm">{device}</span>
                            </div>
                            <Badge variant="secondary">{count}</Badge>
                          </div>
                        )
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Hourly Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Hoạt động theo giờ
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(stats.byHour)
                        .sort(([a], [b]) => parseInt(a) - parseInt(b))
                        .map(([hour, count]) => (
                          <div key={hour} className="flex items-center gap-3">
                            <span className="text-xs w-8">{hour}h</span>
                            <div className="flex-1 bg-muted rounded-full h-2">
                              <div
                                className="bg-blue-500 h-2 rounded-full"
                                style={{
                                  width: `${
                                    (count /
                                      Math.max(
                                        ...Object.values(stats.byHour)
                                      )) *
                                    100
                                  }%`,
                                }}
                              />
                            </div>
                            <span className="text-xs w-8">{count}</span>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="users" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Người dùng đang hoạt động
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {uniqueUsers.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">
                        Chưa có người dùng nào hoạt động
                      </p>
                    ) : (
                      uniqueUsers.map((userId) => {
                        const userActivities = activities.filter(
                          (a) => a.data?.userId === userId
                        );
                        const lastActivity = userActivities[0];

                        return (
                          <div
                            key={userId}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-2 h-2 bg-green-500 rounded-full" />
                              <div>
                                <p className="font-medium">{userId}</p>
                                <p className="text-xs text-muted-foreground">
                                  {userActivities.length} hoạt động
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">
                                Hoạt động cuối:
                              </p>
                              <p className="text-xs">
                                {lastActivity
                                  ? formatDistanceToNow(
                                      new Date(lastActivity.timestamp),
                                      {
                                        addSuffix: true,
                                        locale: vi,
                                      }
                                    )
                                  : "N/A"}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserActivityDashboard;
