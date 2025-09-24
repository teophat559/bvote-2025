import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Activity,
  Monitor,
  Play,
  Pause,
  Square,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  AlertTriangle,
  Eye,
  Download,
  RefreshCw,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Cpu,
  Timer,
  Network,
  Globe,
  Shield,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const AutoLoginMonitor = ({ isOpen, onClose }) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("live");
  const [isLiveMode, setIsLiveMode] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);

  // Simulate real-time data
  const [systemMetrics, setSystemMetrics] = useState({
    cpu: 45,
    memory: 62,
    network: 78,
    activeSessions: 12,
    queuedRequests: 3,
    completedToday: 156,
    successRate: 94.2,
    avgResponseTime: 1.8,
  });

  const [liveSessions, setLiveSessions] = useState([
    {
      id: "session_001",
      platform: "Facebook",
      email: "user1@example.com",
      status: "running",
      progress: 75,
      stage: "Logging in",
      startTime: "14:23:45",
      duration: "00:02:15",
      proxy: "US-West-1",
      userAgent: "Chrome 120.0",
      lastActivity: "Entering password",
      screenshots: 3,
      logs: 12,
      estimatedCompletion: "00:00:45",
    },
    {
      id: "session_002",
      platform: "Gmail",
      email: "user2@gmail.com",
      status: "waiting",
      progress: 0,
      stage: "Queued",
      startTime: "14:25:10",
      duration: "00:00:00",
      proxy: "EU-Central-1",
      userAgent: "Firefox 119.0",
      lastActivity: "Waiting for slot",
      screenshots: 0,
      logs: 2,
      estimatedCompletion: "00:01:30",
    },
    {
      id: "session_003",
      platform: "Instagram",
      email: "user3@instagram.com",
      status: "completed",
      progress: 100,
      stage: "Success",
      startTime: "14:20:30",
      duration: "00:01:45",
      proxy: "Asia-East-1",
      userAgent: "Chrome 120.0",
      lastActivity: "Login successful",
      screenshots: 5,
      logs: 18,
      estimatedCompletion: "Completed",
    },
    {
      id: "session_004",
      platform: "TikTok",
      email: "user4@tiktok.com",
      status: "failed",
      progress: 45,
      stage: "Error",
      startTime: "14:22:15",
      duration: "00:03:20",
      proxy: "US-East-1",
      userAgent: "Safari 17.0",
      lastActivity: "CAPTCHA detection",
      screenshots: 4,
      logs: 22,
      estimatedCompletion: "Failed",
    },
  ]);

  const [sessionHistory, setSessionHistory] = useState([
    {
      id: "hist_001",
      timestamp: "2024-01-20 14:15:30",
      platform: "Facebook",
      email: "user1@example.com",
      duration: "00:02:15",
      status: "success",
      responseTime: 2150,
      proxy: "US-West-1",
      errorMessage: null,
    },
    {
      id: "hist_002",
      timestamp: "2024-01-20 14:12:45",
      platform: "Gmail",
      email: "user2@gmail.com",
      duration: "00:01:30",
      status: "success",
      responseTime: 1500,
      proxy: "EU-Central-1",
      errorMessage: null,
    },
    {
      id: "hist_003",
      timestamp: "2024-01-20 14:10:20",
      platform: "Instagram",
      email: "user3@instagram.com",
      duration: "00:02:45",
      status: "failed",
      responseTime: 2750,
      proxy: "Asia-East-1",
      errorMessage: "2FA verification failed",
    },
  ]);

  // Simulate real-time updates
  useEffect(() => {
    if (!isLiveMode) return;

    const interval = setInterval(() => {
      // Update system metrics
      setSystemMetrics((prev) => ({
        ...prev,
        cpu: Math.max(20, Math.min(90, prev.cpu + (Math.random() - 0.5) * 10)),
        memory: Math.max(
          30,
          Math.min(85, prev.memory + (Math.random() - 0.5) * 8)
        ),
        network: Math.max(
          40,
          Math.min(95, prev.network + (Math.random() - 0.5) * 15)
        ),
        activeSessions: Math.max(
          0,
          Math.min(
            20,
            prev.activeSessions + Math.floor((Math.random() - 0.5) * 3)
          )
        ),
      }));

      // Update live sessions
      setLiveSessions((prev) =>
        prev.map((session) => {
          if (session.status === "running") {
            const newProgress = Math.min(
              100,
              session.progress + Math.random() * 10
            );
            return {
              ...session,
              progress: newProgress,
              duration: updateDuration(session.duration),
              lastActivity:
                newProgress > 90
                  ? "Finalizing login"
                  : newProgress > 60
                  ? "Entering credentials"
                  : newProgress > 30
                  ? "Loading page"
                  : "Connecting",
            };
          }
          return session;
        })
      );
    }, 2000);

    return () => clearInterval(interval);
  }, [isLiveMode]);

  const updateDuration = (duration) => {
    const [hours, minutes, seconds] = duration.split(":").map(Number);
    const totalSeconds = hours * 3600 + minutes * 60 + seconds + 2;
    const newHours = Math.floor(totalSeconds / 3600);
    const newMinutes = Math.floor((totalSeconds % 3600) / 60);
    const newSecs = totalSeconds % 60;
    return `${newHours.toString().padStart(2, "0")}:${newMinutes
      .toString()
      .padStart(2, "0")}:${newSecs.toString().padStart(2, "0")}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "running":
        return "text-blue-500";
      case "completed":
        return "text-green-500";
      case "failed":
        return "text-red-500";
      case "waiting":
        return "text-yellow-500";
      case "paused":
        return "text-gray-500";
      default:
        return "text-gray-500";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "running":
        return Play;
      case "completed":
        return CheckCircle;
      case "failed":
        return XCircle;
      case "waiting":
        return Clock;
      case "paused":
        return Pause;
      default:
        return Activity;
    }
  };

  const getPlatformIcon = (platform) => {
    switch (platform) {
      case "Facebook":
        return "🔵";
      case "Gmail":
        return "📧";
      case "Instagram":
        return "📷";
      case "TikTok":
        return "🎵";
      case "Twitter":
        return "🐦";
      case "Zalo":
        return "🔴";
      default:
        return "🌐";
    }
  };

  const handlePauseSession = (sessionId) => {
    setLiveSessions((prev) =>
      prev.map((session) =>
        session.id === sessionId
          ? {
              ...session,
              status: session.status === "running" ? "paused" : "running",
            }
          : session
      )
    );
  };

  const handleStopSession = (sessionId) => {
    setLiveSessions((prev) =>
      prev.map((session) =>
        session.id === sessionId
          ? { ...session, status: "failed", stage: "Stopped by user" }
          : session
      )
    );
  };

  const handleViewSession = (session) => {
    setSelectedSession(session);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Monitor className="w-5 h-5" />
            Auto Login Monitor
          </DialogTitle>
          <DialogDescription>
            Real-time monitoring và analytics cho Auto Login sessions
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Controls */}
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Button
                variant={activeTab === "live" ? "default" : "outline"}
                onClick={() => setActiveTab("live")}
                className="flex items-center gap-2"
              >
                <Activity className="w-4 h-4" />
                Live Sessions
              </Button>
              <Button
                variant={activeTab === "history" ? "default" : "outline"}
                onClick={() => setActiveTab("history")}
                className="flex items-center gap-2"
              >
                <BarChart3 className="w-4 h-4" />
                History
              </Button>
              <Button
                variant={activeTab === "analytics" ? "default" : "outline"}
                onClick={() => setActiveTab("analytics")}
                className="flex items-center gap-2"
              >
                <TrendingUp className="w-4 h-4" />
                Analytics
              </Button>
            </div>

            <div className="flex gap-2 items-center">
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    isLiveMode ? "bg-green-500 animate-pulse" : "bg-gray-400"
                  }`}
                ></div>
                <span className="text-sm">
                  {isLiveMode ? "Live" : "Paused"}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsLiveMode(!isLiveMode)}
              >
                {isLiveMode ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </Button>
              <Button variant="outline" size="sm">
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* System Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">CPU Usage</p>
                    <p className="text-2xl font-bold">{systemMetrics.cpu}%</p>
                  </div>
                  <Cpu className="w-8 h-8 text-blue-500" />
                </div>
                <Progress value={systemMetrics.cpu} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Memory</p>
                    <p className="text-2xl font-bold">
                      {systemMetrics.memory}%
                    </p>
                  </div>
                  <Activity className="w-8 h-8 text-green-500" />
                </div>
                <Progress value={systemMetrics.memory} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Active Sessions
                    </p>
                    <p className="text-2xl font-bold">
                      {systemMetrics.activeSessions}
                    </p>
                  </div>
                  <Timer className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Success Rate
                    </p>
                    <p className="text-2xl font-bold text-green-500">
                      {systemMetrics.successRate}%
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Live Sessions Tab */}
          {activeTab === "live" && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Live Sessions ({liveSessions.length})</span>
                    <div className="flex gap-2">
                      <Badge
                        variant={
                          liveSessions.filter((s) => s.status === "running")
                            .length > 0
                            ? "default"
                            : "secondary"
                        }
                      >
                        {
                          liveSessions.filter((s) => s.status === "running")
                            .length
                        }{" "}
                        Running
                      </Badge>
                      <Badge variant="outline">
                        {
                          liveSessions.filter((s) => s.status === "waiting")
                            .length
                        }{" "}
                        Queued
                      </Badge>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {liveSessions.map((session) => {
                      const StatusIcon = getStatusIcon(session.status);

                      return (
                        <div
                          key={session.id}
                          className="border rounded-lg p-4 hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <span className="text-lg">
                                  {getPlatformIcon(session.platform)}
                                </span>
                                <div>
                                  <h4 className="font-medium">
                                    {session.email}
                                  </h4>
                                  <p className="text-sm text-muted-foreground">
                                    {session.platform}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <StatusIcon
                                    className={`w-4 h-4 ${getStatusColor(
                                      session.status
                                    )}`}
                                  />
                                  <Badge
                                    variant={
                                      session.status === "running"
                                        ? "default"
                                        : session.status === "completed"
                                        ? "success"
                                        : session.status === "failed"
                                        ? "destructive"
                                        : "secondary"
                                    }
                                  >
                                    {session.stage}
                                  </Badge>
                                </div>
                              </div>

                              {session.status === "running" && (
                                <div className="mb-3">
                                  <div className="flex justify-between text-sm mb-1">
                                    <span>Progress</span>
                                    <span>{Math.round(session.progress)}%</span>
                                  </div>
                                  <Progress
                                    value={session.progress}
                                    className="h-2"
                                  />
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {session.lastActivity} • ETA:{" "}
                                    {session.estimatedCompletion}
                                  </p>
                                </div>
                              )}

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <p className="text-muted-foreground">
                                    Start Time
                                  </p>
                                  <p>{session.startTime}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">
                                    Duration
                                  </p>
                                  <p>{session.duration}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Proxy</p>
                                  <p>{session.proxy}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">
                                    User Agent
                                  </p>
                                  <p>{session.userAgent}</p>
                                </div>
                              </div>

                              <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                                <span>
                                  📸 {session.screenshots} screenshots
                                </span>
                                <span>📝 {session.logs} log entries</span>
                              </div>
                            </div>

                            <div className="flex gap-1 ml-4">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewSession(session)}
                              >
                                <Eye className="w-3 h-3" />
                              </Button>
                              {session.status === "running" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handlePauseSession(session.id)}
                                >
                                  <Pause className="w-3 h-3" />
                                </Button>
                              )}
                              {(session.status === "running" ||
                                session.status === "waiting") && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleStopSession(session.id)}
                                >
                                  <Square className="w-3 h-3" />
                                </Button>
                              )}
                              <Button size="sm" variant="outline">
                                <Download className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {liveSessions.length === 0 && (
                      <div className="text-center py-12">
                        <Monitor className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-2 text-sm font-medium">
                          No active sessions
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Sessions will appear here when they start running.
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Session History Tab */}
          {activeTab === "history" && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Session History</CardTitle>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Search sessions..."
                        className="w-64"
                      />
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="grid grid-cols-7 gap-4 p-3 text-sm font-medium bg-muted rounded-lg">
                      <div>Platform</div>
                      <div>Email</div>
                      <div>Timestamp</div>
                      <div>Duration</div>
                      <div>Status</div>
                      <div>Response Time</div>
                      <div>Actions</div>
                    </div>

                    {sessionHistory.map((session) => (
                      <div
                        key={session.id}
                        className="grid grid-cols-7 gap-4 p-3 border rounded-lg hover:bg-muted/30 text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <span>{getPlatformIcon(session.platform)}</span>
                          <span>{session.platform}</span>
                        </div>
                        <div className="truncate">{session.email}</div>
                        <div>{session.timestamp}</div>
                        <div>{session.duration}</div>
                        <div>
                          <Badge
                            variant={
                              session.status === "success"
                                ? "success"
                                : "destructive"
                            }
                          >
                            {session.status}
                          </Badge>
                        </div>
                        <div>{session.responseTime}ms</div>
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline">
                            <Eye className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Download className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === "analytics" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Avg Response Time</span>
                      <span className="font-mono">
                        {systemMetrics.avgResponseTime}s
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Success Rate</span>
                      <span className="text-green-500 font-medium">
                        {systemMetrics.successRate}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Completed Today</span>
                      <span className="font-medium">
                        {systemMetrics.completedToday}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Queue Length</span>
                      <span className="font-medium">
                        {systemMetrics.queuedRequests}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    Platform Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {["Facebook", "Gmail", "Instagram", "TikTok"].map(
                      (platform) => {
                        const count = sessionHistory.filter(
                          (s) => s.platform === platform
                        ).length;
                        const percentage =
                          sessionHistory.length > 0
                            ? ((count / sessionHistory.length) * 100).toFixed(1)
                            : 0;

                        return (
                          <div
                            key={platform}
                            className="flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <span>{getPlatformIcon(platform)}</span>
                              <span className="text-sm">{platform}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-20 bg-muted rounded-full h-2">
                                <div
                                  className="bg-blue-500 h-2 rounded-full transition-all"
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-muted-foreground w-12 text-right">
                                {percentage}%
                              </span>
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Session Detail Modal */}
        {selectedSession && (
          <Dialog
            open={!!selectedSession}
            onOpenChange={() => setSelectedSession(null)}
          >
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  Session Details: {selectedSession.email}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Platform</p>
                    <p>{selectedSession.platform}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <Badge>{selectedSession.stage}</Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Duration</p>
                    <p>{selectedSession.duration}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Progress</p>
                    <p>{Math.round(selectedSession.progress)}%</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Progress</p>
                  <Progress value={selectedSession.progress} />
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Last Activity
                  </p>
                  <p className="text-sm">{selectedSession.lastActivity}</p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AutoLoginMonitor;
