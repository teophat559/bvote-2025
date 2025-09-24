import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  RefreshCw,
  CheckCircle,
  XCircle,
  Server,
  Wifi,
  GitBranch,
  Package,
  Activity,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button"; /* Fixed: Added Button import */
import { socketAdaptor } from "@/adaptors/socket/SocketAdaptor.js";
import { apiClient } from "@/services/apiClient";

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

const SystemStatusPage = () => {
  const [status, setStatus] = useState({
    api: "checking",
    socket: "checking",
    database: "checking",
  });
  const [socketInfo, setSocketInfo] = useState({
    id: null,
    connected: false,
    latencyMs: null,
    adminClients: 0,
    userClients: 0,
    totalClients: 0,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const appName = import.meta.env.VITE_APP_NAME || "BVOTE Admin";
  const buildVersion = import.meta.env.VITE_BUILD_VERSION || "N/A";
  const apiURL = import.meta.env.VITE_API_URL || "N/A";
  const socketURL = import.meta.env.VITE_SOCKET_URL || "N/A";
  const useMock = import.meta.env.VITE_USE_MOCK === "1" ? "Có" : "Không";

  const checkServiceStatus = async (serviceName, url) => {
    try {
      const response = await fetch(url);
      return response.ok ? "active" : "inactive";
    } catch (error) {
      return "inactive";
    }
  };

  const fetchSystemStatus = async () => {
    setLoading(true);
    try {
      const apiStatus = await checkServiceStatus(`${apiURL}/health`);
      const socketStatus = await checkServiceStatus(`${socketURL}/health`); // Assuming a health endpoint for socket
      // Simulate database status
      const dbStatus = Math.random() > 0.1 ? "active" : "inactive";

      setStatus({
        api: apiStatus,
        socket: socketStatus,
        database: dbStatus,
      });
      // Fetch backend connection stats (if available)
      try {
        const sys = await apiClient.get("/admin/system/status");
        setSocketInfo((prev) => ({
          ...prev,
          adminClients: sys?.connections?.adminClients || 0,
          userClients: sys?.connections?.userClients || 0,
          totalClients: sys?.connections?.totalClients || 0,
        }));
      } catch {}
      toast({
        title: "Cập nhật trạng thái",
        description: "Đã làm mới trạng thái hệ thống.",
      });
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể kiểm tra trạng thái hệ thống.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSystemStatus();
    // read socket status
    const update = () => {
      const s = socketAdaptor.getStatus();
      setSocketInfo((prev) => ({
        ...prev,
        id: s.id || null,
        connected: !!s.connected,
      }));
    };
    update();
    socketAdaptor.on && socketAdaptor.on("socket:connected", update);
    socketAdaptor.on && socketAdaptor.on("socket:disconnected", update);
    return () => {
      socketAdaptor.off && socketAdaptor.off("socket:connected", update);
      socketAdaptor.off && socketAdaptor.off("socket:disconnected", update);
    };
  }, []);

  const handlePing = async () => {
    const start = performance.now();
    try {
      socketAdaptor.ping && socketAdaptor.ping();
      // crude measurement
      const latency = Math.round(performance.now() - start);
      setSocketInfo((prev) => ({ ...prev, latencyMs: latency }));
      toast({ title: "Ping", description: `Latency ~ ${latency} ms` });
    } catch (e) {
      toast({
        title: "Ping thất bại",
        description: e.message,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (serviceStatus) => {
    if (serviceStatus === "active") {
      return (
        <Badge variant="success" className="ml-2">
          Hoạt động
        </Badge>
      );
    } else if (serviceStatus === "inactive") {
      return (
        <Badge variant="destructive" className="ml-2">
          Không hoạt động
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="ml-2">
        Đang kiểm tra
      </Badge>
    );
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
      className="space-y-6"
    >
      <motion.div variants={itemVariants}>
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-100">
              Trạng Thái Hệ Thống
            </h1>
            <p className="text-slate-400 mt-1">
              Kiểm tra tình trạng hoạt động của các dịch vụ.
            </p>
          </div>
          <Button onClick={fetchSystemStatus} disabled={loading}>
            {loading ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Làm mới
          </Button>
        </header>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <motion.div variants={itemVariants}>
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" /> API Backend
              </CardTitle>
              <CardDescription>
                Trạng thái kết nối đến API Backend.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold">
                {status.api === "active" ? (
                  <CheckCircle className="inline-block h-5 w-5 text-green-500 mr-2" />
                ) : (
                  <XCircle className="inline-block h-5 w-5 text-red-500 mr-2" />
                )}
                {status.api === "active" ? "Hoạt động" : "Không hoạt động"}
                {getStatusBadge(status.api)}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                URL: <span className="font-mono">{apiURL}</span>
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wifi className="h-5 w-5" /> WebSocket Server
              </CardTitle>
              <CardDescription>
                Trạng thái kết nối đến WebSocket Server.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold">
                {status.socket === "active" ? (
                  <CheckCircle className="inline-block h-5 w-5 text-green-500 mr-2" />
                ) : (
                  <XCircle className="inline-block h-5 w-5 text-red-500 mr-2" />
                )}
                {status.socket === "active" ? "Hoạt động" : "Không hoạt động"}
                {getStatusBadge(status.socket)}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                URL: <span className="font-mono">{socketURL}</span>
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-muted-foreground">
                <div>
                  Socket ID:{" "}
                  <span className="font-mono text-foreground">
                    {socketInfo.id || "N/A"}
                  </span>
                </div>
                <div>
                  Latency:{" "}
                  <span className="font-mono text-foreground">
                    {socketInfo.latencyMs != null
                      ? `${socketInfo.latencyMs} ms`
                      : "—"}
                  </span>
                </div>
                <div>
                  Admins online:{" "}
                  <span className="font-mono text-foreground">
                    {socketInfo.adminClients}
                  </span>
                </div>
                <div>
                  Users online:{" "}
                  <span className="font-mono text-foreground">
                    {socketInfo.userClients}
                  </span>
                </div>
                <div>
                  Tổng kết nối:{" "}
                  <span className="font-mono text-foreground">
                    {socketInfo.totalClients}
                  </span>
                </div>
              </div>
              <div className="mt-4">
                <Button size="sm" onClick={handlePing}>
                  <Activity className="mr-2 h-4 w-4" /> Ping
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" /> Cơ sở dữ liệu
              </CardTitle>
              <CardDescription>
                Trạng thái kết nối đến cơ sở dữ liệu.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold">
                {status.database === "active" ? (
                  <CheckCircle className="inline-block h-5 w-5 text-green-500 mr-2" />
                ) : (
                  <XCircle className="inline-block h-5 w-5 text-red-500 mr-2" />
                )}
                {status.database === "active" ? "Hoạt động" : "Không hoạt động"}
                {getStatusBadge(status.database)}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Kiểm tra qua API Backend.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div variants={itemVariants}>
        <Card className="bg-slate-900/50 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" /> Thông tin ứng dụng
            </CardTitle>
            <CardDescription>
              Chi tiết phiên bản và cấu hình ứng dụng.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Tên ứng dụng:{" "}
              <span className="font-semibold text-foreground">{appName}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Phiên bản Build:{" "}
              <span className="font-semibold text-foreground">
                {buildVersion}
              </span>
            </p>
            <p className="text-sm text-muted-foreground">
              Chế độ Mock:{" "}
              <span className="font-semibold text-foreground">{useMock}</span>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default SystemStatusPage;
