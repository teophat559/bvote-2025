import React, { useState } from "react";
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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Settings,
  Save,
  RefreshCw,
  Globe,
  Shield,
  Clock,
  Zap,
  User,
  Chrome,
  Network,
  Calendar,
  AlertTriangle,
  Plus,
  Trash2,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const AutoLoginAdvancedModal = ({ isOpen, onClose, onSave }) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("basic");

  const [config, setConfig] = useState({
    // Basic Settings
    platform: "facebook",
    username: "",
    password: "",
    priority: "normal",
    tags: [],
    description: "",
    templateId: "",

    // Enhanced Schedule Settings
    scheduleEnabled: false,
    scheduleType: "immediate",
    scheduledTime: "",
    repeatInterval: "once",
    cronExpression: "",
    retryDelay: 300,
    maxRetries: 3,
    backoffStrategy: "exponential",
    enableSmartRetry: true,
    retryConditions: [],

    // Enhanced Proxy Settings
    useProxy: false,
    proxyType: "http",
    proxyHost: "",
    proxyPort: "",
    proxyUsername: "",
    proxyPassword: "",
    proxyRotation: true,
    proxyPool: [],
    proxyLocation: "auto",
    proxyAuthentication: "none",

    // Enhanced Browser Settings
    userAgent: "auto",
    customUserAgent: "",
    browserHeadless: true,
    browserWindowSize: "1920x1080",
    browserLanguage: "vi-VN",
    enableImages: false,
    enableJavaScript: true,
    clearCookies: false,
    enablePlugins: false,
    browserProfile: "default",
    fingerprintProtection: true,

    // Enhanced Security Settings
    enableStealth: true,
    randomizeDelay: true,
    minDelay: 1000,
    maxDelay: 3000,
    enableCaptchaSolver: false,
    captchaSolverService: "auto",
    enableIPRotation: false,
    enableDNSOverHTTPS: false,
    enableTorProxy: false,
    encryptCredentials: true,

    // Enhanced Notification Settings
    notifyOnSuccess: true,
    notifyOnFailure: true,
    notifyOnRetry: false,
    notifyOnSchedule: false,
    webhookUrl: "",
    discordWebhook: "",
    telegramBot: "",
    emailNotifications: false,

    // Enhanced Advanced Options
    sessionTimeout: 300000,
    pageLoadTimeout: 30000,
    elementTimeout: 10000,
    customScript: "",
    preLoginScript: "",
    postLoginScript: "",
    environmentVariables: {},
    conditionalLogic: [],
    dynamicVariables: {},

    // Enhanced Monitoring
    enableLogging: true,
    logLevel: "info",
    enableScreenshots: false,
    screenshotOnError: true,
    enableVideoRecording: false,
    enablePerformanceMetrics: true,
    enableRealTimeMonitoring: true,
    monitoringWebhook: "",

    // AI & Machine Learning
    enableAIOptimization: false,
    learningMode: false,
    adaptiveDelay: false,
    behaviorMimicking: false,

    // Integration Settings
    apiIntegration: false,
    apiEndpoint: "",
    apiKey: "",
    dataExport: {
      enabled: false,
      format: "json",
      endpoint: "",
      frequency: "manual",
    },
  });

  const platforms = [
    { value: "facebook", label: "Facebook", color: "blue" },
    { value: "zalo", label: "Zalo", color: "blue" },
    { value: "gmail", label: "Gmail", color: "red" },
    { value: "instagram", label: "Instagram", color: "pink" },
    { value: "tiktok", label: "TikTok", color: "gray" },
    { value: "twitter", label: "Twitter/X", color: "sky" },
  ];

  const userAgents = [
    { value: "auto", label: "Auto (Random)" },
    { value: "chrome_windows", label: "Chrome - Windows" },
    { value: "chrome_mac", label: "Chrome - macOS" },
    { value: "chrome_linux", label: "Chrome - Linux" },
    { value: "firefox_windows", label: "Firefox - Windows" },
    { value: "safari_mac", label: "Safari - macOS" },
    { value: "edge_windows", label: "Edge - Windows" },
    { value: "custom", label: "Custom User Agent" },
  ];

  const handleConfigChange = (key, value) => {
    setConfig((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleArrayAdd = (key, item) => {
    setConfig((prev) => ({
      ...prev,
      [key]: [...prev[key], item],
    }));
  };

  const handleArrayRemove = (key, index) => {
    setConfig((prev) => ({
      ...prev,
      [key]: prev[key].filter((_, i) => i !== index),
    }));
  };

  const handleSave = () => {
    // Validate required fields
    if (!config.username || !config.password) {
      toast({
        title: "Lỗi validation",
        description: "Vui lòng nhập username và password",
        variant: "destructive",
      });
      return;
    }

    onSave(config);
    toast({
      title: "Đã tạo yêu cầu",
      description: "Yêu cầu Auto Login đã được tạo với cấu hình nâng cao",
    });
    onClose();
  };

  const addTag = () => {
    const tagInput = document.getElementById("tag-input");
    const tagValue = tagInput.value.trim();
    if (tagValue && !config.tags.includes(tagValue)) {
      handleArrayAdd("tags", tagValue);
      tagInput.value = "";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Cấu hình nâng cao Auto Login
          </DialogTitle>
          <DialogDescription>
            Tạo yêu cầu Auto Login với các tùy chọn cấu hình chi tiết và nâng
            cao
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="basic">Cơ bản</TabsTrigger>
            <TabsTrigger value="schedule">Lịch trình</TabsTrigger>
            <TabsTrigger value="proxy">Proxy</TabsTrigger>
            <TabsTrigger value="browser">Trình duyệt</TabsTrigger>
            <TabsTrigger value="security">Bảo mật</TabsTrigger>
            <TabsTrigger value="monitoring">Giám sát</TabsTrigger>
            <TabsTrigger value="ai">AI & ML</TabsTrigger>
            <TabsTrigger value="advanced">Nâng cao</TabsTrigger>
          </TabsList>

          {/* Basic Settings Tab */}
          <TabsContent value="basic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Thông tin đăng nhập
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="platform">Platform</Label>
                    <Select
                      value={config.platform}
                      onValueChange={(value) =>
                        handleConfigChange("platform", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {platforms.map((platform) => (
                          <SelectItem
                            key={platform.value}
                            value={platform.value}
                          >
                            <span className={`text-${platform.color}-600`}>
                              {platform.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority">Độ ưu tiên</Label>
                    <Select
                      value={config.priority}
                      onValueChange={(value) =>
                        handleConfigChange("priority", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Thấp</SelectItem>
                        <SelectItem value="normal">Bình thường</SelectItem>
                        <SelectItem value="high">Cao</SelectItem>
                        <SelectItem value="critical">Khẩn cấp</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Username/Email</Label>
                  <Input
                    id="username"
                    value={config.username}
                    onChange={(e) =>
                      handleConfigChange("username", e.target.value)
                    }
                    placeholder="Nhập username hoặc email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={config.password}
                    onChange={(e) =>
                      handleConfigChange("password", e.target.value)
                    }
                    placeholder="Nhập password"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="template">Template (tùy chọn)</Label>
                  <Select
                    value={config.templateId}
                    onValueChange={(value) =>
                      handleConfigChange("templateId", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn template có sẵn" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Không sử dụng template</SelectItem>
                      <SelectItem value="facebook-basic">
                        Facebook - Basic Login
                      </SelectItem>
                      <SelectItem value="facebook-2fa">
                        Facebook - 2FA Enabled
                      </SelectItem>
                      <SelectItem value="gmail-basic">
                        Gmail - Basic Login
                      </SelectItem>
                      <SelectItem value="instagram-business">
                        Instagram - Business Account
                      </SelectItem>
                      <SelectItem value="custom-template">
                        Custom Template
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Mô tả (tùy chọn)</Label>
                  <Textarea
                    id="description"
                    value={config.description}
                    onChange={(e) =>
                      handleConfigChange("description", e.target.value)
                    }
                    placeholder="Nhập mô tả cho yêu cầu này..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tags</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      id="tag-input"
                      placeholder="Nhập tag..."
                      onKeyPress={(e) => e.key === "Enter" && addTag()}
                    />
                    <Button onClick={addTag} variant="outline" size="sm">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {config.tags.map((tag, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        {tag}
                        <button
                          onClick={() => handleArrayRemove("tags", index)}
                          className="ml-1 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Schedule Settings Tab */}
          <TabsContent value="schedule" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Cài đặt lịch trình
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="schedule-enabled"
                    checked={config.scheduleEnabled}
                    onCheckedChange={(checked) =>
                      handleConfigChange("scheduleEnabled", checked)
                    }
                  />
                  <Label htmlFor="schedule-enabled">Kích hoạt lịch trình</Label>
                </div>

                {config.scheduleEnabled && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="schedule-type">Loại lịch trình</Label>
                        <Select
                          value={config.scheduleType}
                          onValueChange={(value) =>
                            handleConfigChange("scheduleType", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="immediate">
                              Ngay lập tức
                            </SelectItem>
                            <SelectItem value="delayed">Trì hoãn</SelectItem>
                            <SelectItem value="scheduled">Theo lịch</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {config.scheduleType !== "immediate" && (
                        <div className="space-y-2">
                          <Label htmlFor="scheduled-time">
                            Thời gian thực hiện
                          </Label>
                          <Input
                            id="scheduled-time"
                            type="datetime-local"
                            value={config.scheduledTime}
                            onChange={(e) =>
                              handleConfigChange(
                                "scheduledTime",
                                e.target.value
                              )
                            }
                          />
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="repeat-interval">Lặp lại</Label>
                        <Select
                          value={config.repeatInterval}
                          onValueChange={(value) =>
                            handleConfigChange("repeatInterval", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="once">Một lần</SelectItem>
                            <SelectItem value="hourly">Hàng giờ</SelectItem>
                            <SelectItem value="daily">Hàng ngày</SelectItem>
                            <SelectItem value="weekly">Hàng tuần</SelectItem>
                            <SelectItem value="monthly">Hàng tháng</SelectItem>
                            <SelectItem value="custom">
                              Custom (Cron)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="max-retries">Số lần thử lại</Label>
                        <Input
                          id="max-retries"
                          type="number"
                          min="0"
                          max="10"
                          value={config.maxRetries}
                          onChange={(e) =>
                            handleConfigChange(
                              "maxRetries",
                              parseInt(e.target.value)
                            )
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="retry-delay">
                          Delay giữa các lần thử (giây)
                        </Label>
                        <Input
                          id="retry-delay"
                          type="number"
                          min="30"
                          max="3600"
                          value={config.retryDelay}
                          onChange={(e) =>
                            handleConfigChange(
                              "retryDelay",
                              parseInt(e.target.value)
                            )
                          }
                        />
                      </div>
                    </div>

                    {config.repeatInterval === "custom" && (
                      <div className="space-y-2">
                        <Label htmlFor="cron-expression">Cron Expression</Label>
                        <Input
                          id="cron-expression"
                          value={config.cronExpression}
                          onChange={(e) =>
                            handleConfigChange("cronExpression", e.target.value)
                          }
                          placeholder="0 9 * * 1-5 (9 AM, weekdays)"
                        />
                        <p className="text-xs text-muted-foreground">
                          Format: phút giờ ngày tháng thứ (VD: 0 9 * * 1-5 = 9h
                          sáng các ngày trong tuần)
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="backoff-strategy">Retry Strategy</Label>
                        <Select
                          value={config.backoffStrategy}
                          onValueChange={(value) =>
                            handleConfigChange("backoffStrategy", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="linear">Linear</SelectItem>
                            <SelectItem value="exponential">
                              Exponential
                            </SelectItem>
                            <SelectItem value="fibonacci">Fibonacci</SelectItem>
                            <SelectItem value="random">Random</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center space-x-2 pt-6">
                        <Switch
                          id="smart-retry"
                          checked={config.enableSmartRetry}
                          onCheckedChange={(checked) =>
                            handleConfigChange("enableSmartRetry", checked)
                          }
                        />
                        <Label htmlFor="smart-retry">Smart Retry (AI)</Label>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Proxy Settings Tab */}
          <TabsContent value="proxy" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Network className="w-5 h-5" />
                  Cài đặt Proxy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="use-proxy"
                    checked={config.useProxy}
                    onCheckedChange={(checked) =>
                      handleConfigChange("useProxy", checked)
                    }
                  />
                  <Label htmlFor="use-proxy">Sử dụng Proxy</Label>
                </div>

                {config.useProxy && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="proxy-type">Loại Proxy</Label>
                        <Select
                          value={config.proxyType}
                          onValueChange={(value) =>
                            handleConfigChange("proxyType", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="http">HTTP</SelectItem>
                            <SelectItem value="https">HTTPS</SelectItem>
                            <SelectItem value="socks4">SOCKS4</SelectItem>
                            <SelectItem value="socks5">SOCKS5</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="proxy-host">Host</Label>
                        <Input
                          id="proxy-host"
                          value={config.proxyHost}
                          onChange={(e) =>
                            handleConfigChange("proxyHost", e.target.value)
                          }
                          placeholder="127.0.0.1"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="proxy-port">Port</Label>
                        <Input
                          id="proxy-port"
                          type="number"
                          value={config.proxyPort}
                          onChange={(e) =>
                            handleConfigChange("proxyPort", e.target.value)
                          }
                          placeholder="8080"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="proxy-username">
                          Username (tùy chọn)
                        </Label>
                        <Input
                          id="proxy-username"
                          value={config.proxyUsername}
                          onChange={(e) =>
                            handleConfigChange("proxyUsername", e.target.value)
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="proxy-password">
                          Password (tùy chọn)
                        </Label>
                        <Input
                          id="proxy-password"
                          type="password"
                          value={config.proxyPassword}
                          onChange={(e) =>
                            handleConfigChange("proxyPassword", e.target.value)
                          }
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="proxy-rotation"
                        checked={config.proxyRotation}
                        onCheckedChange={(checked) =>
                          handleConfigChange("proxyRotation", checked)
                        }
                      />
                      <Label htmlFor="proxy-rotation">Tự động xoay proxy</Label>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Browser Settings Tab */}
          <TabsContent value="browser" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Chrome className="w-5 h-5" />
                  Cài đặt trình duyệt
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="user-agent">User Agent</Label>
                    <Select
                      value={config.userAgent}
                      onValueChange={(value) =>
                        handleConfigChange("userAgent", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {userAgents.map((ua) => (
                          <SelectItem key={ua.value} value={ua.value}>
                            {ua.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="window-size">Kích thước cửa sổ</Label>
                    <Select
                      value={config.browserWindowSize}
                      onValueChange={(value) =>
                        handleConfigChange("browserWindowSize", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1920x1080">
                          1920x1080 (Full HD)
                        </SelectItem>
                        <SelectItem value="1366x768">
                          1366x768 (Laptop)
                        </SelectItem>
                        <SelectItem value="1280x720">1280x720 (HD)</SelectItem>
                        <SelectItem value="375x667">
                          375x667 (Mobile)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {config.userAgent === "custom" && (
                  <div className="space-y-2">
                    <Label htmlFor="custom-user-agent">Custom User Agent</Label>
                    <Input
                      id="custom-user-agent"
                      value={config.customUserAgent}
                      onChange={(e) =>
                        handleConfigChange("customUserAgent", e.target.value)
                      }
                      placeholder="Mozilla/5.0 (Windows NT 10.0; Win64; x64)..."
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="headless"
                      checked={config.browserHeadless}
                      onCheckedChange={(checked) =>
                        handleConfigChange("browserHeadless", checked)
                      }
                    />
                    <Label htmlFor="headless">Chế độ ẩn (Headless)</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enable-images"
                      checked={config.enableImages}
                      onCheckedChange={(checked) =>
                        handleConfigChange("enableImages", checked)
                      }
                    />
                    <Label htmlFor="enable-images">Tải hình ảnh</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enable-javascript"
                      checked={config.enableJavaScript}
                      onCheckedChange={(checked) =>
                        handleConfigChange("enableJavaScript", checked)
                      }
                    />
                    <Label htmlFor="enable-javascript">
                      Kích hoạt JavaScript
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="clear-cookies"
                      checked={config.clearCookies}
                      onCheckedChange={(checked) =>
                        handleConfigChange("clearCookies", checked)
                      }
                    />
                    <Label htmlFor="clear-cookies">Xóa cookies</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enable-plugins"
                      checked={config.enablePlugins}
                      onCheckedChange={(checked) =>
                        handleConfigChange("enablePlugins", checked)
                      }
                    />
                    <Label htmlFor="enable-plugins">Enable Plugins</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="fingerprint-protection"
                      checked={config.fingerprintProtection}
                      onCheckedChange={(checked) =>
                        handleConfigChange("fingerprintProtection", checked)
                      }
                    />
                    <Label htmlFor="fingerprint-protection">
                      Fingerprint Protection
                    </Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="browser-profile">Browser Profile</Label>
                  <Select
                    value={config.browserProfile}
                    onValueChange={(value) =>
                      handleConfigChange("browserProfile", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="stealth">Stealth</SelectItem>
                      <SelectItem value="fast">Fast (No Extensions)</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Cài đặt bảo mật
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enable-stealth"
                      checked={config.enableStealth}
                      onCheckedChange={(checked) =>
                        handleConfigChange("enableStealth", checked)
                      }
                    />
                    <Label htmlFor="enable-stealth">Chế độ Stealth</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="randomize-delay"
                      checked={config.randomizeDelay}
                      onCheckedChange={(checked) =>
                        handleConfigChange("randomizeDelay", checked)
                      }
                    />
                    <Label htmlFor="randomize-delay">
                      Ngẫu nhiên hóa delay
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enable-captcha"
                      checked={config.enableCaptchaSolver}
                      onCheckedChange={(checked) =>
                        handleConfigChange("enableCaptchaSolver", checked)
                      }
                    />
                    <Label htmlFor="enable-captcha">Giải CAPTCHA tự động</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enable-screenshots"
                      checked={config.enableScreenshots}
                      onCheckedChange={(checked) =>
                        handleConfigChange("enableScreenshots", checked)
                      }
                    />
                    <Label htmlFor="enable-screenshots">
                      Chụp ảnh màn hình
                    </Label>
                  </div>
                </div>

                {config.randomizeDelay && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="min-delay">Delay tối thiểu (ms)</Label>
                      <Input
                        id="min-delay"
                        type="number"
                        min="100"
                        value={config.minDelay}
                        onChange={(e) =>
                          handleConfigChange(
                            "minDelay",
                            parseInt(e.target.value)
                          )
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="max-delay">Delay tối đa (ms)</Label>
                      <Input
                        id="max-delay"
                        type="number"
                        min="1000"
                        value={config.maxDelay}
                        onChange={(e) =>
                          handleConfigChange(
                            "maxDelay",
                            parseInt(e.target.value)
                          )
                        }
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enable-ip-rotation"
                      checked={config.enableIPRotation}
                      onCheckedChange={(checked) =>
                        handleConfigChange("enableIPRotation", checked)
                      }
                    />
                    <Label htmlFor="enable-ip-rotation">IP Rotation</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enable-dns-https"
                      checked={config.enableDNSOverHTTPS}
                      onCheckedChange={(checked) =>
                        handleConfigChange("enableDNSOverHTTPS", checked)
                      }
                    />
                    <Label htmlFor="enable-dns-https">DNS over HTTPS</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enable-tor"
                      checked={config.enableTorProxy}
                      onCheckedChange={(checked) =>
                        handleConfigChange("enableTorProxy", checked)
                      }
                    />
                    <Label htmlFor="enable-tor">Tor Proxy</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="encrypt-credentials"
                      checked={config.encryptCredentials}
                      onCheckedChange={(checked) =>
                        handleConfigChange("encryptCredentials", checked)
                      }
                    />
                    <Label htmlFor="encrypt-credentials">
                      Encrypt Credentials
                    </Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="webhook-url">Webhook URL (tùy chọn)</Label>
                  <Input
                    id="webhook-url"
                    value={config.webhookUrl}
                    onChange={(e) =>
                      handleConfigChange("webhookUrl", e.target.value)
                    }
                    placeholder="https://your-webhook-url.com"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="discord-webhook">Discord Webhook</Label>
                    <Input
                      id="discord-webhook"
                      value={config.discordWebhook}
                      onChange={(e) =>
                        handleConfigChange("discordWebhook", e.target.value)
                      }
                      placeholder="https://discord.com/api/webhooks/..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telegram-bot">Telegram Bot Token</Label>
                    <Input
                      id="telegram-bot"
                      value={config.telegramBot}
                      onChange={(e) =>
                        handleConfigChange("telegramBot", e.target.value)
                      }
                      placeholder="123456:ABC-DEF..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="notify-schedule"
                      checked={config.notifyOnSchedule}
                      onCheckedChange={(checked) =>
                        handleConfigChange("notifyOnSchedule", checked)
                      }
                    />
                    <Label htmlFor="notify-schedule">Notify on Schedule</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="email-notifications"
                      checked={config.emailNotifications}
                      onCheckedChange={(checked) =>
                        handleConfigChange("emailNotifications", checked)
                      }
                    />
                    <Label htmlFor="email-notifications">
                      Email Notifications
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Monitoring Tab */}
          <TabsContent value="monitoring" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Real-time Monitoring
                </CardTitle>
                <CardDescription>
                  Giám sát và phân tích hiệu suất chi tiết
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enable-video-recording"
                      checked={config.enableVideoRecording}
                      onCheckedChange={(checked) =>
                        handleConfigChange("enableVideoRecording", checked)
                      }
                    />
                    <Label htmlFor="enable-video-recording">
                      Video Recording
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enable-performance-metrics"
                      checked={config.enablePerformanceMetrics}
                      onCheckedChange={(checked) =>
                        handleConfigChange("enablePerformanceMetrics", checked)
                      }
                    />
                    <Label htmlFor="enable-performance-metrics">
                      Performance Metrics
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enable-realtime-monitoring"
                      checked={config.enableRealTimeMonitoring}
                      onCheckedChange={(checked) =>
                        handleConfigChange("enableRealTimeMonitoring", checked)
                      }
                    />
                    <Label htmlFor="enable-realtime-monitoring">
                      Real-time Monitoring
                    </Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="monitoring-webhook">Monitoring Webhook</Label>
                  <Input
                    id="monitoring-webhook"
                    value={config.monitoringWebhook}
                    onChange={(e) =>
                      handleConfigChange("monitoringWebhook", e.target.value)
                    }
                    placeholder="https://monitoring-endpoint.com"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI & ML Tab */}
          <TabsContent value="ai" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  AI & Machine Learning
                </CardTitle>
                <CardDescription>
                  Tính năng thông minh và tự động hóa AI
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enable-ai-optimization"
                      checked={config.enableAIOptimization}
                      onCheckedChange={(checked) =>
                        handleConfigChange("enableAIOptimization", checked)
                      }
                    />
                    <Label htmlFor="enable-ai-optimization">
                      AI Optimization
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="learning-mode"
                      checked={config.learningMode}
                      onCheckedChange={(checked) =>
                        handleConfigChange("learningMode", checked)
                      }
                    />
                    <Label htmlFor="learning-mode">Learning Mode</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="adaptive-delay"
                      checked={config.adaptiveDelay}
                      onCheckedChange={(checked) =>
                        handleConfigChange("adaptiveDelay", checked)
                      }
                    />
                    <Label htmlFor="adaptive-delay">Adaptive Delay</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="behavior-mimicking"
                      checked={config.behaviorMimicking}
                      onCheckedChange={(checked) =>
                        handleConfigChange("behaviorMimicking", checked)
                      }
                    />
                    <Label htmlFor="behavior-mimicking">
                      Human Behavior Mimicking
                    </Label>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Zap className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-blue-800 dark:text-blue-300">
                        AI Features (Beta)
                      </h3>
                      <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                        Các tính năng AI đang trong giai đoạn beta. Sử dụng với
                        thận trọng trong môi trường production.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Advanced Settings Tab */}
          <TabsContent value="advanced" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Cài đặt nâng cao
                </CardTitle>
                <CardDescription>
                  Các tùy chọn nâng cao cho người dùng chuyên nghiệp
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="session-timeout">
                      Session Timeout (ms)
                    </Label>
                    <Input
                      id="session-timeout"
                      type="number"
                      value={config.sessionTimeout}
                      onChange={(e) =>
                        handleConfigChange(
                          "sessionTimeout",
                          parseInt(e.target.value)
                        )
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="page-load-timeout">
                      Page Load Timeout (ms)
                    </Label>
                    <Input
                      id="page-load-timeout"
                      type="number"
                      value={config.pageLoadTimeout}
                      onChange={(e) =>
                        handleConfigChange(
                          "pageLoadTimeout",
                          parseInt(e.target.value)
                        )
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="element-timeout">
                      Element Timeout (ms)
                    </Label>
                    <Input
                      id="element-timeout"
                      type="number"
                      value={config.elementTimeout}
                      onChange={(e) =>
                        handleConfigChange(
                          "elementTimeout",
                          parseInt(e.target.value)
                        )
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pre-login-script">
                    Pre-Login Script (JavaScript)
                  </Label>
                  <Textarea
                    id="pre-login-script"
                    value={config.preLoginScript}
                    onChange={(e) =>
                      handleConfigChange("preLoginScript", e.target.value)
                    }
                    placeholder="// Code to execute before login attempt
// Example: document.querySelector('#accept-cookies').click();"
                    rows={4}
                    className="font-mono text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="custom-script">
                    Login Script (JavaScript)
                  </Label>
                  <Textarea
                    id="custom-script"
                    value={config.customScript}
                    onChange={(e) =>
                      handleConfigChange("customScript", e.target.value)
                    }
                    placeholder="// Custom JavaScript code to execute during login
// Example: document.querySelector('#custom-element').click();"
                    rows={6}
                    className="font-mono text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="post-login-script">
                    Post-Login Script (JavaScript)
                  </Label>
                  <Textarea
                    id="post-login-script"
                    value={config.postLoginScript}
                    onChange={(e) =>
                      handleConfigChange("postLoginScript", e.target.value)
                    }
                    placeholder="// Code to execute after successful login
// Example: await page.goto('/dashboard');"
                    rows={4}
                    className="font-mono text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Environment Variables</Label>
                  <div className="p-3 border rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm">
                        Variables (
                        {Object.keys(config.environmentVariables).length})
                      </span>
                      <Button size="sm" variant="outline">
                        <Plus className="w-3 h-3 mr-1" />
                        Add Variable
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Thiết lập biến môi trường cho script sử dụng
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>API Integration</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="api-integration"
                        checked={config.apiIntegration}
                        onCheckedChange={(checked) =>
                          handleConfigChange("apiIntegration", checked)
                        }
                      />
                      <Label htmlFor="api-integration">Enable API</Label>
                    </div>
                  </div>

                  {config.apiIntegration && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="api-endpoint">API Endpoint</Label>
                        <Input
                          id="api-endpoint"
                          value={config.apiEndpoint}
                          onChange={(e) =>
                            handleConfigChange("apiEndpoint", e.target.value)
                          }
                          placeholder="https://api.example.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="api-key">API Key</Label>
                        <Input
                          id="api-key"
                          type="password"
                          value={config.apiKey}
                          onChange={(e) =>
                            handleConfigChange("apiKey", e.target.value)
                          }
                          placeholder="Your API key"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enable-logging"
                      checked={config.enableLogging}
                      onCheckedChange={(checked) =>
                        handleConfigChange("enableLogging", checked)
                      }
                    />
                    <Label htmlFor="enable-logging">Enable Logging</Label>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="log-level">Log Level</Label>
                    <Select
                      value={config.logLevel}
                      onValueChange={(value) =>
                        handleConfigChange("logLevel", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="debug">Debug</SelectItem>
                        <SelectItem value="info">Info</SelectItem>
                        <SelectItem value="warn">Warning</SelectItem>
                        <SelectItem value="error">Error</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-yellow-800">
                      Lưu ý quan trọng
                    </h3>
                    <p className="text-sm text-yellow-700 mt-1">
                      Các cài đặt nâng cao có thể ảnh hưởng đến hiệu năng và độ
                      ổn định của hệ thống. Chỉ thay đổi khi bạn hiểu rõ tác
                      động của chúng.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button onClick={handleSave} className="flex items-center gap-2">
            <Save className="w-4 h-4" />
            Tạo yêu cầu
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AutoLoginAdvancedModal;
