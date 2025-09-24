/**
 * Admin Command Center Component
 * Allows admins to send commands and notifications to users in real-time
 */

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
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
  Send,
  Users,
  MessageSquare,
  AlertTriangle,
  Info,
  CheckCircle,
  X,
  RefreshCw,
  Zap,
  Bell,
  Settings,
  Navigation,
  LogOut,
  Eye,
  Target,
  Radio,
  UserCheck,
  Globe,
  Phone,
  Monitor,
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import toast from "react-hot-toast";

const AdminCommandCenter = () => {
  const { socket, isConnected } = useSocket();
  const [activeUsers, setActiveUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [commandHistory, setCommandHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Command form states
  const [commandType, setCommandType] = useState("notification");
  const [notificationType, setNotificationType] = useState("info");
  const [message, setMessage] = useState("");
  const [title, setTitle] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [priority, setPriority] = useState("normal");

  // Predefined commands
  const predefinedCommands = {
    notifications: [
      {
        title: "Thông báo bảo trì",
        message: "Hệ thống sẽ bảo trì trong 10 phút tới",
        type: "warning",
      },
      {
        title: "Cuộc thi mới",
        message: 'Cuộc thi "Giọng Hát Vàng 2025" đã bắt đầu!',
        type: "success",
      },
      {
        title: "Cập nhật tính năng",
        message: "Chúng tôi vừa thêm tính năng bình chọn mới",
        type: "info",
      },
    ],
    commands: [
      { type: "force.logout", description: "Đăng xuất tất cả user" },
      { type: "request.verify", description: "Yêu cầu xác thực danh tính" },
      { type: "clear.cache", description: "Xóa cache trình duyệt" },
      { type: "refresh.page", description: "Làm mới trang" },
    ],
  };

  useEffect(() => {
    if (!socket) return;

    const handleUserActivity = (data) => {
      if (data.type === "user.activity" && data.data?.userId) {
        setActiveUsers((prev) => {
          const userId = data.data.userId;
          const existingUser = prev.find((u) => u.id === userId);

          if (existingUser) {
            return prev.map((u) =>
              u.id === userId
                ? {
                    ...u,
                    lastActivity: data.timestamp,
                    activityCount: u.activityCount + 1,
                  }
                : u
            );
          } else {
            return [
              ...prev,
              {
                id: userId,
                lastActivity: data.timestamp,
                activityCount: 1,
                page: data.data.page || "/",
                userAgent: data.data.userAgent || "Unknown",
                sessionId: data.data.sessionId,
              },
            ];
          }
        });
      }
      setLoading(false);
    };

    const handleCommandResponse = (data) => {
      if (data.type === "command.response") {
        setCommandHistory((prev) => {
          const updated = prev.map((cmd) =>
            cmd.id === data.commandId
              ? {
                  ...cmd,
                  status: data.success ? "delivered" : "failed",
                  response: data,
                }
              : cmd
          );
          return updated;
        });

        if (data.success) {
          toast.success(
            `Lệnh đã được gửi thành công đến ${data.targetCount || 1} user`
          );
        } else {
          toast.error(`Lỗi gửi lệnh: ${data.error}`);
        }
      }
    };

    socket.on("admin:feed", handleUserActivity);
    socket.on("command:response", handleCommandResponse);

    // Request current active users
    socket.emit("admin:get_active_users");

    return () => {
      socket.off("admin:feed", handleUserActivity);
      socket.off("command:response", handleCommandResponse);
    };
  }, [socket]);

  const sendCommand = () => {
    if (!socket || !isConnected) {
      toast.error("Không có kết nối tới server");
      return;
    }

    if (!message.trim()) {
      toast.error("Vui lòng nhập nội dung");
      return;
    }

    const commandId = `cmd_${Date.now()}`;
    const command = {
      id: commandId,
      type: commandType,
      message: message.trim(),
      title: title.trim(),
      notificationType,
      priority,
      targetUrl: targetUrl.trim(),
      timestamp: new Date().toISOString(),
      targetUsers: selectedUsers.length > 0 ? selectedUsers : null, // null = all users
      targetCount:
        selectedUsers.length > 0 ? selectedUsers.length : activeUsers.length,
    };

    // Add to command history
    setCommandHistory((prev) => [
      { ...command, status: "sending" },
      ...prev.slice(0, 49), // Keep last 50 commands
    ]);

    // Send command via socket
    if (commandType === "notification") {
      socket.emit("admin:send_notification", command);
    } else {
      socket.emit("admin:command", command);
    }

    // Clear form
    setMessage("");
    setTitle("");
    setTargetUrl("");
    setSelectedUsers([]);

    console.log("📤 Sent command:", command);
  };

  const sendBulkCommand = (commandData) => {
    if (!socket || !isConnected) {
      toast.error("Không có kết nối tới server");
      return;
    }

    const commandId = `bulk_${Date.now()}`;
    const command = {
      id: commandId,
      type: "bulk_command",
      command: commandData.type,
      params: commandData.params || {},
      targetUserIds:
        selectedUsers.length > 0 ? selectedUsers : activeUsers.map((u) => u.id),
      timestamp: new Date().toISOString(),
    };

    setCommandHistory((prev) => [
      { ...command, status: "sending", message: commandData.description },
      ...prev.slice(0, 49),
    ]);

    socket.emit("admin:bulk_command", command);
    setSelectedUsers([]);

    console.log("📤 Sent bulk command:", command);
  };

  const toggleUserSelection = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAllUsers = () => {
    setSelectedUsers(activeUsers.map((u) => u.id));
  };

  const clearSelection = () => {
    setSelectedUsers([]);
  };

  const getDeviceIcon = (userAgent) => {
    if (!userAgent) return Monitor;
    if (/Mobile|Android|iPhone/.test(userAgent)) return Phone;
    return Monitor;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "delivered":
        return "text-green-500";
      case "failed":
        return "text-red-500";
      case "sending":
        return "text-yellow-500";
      default:
        return "text-gray-500";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "delivered":
        return CheckCircle;
      case "failed":
        return X;
      case "sending":
        return RefreshCw;
      default:
        return Info;
    }
  };

  const filteredActiveUsers = useMemo(() => {
    return activeUsers.filter((user) => {
      const lastActivityTime = new Date(user.lastActivity).getTime();
      const now = Date.now();
      return now - lastActivityTime < 5 * 60 * 1000; // Active in last 5 minutes
    });
  }, [activeUsers]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Command Panel */}
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Admin Command Center
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="manual">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="manual">Manual Command</TabsTrigger>
                <TabsTrigger value="predefined">Quick Commands</TabsTrigger>
              </TabsList>

              <TabsContent value="manual" className="space-y-4">
                {/* Command Type Selection */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Loại lệnh</label>
                    <Select value={commandType} onValueChange={setCommandType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="notification">Thông báo</SelectItem>
                        <SelectItem value="command">Lệnh hệ thống</SelectItem>
                        <SelectItem value="redirect">Chuyển hướng</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {commandType === "notification" && (
                    <div>
                      <label className="text-sm font-medium">
                        Loại thông báo
                      </label>
                      <Select
                        value={notificationType}
                        onValueChange={setNotificationType}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="info">Thông tin</SelectItem>
                          <SelectItem value="success">Thành công</SelectItem>
                          <SelectItem value="warning">Cảnh báo</SelectItem>
                          <SelectItem value="error">Lỗi</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {/* Title (for notifications) */}
                {commandType === "notification" && (
                  <div>
                    <label className="text-sm font-medium">Tiêu đề</label>
                    <Input
                      placeholder="Nhập tiêu đề thông báo..."
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>
                )}

                {/* Message */}
                <div>
                  <label className="text-sm font-medium">
                    {commandType === "notification" ? "Nội dung" : "Lệnh"}
                  </label>
                  <Textarea
                    placeholder={
                      commandType === "notification"
                        ? "Nhập nội dung thông báo..."
                        : "Nhập lệnh hoặc tin nhắn..."
                    }
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                  />
                </div>

                {/* URL (for redirect commands) */}
                {commandType === "redirect" && (
                  <div>
                    <label className="text-sm font-medium">URL đích</label>
                    <Input
                      placeholder="https://example.com"
                      value={targetUrl}
                      onChange={(e) => setTargetUrl(e.target.value)}
                    />
                  </div>
                )}

                {/* Target Selection */}
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      Mục tiêu:{" "}
                      {selectedUsers.length > 0
                        ? `${selectedUsers.length} user`
                        : "Tất cả user"}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={selectAllUsers}
                    >
                      Chọn tất cả
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={clearSelection}
                    >
                      Bỏ chọn
                    </Button>
                  </div>
                </div>

                {/* Send Button */}
                <Button
                  onClick={sendCommand}
                  disabled={!isConnected || !message.trim()}
                  className="w-full"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Gửi {commandType === "notification" ? "Thông báo" : "Lệnh"}
                </Button>
              </TabsContent>

              <TabsContent value="predefined" className="space-y-4">
                {/* Predefined Notifications */}
                <div>
                  <h4 className="font-medium mb-3">Thông báo mẫu</h4>
                  <div className="grid gap-2">
                    {predefinedCommands.notifications.map((notif, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className="justify-start h-auto p-3"
                        onClick={() => {
                          setCommandType("notification");
                          setNotificationType(notif.type);
                          setTitle(notif.title);
                          setMessage(notif.message);
                        }}
                      >
                        <div className="text-left">
                          <div className="font-medium">{notif.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {notif.message}
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Predefined Commands */}
                <div>
                  <h4 className="font-medium mb-3">Lệnh hệ thống</h4>
                  <div className="grid gap-2">
                    {predefinedCommands.commands.map((cmd, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className="justify-between"
                        onClick={() => sendBulkCommand(cmd)}
                        disabled={!isConnected}
                      >
                        <span>{cmd.description}</span>
                        <Zap className="h-4 w-4" />
                      </Button>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Command History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Lịch sử lệnh
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              {commandHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-2" />
                  <p>Chưa có lệnh nào được gửi</p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {commandHistory.map((cmd) => {
                    const StatusIcon = getStatusIcon(cmd.status);
                    const statusColor = getStatusColor(cmd.status);

                    return (
                      <motion.div
                        key={cmd.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="flex items-start gap-3 p-3 border-b last:border-b-0"
                      >
                        <StatusIcon
                          className={`h-5 w-5 flex-shrink-0 ${statusColor}`}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline">{cmd.type}</Badge>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(cmd.timestamp), "HH:mm:ss", {
                                locale: vi,
                              })}
                            </span>
                          </div>
                          <p className="text-sm font-medium">
                            {cmd.title || cmd.message}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Gửi đến: {cmd.targetCount || 1} user
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Active Users Panel */}
      <div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User đang online ({filteredActiveUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <RefreshCw className="h-8 w-8 animate-spin mb-2" />
                  <p>Đang tải...</p>
                </div>
              ) : filteredActiveUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-2" />
                  <p>Không có user nào online</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredActiveUsers.map((user) => {
                    const DeviceIcon = getDeviceIcon(user.userAgent);
                    const isSelected = selectedUsers.includes(user.id);
                    const lastActivity = new Date(user.lastActivity);

                    return (
                      <motion.div
                        key={user.id}
                        layout
                        className={`
                          p-3 rounded-lg border cursor-pointer transition-all
                          ${
                            isSelected
                              ? "border-blue-300 bg-blue-50"
                              : "border-gray-200 hover:border-gray-300"
                          }
                        `}
                        onClick={() => toggleUserSelection(user.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                          <DeviceIcon className="h-4 w-4 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {user.id}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {user.page}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {user.activityCount} hoạt động
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminCommandCenter;
