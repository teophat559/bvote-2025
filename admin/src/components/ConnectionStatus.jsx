/**
 * Connection Status Component - Real-time API Health Display
 * Hiển thị trạng thái kết nối API real-time
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Wifi,
  WifiOff,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
  RefreshCw,
  Settings,
  Zap,
  Globe,
  Timer,
} from "lucide-react";
import connectionMonitor from "@/services/connectionMonitor";

const ConnectionStatus = ({ compact = false }) => {
  const [status, setStatus] = useState(connectionMonitor.status);
  const [isTestRunning, setIsTestRunning] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const unsubscribe = connectionMonitor.subscribe(setStatus);
    return unsubscribe;
  }, []);

  const getStatusIcon = () => {
    switch (status.overall) {
      case "connected":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "degraded":
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case "disconnected":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (status.overall) {
      case "connected":
        return "success";
      case "degraded":
        return "warning";
      case "disconnected":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getStatusText = () => {
    switch (status.overall) {
      case "connected":
        return "Kết nối tốt";
      case "degraded":
        return "Kết nối không ổn định";
      case "disconnected":
        return "Mất kết nối";
      default:
        return "Đang kiểm tra";
    }
  };

  const handleTestConnection = async () => {
    setIsTestRunning(true);
    try {
      const results = await connectionMonitor.testConnection();
      setTestResults(results);
    } catch (error) {
      console.error("Connection test failed:", error);
    } finally {
      setIsTestRunning(false);
    }
  };

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-2"
      >
        {getStatusIcon()}
        <Badge variant={getStatusColor()} className="text-xs">
          {getStatusText()}
        </Badge>
        {status.api.latency > 0 && (
          <span className="text-xs text-muted-foreground">
            {status.api.latency}ms
          </span>
        )}
      </motion.div>
    );
  }

  return (
    <Dialog open={showDetails} onOpenChange={setShowDetails}>
      <DialogTrigger asChild>
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="cursor-pointer"
        >
          <Card className="w-full hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{
                      rotate: status.overall === "connected" ? 0 : 360,
                      scale:
                        status.overall === "disconnected" ? [1, 1.1, 1] : 1,
                    }}
                    transition={{
                      duration: status.overall === "disconnected" ? 1 : 0.3,
                      repeat: status.overall === "disconnected" ? Infinity : 0,
                    }}
                  >
                    {getStatusIcon()}
                  </motion.div>
                  <div>
                    <p className="font-medium text-sm">{getStatusText()}</p>
                    <p className="text-xs text-muted-foreground">
                      API: {status.api.healthy ? "OK" : "Error"} • WS:{" "}
                      {status.websocket.connected
                        ? "Connected"
                        : "Disconnected"}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  {status.api.latency > 0 && (
                    <p className="text-sm font-mono">{status.api.latency}ms</p>
                  )}
                  <Badge variant={getStatusColor()} className="text-xs">
                    {status.overall.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </DialogTrigger>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Connection Status Details
          </DialogTitle>
          <DialogDescription>
            Real-time connection monitoring và diagnostics
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Overall Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                {getStatusIcon()}
                Overall Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={getStatusColor()} className="mt-1">
                    {getStatusText()}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Check</p>
                  <p className="text-sm font-mono mt-1">
                    {status.api.lastCheck
                      ? new Date(status.api.lastCheck).toLocaleTimeString()
                      : "Never"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* API Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="w-4 h-4" />
                API Connection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Health</p>
                  <div className="flex items-center gap-1 mt-1">
                    {status.api.healthy ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span className="text-sm">
                      {status.api.healthy ? "Healthy" : "Error"}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Latency</p>
                  <p className="text-sm font-mono mt-1">
                    {status.api.latency}ms
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Server Status</p>
                  <p className="text-sm mt-1">
                    {status.api.serverStatus || "Unknown"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Error</p>
                  <p className="text-sm mt-1 text-red-500">
                    {status.api.error || "None"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* WebSocket Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="w-4 h-4" />
                WebSocket Connection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <div className="flex items-center gap-1 mt-1">
                    {status.websocket.connected ? (
                      <Wifi className="w-4 h-4 text-green-500" />
                    ) : (
                      <WifiOff className="w-4 h-4 text-red-500" />
                    )}
                    <span className="text-sm">
                      {status.websocket.connected
                        ? "Connected"
                        : "Disconnected"}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Transport</p>
                  <p className="text-sm mt-1">
                    {status.websocket.transport || "Unknown"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Ping</p>
                  <p className="text-sm font-mono mt-1">
                    {status.websocket.lastPing
                      ? new Date(status.websocket.lastPing).toLocaleTimeString()
                      : "Never"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Test Results */}
          {testResults && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Timer className="w-4 h-4" />
                  Connection Test Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(testResults.tests).map(([name, result]) => (
                    <div
                      key={name}
                      className="flex items-center justify-between p-2 border rounded"
                    >
                      <span className="font-medium capitalize">{name}</span>
                      <div className="flex items-center gap-2">
                        {result.status === "success" ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                        <span className="text-sm">
                          {result.latency
                            ? `${result.latency}ms`
                            : result.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={handleTestConnection}
              disabled={isTestRunning}
              className="flex items-center gap-2"
            >
              <RefreshCw
                className={`w-4 h-4 ${isTestRunning ? "animate-spin" : ""}`}
              />
              {isTestRunning ? "Testing..." : "Test Connection"}
            </Button>

            <Button
              variant="outline"
              onClick={() =>
                connectionMonitor.setAutoRecovery(
                  !connectionMonitor.autoRecoveryEnabled
                )
              }
              className="flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Auto Recovery:{" "}
              {connectionMonitor.autoRecoveryEnabled ? "ON" : "OFF"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConnectionStatus;
