/**
 * Auto Login Management Component
 * Quản lý Auto Login: Cài đặt Auto, Tắt Bật Auto, Cấu hình Chrome, Cài đặt Profile
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { ScrollArea } from "../ui/scroll-area";
import { motion } from "framer-motion";
import {
  Settings,
  Power,
  Chrome,
  User,
  Plus,
  Edit,
  Trash2,
  Save,
  RefreshCw,
  Play,
  Pause,
  Monitor,
  Globe,
  Clock,
  Shield,
  Database,
  Code,
} from "lucide-react";
import toast from "react-hot-toast";

const AutoLoginManagement = () => {
  const [autoSettings, setAutoSettings] = useState({
    enabled: true,
    interval: 30,
    maxRetries: 3,
    timeout: 10000,
    useProxy: false,
    headless: false,
  });

  const [chromeProfiles, setChromeProfiles] = useState([
    {
      id: "profile-1",
      name: "Facebook Profile",
      platform: "facebook",
      status: "active",
      lastUsed: new Date(),
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      proxy: "192.168.1.1:8080",
    },
    {
      id: "profile-2",
      name: "Google Profile",
      platform: "google",
      status: "inactive",
      lastUsed: new Date(Date.now() - 86400000),
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      proxy: null,
    },
  ]);

  const [newProfile, setNewProfile] = useState({
    name: "",
    platform: "",
    userAgent: "",
    proxy: "",
  });

  const [editingProfile, setEditingProfile] = useState(null);

  const handleAutoSettingChange = (key, value) => {
    setAutoSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const saveAutoSettings = async () => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Cài đặt Auto đã được lưu!");
      console.log("Auto settings saved:", autoSettings);
    } catch (error) {
      toast.error("Lỗi lưu cài đặt!");
    }
  };

  const toggleAutoLogin = () => {
    const newStatus = !autoSettings.enabled;
    setAutoSettings((prev) => ({
      ...prev,
      enabled: newStatus,
    }));
    toast.success(`Auto Login đã ${newStatus ? "bật" : "tắt"}!`);
  };

  const createProfile = () => {
    if (!newProfile.name || !newProfile.platform) {
      toast.error("Vui lòng nhập tên và platform!");
      return;
    }

    const profile = {
      id: `profile-${Date.now()}`,
      ...newProfile,
      status: "inactive",
      lastUsed: new Date(),
      userAgent:
        newProfile.userAgent ||
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    };

    setChromeProfiles((prev) => [...prev, profile]);
    setNewProfile({ name: "", platform: "", userAgent: "", proxy: "" });
    toast.success("Profile mới đã được tạo!");
  };

  const editProfile = (profile) => {
    setEditingProfile(profile);
  };

  const saveEditProfile = () => {
    setChromeProfiles((prev) =>
      prev.map((p) => (p.id === editingProfile.id ? editingProfile : p))
    );
    setEditingProfile(null);
    toast.success("Profile đã được cập nhật!");
  };

  const deleteProfile = (profileId) => {
    setChromeProfiles((prev) => prev.filter((p) => p.id !== profileId));
    toast.success("Profile đã được xóa!");
  };

  const launchProfile = (profileId) => {
    toast.success(`Đang khởi động profile ${profileId}!`);
    // Update status to active
    setChromeProfiles((prev) =>
      prev.map((p) =>
        p.id === profileId
          ? { ...p, status: "active", lastUsed: new Date() }
          : p
      )
    );
  };

  const stopProfile = (profileId) => {
    toast.success(`Đã dừng profile ${profileId}!`);
    setChromeProfiles((prev) =>
      prev.map((p) => (p.id === profileId ? { ...p, status: "inactive" } : p))
    );
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { label: "Hoạt động", color: "bg-green-500/20 text-green-300" },
      inactive: { label: "Tắt", color: "bg-gray-500/20 text-gray-300" },
      error: { label: "Lỗi", color: "bg-red-500/20 text-red-300" },
    };

    const config = statusConfig[status] || statusConfig.inactive;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="auto-settings" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="auto-settings">Cài đặt Auto</TabsTrigger>
          <TabsTrigger value="toggle-control">Tắt Bật Auto</TabsTrigger>
          <TabsTrigger value="chrome-config">Cấu hình Chrome</TabsTrigger>
          <TabsTrigger value="profile-settings">Cài đặt Profile</TabsTrigger>
        </TabsList>

        {/* Cài đặt Auto */}
        <TabsContent value="auto-settings">
          <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Settings className="h-5 w-5 text-blue-400" />
                Cài Đặt Auto Login
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-slate-300">
                      Khoảng thời gian kiểm tra (giây)
                    </Label>
                    <Input
                      type="number"
                      value={autoSettings.interval}
                      onChange={(e) =>
                        handleAutoSettingChange(
                          "interval",
                          parseInt(e.target.value)
                        )
                      }
                      className="bg-slate-800 border-slate-600"
                    />
                  </div>

                  <div>
                    <Label className="text-slate-300">
                      Số lần thử lại tối đa
                    </Label>
                    <Input
                      type="number"
                      value={autoSettings.maxRetries}
                      onChange={(e) =>
                        handleAutoSettingChange(
                          "maxRetries",
                          parseInt(e.target.value)
                        )
                      }
                      className="bg-slate-800 border-slate-600"
                    />
                  </div>

                  <div>
                    <Label className="text-slate-300">Timeout (ms)</Label>
                    <Input
                      type="number"
                      value={autoSettings.timeout}
                      onChange={(e) =>
                        handleAutoSettingChange(
                          "timeout",
                          parseInt(e.target.value)
                        )
                      }
                      className="bg-slate-800 border-slate-600"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-slate-300">Sử dụng Proxy</Label>
                    <Switch
                      checked={autoSettings.useProxy}
                      onCheckedChange={(checked) =>
                        handleAutoSettingChange("useProxy", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-slate-300">Chế độ Headless</Label>
                    <Switch
                      checked={autoSettings.headless}
                      onCheckedChange={(checked) =>
                        handleAutoSettingChange("headless", checked)
                      }
                    />
                  </div>

                  <div className="pt-4">
                    <Button onClick={saveAutoSettings} className="w-full">
                      <Save className="h-4 w-4 mr-2" />
                      Lưu Cài Đặt
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tắt Bật Auto */}
        <TabsContent value="toggle-control">
          <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Power className="h-5 w-5 text-blue-400" />
                Điều Khiển Auto Login
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-6">
                <div className="space-y-4">
                  <div
                    className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center ${
                      autoSettings.enabled ? "bg-green-500/20" : "bg-red-500/20"
                    }`}
                  >
                    <Power
                      className={`h-12 w-12 ${
                        autoSettings.enabled ? "text-green-400" : "text-red-400"
                      }`}
                    />
                  </div>

                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">
                      Auto Login{" "}
                      {autoSettings.enabled ? "Đang Hoạt Động" : "Đã Tắt"}
                    </h3>
                    <p className="text-slate-400">
                      {autoSettings.enabled
                        ? "Hệ thống đang tự động xử lý các yêu cầu đăng nhập"
                        : "Hệ thống đã tạm dừng xử lý tự động"}
                    </p>
                  </div>
                </div>

                <Button
                  onClick={toggleAutoLogin}
                  size="lg"
                  className={`px-8 py-3 text-lg ${
                    autoSettings.enabled
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  {autoSettings.enabled ? (
                    <>
                      <Pause className="h-5 w-5 mr-2" />
                      Tắt Auto Login
                    </>
                  ) : (
                    <>
                      <Play className="h-5 w-5 mr-2" />
                      Bật Auto Login
                    </>
                  )}
                </Button>

                {/* Status Statistics */}
                <div className="grid grid-cols-3 gap-4 mt-8">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">24</div>
                    <div className="text-sm text-slate-400">
                      Thành công hôm nay
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-400">3</div>
                    <div className="text-sm text-slate-400">Đang chờ OTP</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-400">2</div>
                    <div className="text-sm text-slate-400">Thất bại</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cấu hình Chrome */}
        <TabsContent value="chrome-config">
          <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Chrome className="h-5 w-5 text-orange-400" />
                Cấu Hình Chrome
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">
                    Cài Đặt Chrome Global
                  </h3>

                  <div>
                    <Label className="text-slate-300">Chrome Binary Path</Label>
                    <Input
                      defaultValue="C:\Program Files\Google\Chrome\Application\chrome.exe"
                      className="bg-slate-800 border-slate-600 font-mono text-sm"
                    />
                  </div>

                  <div>
                    <Label className="text-slate-300">
                      User Data Directory
                    </Label>
                    <Input
                      defaultValue="C:\ChromeProfiles"
                      className="bg-slate-800 border-slate-600 font-mono text-sm"
                    />
                  </div>

                  <div>
                    <Label className="text-slate-300">Default Args</Label>
                    <textarea
                      className="w-full h-24 bg-slate-800 border border-slate-600 rounded p-2 text-sm font-mono text-slate-300"
                      defaultValue="--disable-web-security&#10;--disable-features=VizDisplayCompositor&#10;--no-sandbox"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">
                    Thông Tin Hệ Thống
                  </h3>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-slate-800 rounded">
                      <span className="text-slate-300">Chrome Version</span>
                      <Badge variant="outline">119.0.6045.105</Badge>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-slate-800 rounded">
                      <span className="text-slate-300">Active Profiles</span>
                      <Badge variant="outline">
                        {
                          chromeProfiles.filter((p) => p.status === "active")
                            .length
                        }
                      </Badge>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-slate-800 rounded">
                      <span className="text-slate-300">Total Profiles</span>
                      <Badge variant="outline">{chromeProfiles.length}</Badge>
                    </div>
                  </div>

                  <Button className="w-full">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Restart Chrome Service
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cài đặt Profile */}
        <TabsContent value="profile-settings">
          <div className="space-y-6">
            {/* Tạo Profile Mới */}
            <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Plus className="h-5 w-5 text-green-400" />
                  Tạo Profile Mới
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-slate-300">Tên Profile</Label>
                    <Input
                      value={newProfile.name}
                      onChange={(e) =>
                        setNewProfile((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="Facebook Profile 1"
                      className="bg-slate-800 border-slate-600"
                    />
                  </div>

                  <div>
                    <Label className="text-slate-300">Platform</Label>
                    <select
                      value={newProfile.platform}
                      onChange={(e) =>
                        setNewProfile((prev) => ({
                          ...prev,
                          platform: e.target.value,
                        }))
                      }
                      className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-slate-300"
                    >
                      <option value="">Chọn platform</option>
                      <option value="facebook">Facebook</option>
                      <option value="google">Google</option>
                      <option value="instagram">Instagram</option>
                      <option value="twitter">Twitter</option>
                    </select>
                  </div>

                  <div>
                    <Label className="text-slate-300">User Agent</Label>
                    <Input
                      value={newProfile.userAgent}
                      onChange={(e) =>
                        setNewProfile((prev) => ({
                          ...prev,
                          userAgent: e.target.value,
                        }))
                      }
                      placeholder="Custom User Agent"
                      className="bg-slate-800 border-slate-600"
                    />
                  </div>

                  <div className="flex items-end">
                    <Button onClick={createProfile} className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Tạo Profile
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Danh Sách Profiles */}
            <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <User className="h-5 w-5 text-blue-400" />
                  Danh Sách Chrome Profiles
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {chromeProfiles.map((profile) => (
                      <motion.div
                        key={profile.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-slate-800 rounded-lg border border-slate-700"
                      >
                        {editingProfile?.id === profile.id ? (
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <Input
                                value={editingProfile.name}
                                onChange={(e) =>
                                  setEditingProfile((prev) => ({
                                    ...prev,
                                    name: e.target.value,
                                  }))
                                }
                                className="bg-slate-700 border-slate-600"
                              />
                              <Input
                                value={editingProfile.platform}
                                onChange={(e) =>
                                  setEditingProfile((prev) => ({
                                    ...prev,
                                    platform: e.target.value,
                                  }))
                                }
                                className="bg-slate-700 border-slate-600"
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" onClick={saveEditProfile}>
                                <Save className="h-3 w-3 mr-1" />
                                Lưu
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingProfile(null)}
                              >
                                Hủy
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <h4 className="font-medium text-white">
                                  {profile.name}
                                </h4>
                                {getStatusBadge(profile.status)}
                                <Badge variant="outline">
                                  {profile.platform}
                                </Badge>
                              </div>
                              <div className="text-sm text-slate-400 mt-1">
                                Sử dụng cuối:{" "}
                                {profile.lastUsed.toLocaleString("vi-VN")}
                              </div>
                            </div>

                            <div className="flex gap-2">
                              {profile.status === "active" ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => stopProfile(profile.id)}
                                  className="text-red-400 border-red-400 hover:bg-red-400/10"
                                >
                                  <Pause className="h-3 w-3" />
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => launchProfile(profile.id)}
                                  className="text-green-400 border-green-400 hover:bg-green-400/10"
                                >
                                  <Play className="h-3 w-3" />
                                </Button>
                              )}

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => editProfile(profile)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => deleteProfile(profile.id)}
                                className="text-red-400 border-red-400 hover:bg-red-400/10"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AutoLoginManagement;
