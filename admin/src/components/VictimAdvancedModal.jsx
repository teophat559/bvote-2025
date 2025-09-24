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
  User,
  Save,
  Settings,
  Shield,
  Globe,
  Calendar,
  Target,
  Activity,
  AlertTriangle,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Key,
  Lock,
  Smartphone,
  Computer,
  Wifi,
  Clock,
  Zap,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const VictimAdvancedModal = ({
  isOpen,
  onClose,
  onSave,
  editingVictim = null,
}) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("basic");
  const [showPassword, setShowPassword] = useState(false);

  const [victim, setVictim] = useState({
    // Basic Information
    email: editingVictim?.email || "",
    password: editingVictim?.password || "",
    platform: editingVictim?.platform || "Facebook",
    category: editingVictim?.category || "Personal",
    priority: editingVictim?.priority || "medium",
    tags: editingVictim?.tags || [],
    notes: editingVictim?.notes || "",

    // Geographic & Device Info
    country: editingVictim?.country || "VN",
    region: editingVictim?.region || "",
    city: editingVictim?.city || "",
    timezone: editingVictim?.timezone || "Asia/Ho_Chi_Minh",
    deviceType: editingVictim?.deviceType || "Desktop",
    deviceModel: editingVictim?.deviceModel || "",
    operatingSystem: editingVictim?.operatingSystem || "Windows",

    // Security Settings
    security: {
      twoFactor: editingVictim?.security?.twoFactor || false,
      twoFactorMethod: editingVictim?.security?.twoFactorMethod || "sms",
      backupCodes: editingVictim?.security?.backupCodes || [],
      recoveryEmail: editingVictim?.security?.recoveryEmail || "",
      recoveryPhone: editingVictim?.security?.recoveryPhone || "",
      captchaRisk: editingVictim?.security?.captchaRisk || "low",
      detectionRisk: editingVictim?.security?.detectionRisk || "none",
      securityQuestions: editingVictim?.security?.securityQuestions || [],
      sessionToken: editingVictim?.security?.sessionToken || "",
      lastPasswordChange: editingVictim?.security?.lastPasswordChange || "",
    },

    // Proxy & Network
    proxy: {
      enabled: editingVictim?.proxy?.enabled || false,
      type: editingVictim?.proxy?.type || "http",
      host: editingVictim?.proxy?.host || "",
      port: editingVictim?.proxy?.port || "",
      username: editingVictim?.proxy?.username || "",
      password: editingVictim?.proxy?.password || "",
      rotation: editingVictim?.proxy?.rotation || false,
      location: editingVictim?.proxy?.location || "auto",
    },

    // Automation Settings
    automation: {
      enabled: editingVictim?.automation?.enabled || false,
      frequency: editingVictim?.automation?.frequency || "daily",
      schedule: editingVictim?.automation?.schedule || "09:00",
      maxSessionsPerDay: editingVictim?.automation?.maxSessionsPerDay || 5,
      sessionDuration: editingVictim?.automation?.sessionDuration || 30,
      randomDelay: editingVictim?.automation?.randomDelay || true,
      minDelay: editingVictim?.automation?.minDelay || 300,
      maxDelay: editingVictim?.automation?.maxDelay || 900,
      retryAttempts: editingVictim?.automation?.retryAttempts || 3,
      retryDelay: editingVictim?.automation?.retryDelay || 600,
      pauseOnFailure: editingVictim?.automation?.pauseOnFailure || true,
      customScript: editingVictim?.automation?.customScript || "",
    },

    // Monitoring & Analytics
    monitoring: {
      trackActivity: editingVictim?.monitoring?.trackActivity || true,
      enableScreenshots: editingVictim?.monitoring?.enableScreenshots || false,
      screenshotOnError: editingVictim?.monitoring?.screenshotOnError || true,
      logLevel: editingVictim?.monitoring?.logLevel || "info",
      enableWebhooks: editingVictim?.monitoring?.enableWebhooks || false,
      webhookUrl: editingVictim?.monitoring?.webhookUrl || "",
      alertOnFailure: editingVictim?.monitoring?.alertOnFailure || true,
      alertOnSuccess: editingVictim?.monitoring?.alertOnSuccess || false,
      alertThreshold: editingVictim?.monitoring?.alertThreshold || 3,
    },

    // Advanced Options
    advanced: {
      userAgent: editingVictim?.advanced?.userAgent || "auto",
      customUserAgent: editingVictim?.advanced?.customUserAgent || "",
      browserFingerprint: editingVictim?.advanced?.browserFingerprint || true,
      stealthMode: editingVictim?.advanced?.stealthMode || true,
      cookieManagement: editingVictim?.advanced?.cookieManagement || "auto",
      sessionPersistence: editingVictim?.advanced?.sessionPersistence || true,
      geoSpoofing: editingVictim?.advanced?.geoSpoofing || false,
      timezoneSpoofing: editingVictim?.advanced?.timezoneSpoofing || false,
      languagePreference:
        editingVictim?.advanced?.languagePreference || "vi-VN",
      enableJavaScript: editingVictim?.advanced?.enableJavaScript || true,
      enableImages: editingVictim?.advanced?.enableImages || false,
      enablePlugins: editingVictim?.advanced?.enablePlugins || false,
    },
  });

  const platforms = [
    { value: "Facebook", label: "Facebook", icon: "🔵" },
    { value: "Zalo", label: "Zalo", icon: "🔴" },
    { value: "Gmail", label: "Gmail", icon: "📧" },
    { value: "Instagram", label: "Instagram", icon: "📷" },
    { value: "TikTok", label: "TikTok", icon: "🎵" },
    { value: "Twitter", label: "Twitter/X", icon: "🐦" },
  ];

  const categories = [
    "Personal",
    "Business",
    "Social",
    "Testing",
    "Research",
    "VIP",
  ];
  const priorities = ["low", "medium", "high", "critical"];
  const deviceTypes = ["Desktop", "Mobile", "Tablet"];
  const operatingSystems = ["Windows", "macOS", "Linux", "Android", "iOS"];
  const countries = [
    "VN",
    "US",
    "UK",
    "DE",
    "FR",
    "JP",
    "KR",
    "SG",
    "TH",
    "ID",
  ];

  const handleVictimChange = (path, value) => {
    setVictim((prev) => {
      const keys = path.split(".");
      if (keys.length === 1) {
        return { ...prev, [keys[0]]: value };
      }

      const [category, field] = keys;
      return {
        ...prev,
        [category]: {
          ...prev[category],
          [field]: value,
        },
      };
    });
  };

  const handleArrayAdd = (path, item) => {
    const current = path.split(".").reduce((obj, key) => obj[key], victim);
    const newArray = [...current, item];
    handleVictimChange(path, newArray);
  };

  const handleArrayRemove = (path, index) => {
    const current = path.split(".").reduce((obj, key) => obj[key], victim);
    const newArray = current.filter((_, i) => i !== index);
    handleVictimChange(path, newArray);
  };

  const addTag = () => {
    const tagInput = document.getElementById("tag-input");
    const tagValue = tagInput.value.trim();
    if (tagValue && !victim.tags.includes(tagValue)) {
      handleArrayAdd("tags", tagValue);
      tagInput.value = "";
    }
  };

  const addBackupCode = () => {
    const codeInput = document.getElementById("backup-code-input");
    const codeValue = codeInput.value.trim();
    if (codeValue && !victim.security.backupCodes.includes(codeValue)) {
      handleArrayAdd("security.backupCodes", codeValue);
      codeInput.value = "";
    }
  };

  const handleSave = () => {
    // Validation
    if (!victim.email || !victim.password) {
      toast({
        title: "Lỗi validation",
        description: "Email và password là bắt buộc",
        variant: "destructive",
      });
      return;
    }

    if (!victim.email.includes("@")) {
      toast({
        title: "Lỗi validation",
        description: "Email không hợp lệ",
        variant: "destructive",
      });
      return;
    }

    onSave(victim);
    toast({
      title: "Thành công",
      description: editingVictim
        ? "Victim đã được cập nhật"
        : "Victim mới đã được tạo",
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            {editingVictim ? "Chỉnh sửa Victim" : "Thêm Victim mới"}
          </DialogTitle>
          <DialogDescription>
            Cấu hình chi tiết và nâng cao cho victim target
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="basic">Cơ bản</TabsTrigger>
            <TabsTrigger value="security">Bảo mật</TabsTrigger>
            <TabsTrigger value="proxy">Proxy</TabsTrigger>
            <TabsTrigger value="automation">Automation</TabsTrigger>
            <TabsTrigger value="monitoring">Giám sát</TabsTrigger>
            <TabsTrigger value="advanced">Nâng cao</TabsTrigger>
          </TabsList>

          {/* Basic Information Tab */}
          <TabsContent value="basic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Thông tin cơ bản
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={victim.email}
                      onChange={(e) =>
                        handleVictimChange("email", e.target.value)
                      }
                      placeholder="victim@example.com"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={victim.password}
                        onChange={(e) =>
                          handleVictimChange("password", e.target.value)
                        }
                        placeholder="Nhập password"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="platform">Platform</Label>
                    <Select
                      value={victim.platform}
                      onValueChange={(value) =>
                        handleVictimChange("platform", value)
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
                            <div className="flex items-center gap-2">
                              <span>{platform.icon}</span>
                              <span>{platform.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Danh mục</Label>
                    <Select
                      value={victim.category}
                      onValueChange={(value) =>
                        handleVictimChange("category", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority">Độ ưu tiên</Label>
                    <Select
                      value={victim.priority}
                      onValueChange={(value) =>
                        handleVictimChange("priority", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {priorities.map((priority) => (
                          <SelectItem key={priority} value={priority}>
                            <span className="capitalize">{priority}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="country">Quốc gia</Label>
                    <Select
                      value={victim.country}
                      onValueChange={(value) =>
                        handleVictimChange("country", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map((country) => (
                          <SelectItem key={country} value={country}>
                            {country}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="device-type">Loại thiết bị</Label>
                    <Select
                      value={victim.deviceType}
                      onValueChange={(value) =>
                        handleVictimChange("deviceType", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {deviceTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            <div className="flex items-center gap-2">
                              {type === "Desktop" && (
                                <Computer className="w-4 h-4" />
                              )}
                              {type === "Mobile" && (
                                <Smartphone className="w-4 h-4" />
                              )}
                              {type === "Tablet" && (
                                <Smartphone className="w-4 h-4" />
                              )}
                              <span>{type}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Ghi chú</Label>
                  <Textarea
                    id="notes"
                    value={victim.notes}
                    onChange={(e) =>
                      handleVictimChange("notes", e.target.value)
                    }
                    placeholder="Ghi chú về victim này..."
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
                    {victim.tags.map((tag, index) => (
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

          {/* Security Tab */}
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
                      id="two-factor"
                      checked={victim.security.twoFactor}
                      onCheckedChange={(checked) =>
                        handleVictimChange("security.twoFactor", checked)
                      }
                    />
                    <Label htmlFor="two-factor">
                      Two-Factor Authentication
                    </Label>
                  </div>

                  {victim.security.twoFactor && (
                    <div className="space-y-2">
                      <Label htmlFor="two-factor-method">Phương thức 2FA</Label>
                      <Select
                        value={victim.security.twoFactorMethod}
                        onValueChange={(value) =>
                          handleVictimChange("security.twoFactorMethod", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sms">SMS</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="app">Authenticator App</SelectItem>
                          <SelectItem value="backup">Backup Codes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="recovery-email">Recovery Email</Label>
                    <Input
                      id="recovery-email"
                      type="email"
                      value={victim.security.recoveryEmail}
                      onChange={(e) =>
                        handleVictimChange(
                          "security.recoveryEmail",
                          e.target.value
                        )
                      }
                      placeholder="recovery@example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="recovery-phone">Recovery Phone</Label>
                    <Input
                      id="recovery-phone"
                      value={victim.security.recoveryPhone}
                      onChange={(e) =>
                        handleVictimChange(
                          "security.recoveryPhone",
                          e.target.value
                        )
                      }
                      placeholder="+84xxxxxxxxx"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="captcha-risk">CAPTCHA Risk Level</Label>
                    <Select
                      value={victim.security.captchaRisk}
                      onValueChange={(value) =>
                        handleVictimChange("security.captchaRisk", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="detection-risk">Detection Risk</Label>
                    <Select
                      value={victim.security.detectionRisk}
                      onValueChange={(value) =>
                        handleVictimChange("security.detectionRisk", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {victim.security.twoFactor &&
                  victim.security.twoFactorMethod === "backup" && (
                    <div className="space-y-2">
                      <Label>Backup Codes</Label>
                      <div className="flex gap-2 mb-2">
                        <Input
                          id="backup-code-input"
                          placeholder="Nhập backup code..."
                          onKeyPress={(e) =>
                            e.key === "Enter" && addBackupCode()
                          }
                        />
                        <Button
                          onClick={addBackupCode}
                          variant="outline"
                          size="sm"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="space-y-1">
                        {victim.security.backupCodes.map((code, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 bg-muted rounded"
                          >
                            <span className="font-mono">{code}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                handleArrayRemove("security.backupCodes", index)
                              }
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                <div className="space-y-2">
                  <Label htmlFor="session-token">Session Token (nếu có)</Label>
                  <Textarea
                    id="session-token"
                    value={victim.security.sessionToken}
                    onChange={(e) =>
                      handleVictimChange(
                        "security.sessionToken",
                        e.target.value
                      )
                    }
                    placeholder="Session token hoặc cookies..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Proxy Tab */}
          <TabsContent value="proxy" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Cài đặt Proxy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="proxy-enabled"
                    checked={victim.proxy.enabled}
                    onCheckedChange={(checked) =>
                      handleVictimChange("proxy.enabled", checked)
                    }
                  />
                  <Label htmlFor="proxy-enabled">Sử dụng Proxy</Label>
                </div>

                {victim.proxy.enabled && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="proxy-type">Loại Proxy</Label>
                        <Select
                          value={victim.proxy.type}
                          onValueChange={(value) =>
                            handleVictimChange("proxy.type", value)
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
                          value={victim.proxy.host}
                          onChange={(e) =>
                            handleVictimChange("proxy.host", e.target.value)
                          }
                          placeholder="127.0.0.1"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="proxy-port">Port</Label>
                        <Input
                          id="proxy-port"
                          type="number"
                          value={victim.proxy.port}
                          onChange={(e) =>
                            handleVictimChange("proxy.port", e.target.value)
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
                          value={victim.proxy.username}
                          onChange={(e) =>
                            handleVictimChange("proxy.username", e.target.value)
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
                          value={victim.proxy.password}
                          onChange={(e) =>
                            handleVictimChange("proxy.password", e.target.value)
                          }
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="proxy-rotation"
                          checked={victim.proxy.rotation}
                          onCheckedChange={(checked) =>
                            handleVictimChange("proxy.rotation", checked)
                          }
                        />
                        <Label htmlFor="proxy-rotation">
                          Tự động xoay proxy
                        </Label>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="proxy-location">Vị trí Proxy</Label>
                        <Select
                          value={victim.proxy.location}
                          onValueChange={(value) =>
                            handleVictimChange("proxy.location", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="auto">Auto</SelectItem>
                            <SelectItem value="VN">Vietnam</SelectItem>
                            <SelectItem value="US">United States</SelectItem>
                            <SelectItem value="UK">United Kingdom</SelectItem>
                            <SelectItem value="DE">Germany</SelectItem>
                            <SelectItem value="FR">France</SelectItem>
                            <SelectItem value="JP">Japan</SelectItem>
                            <SelectItem value="SG">Singapore</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Automation Tab */}
          <TabsContent value="automation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Cài đặt Automation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="automation-enabled"
                    checked={victim.automation.enabled}
                    onCheckedChange={(checked) =>
                      handleVictimChange("automation.enabled", checked)
                    }
                  />
                  <Label htmlFor="automation-enabled">
                    Kích hoạt Automation
                  </Label>
                </div>

                {victim.automation.enabled && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="automation-frequency">Tần suất</Label>
                        <Select
                          value={victim.automation.frequency}
                          onValueChange={(value) =>
                            handleVictimChange("automation.frequency", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="manual">Manual</SelectItem>
                            <SelectItem value="hourly">Hàng giờ</SelectItem>
                            <SelectItem value="daily">Hàng ngày</SelectItem>
                            <SelectItem value="weekly">Hàng tuần</SelectItem>
                            <SelectItem value="monthly">Hàng tháng</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="automation-schedule">Thời gian</Label>
                        <Input
                          id="automation-schedule"
                          type="time"
                          value={victim.automation.schedule}
                          onChange={(e) =>
                            handleVictimChange(
                              "automation.schedule",
                              e.target.value
                            )
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="max-sessions">Max Sessions/Day</Label>
                        <Input
                          id="max-sessions"
                          type="number"
                          min="1"
                          max="20"
                          value={victim.automation.maxSessionsPerDay}
                          onChange={(e) =>
                            handleVictimChange(
                              "automation.maxSessionsPerDay",
                              parseInt(e.target.value)
                            )
                          }
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="session-duration">
                          Thời lượng session (phút)
                        </Label>
                        <Input
                          id="session-duration"
                          type="number"
                          min="5"
                          max="180"
                          value={victim.automation.sessionDuration}
                          onChange={(e) =>
                            handleVictimChange(
                              "automation.sessionDuration",
                              parseInt(e.target.value)
                            )
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="retry-attempts">Số lần thử lại</Label>
                        <Input
                          id="retry-attempts"
                          type="number"
                          min="0"
                          max="10"
                          value={victim.automation.retryAttempts}
                          onChange={(e) =>
                            handleVictimChange(
                              "automation.retryAttempts",
                              parseInt(e.target.value)
                            )
                          }
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="random-delay"
                          checked={victim.automation.randomDelay}
                          onCheckedChange={(checked) =>
                            handleVictimChange(
                              "automation.randomDelay",
                              checked
                            )
                          }
                        />
                        <Label htmlFor="random-delay">
                          Ngẫu nhiên hóa delay
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="pause-on-failure"
                          checked={victim.automation.pauseOnFailure}
                          onCheckedChange={(checked) =>
                            handleVictimChange(
                              "automation.pauseOnFailure",
                              checked
                            )
                          }
                        />
                        <Label htmlFor="pause-on-failure">
                          Tạm dừng khi thất bại
                        </Label>
                      </div>
                    </div>

                    {victim.automation.randomDelay && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="min-delay">Min Delay (giây)</Label>
                          <Input
                            id="min-delay"
                            type="number"
                            min="0"
                            value={victim.automation.minDelay}
                            onChange={(e) =>
                              handleVictimChange(
                                "automation.minDelay",
                                parseInt(e.target.value)
                              )
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="max-delay">Max Delay (giây)</Label>
                          <Input
                            id="max-delay"
                            type="number"
                            min="0"
                            value={victim.automation.maxDelay}
                            onChange={(e) =>
                              handleVictimChange(
                                "automation.maxDelay",
                                parseInt(e.target.value)
                              )
                            }
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="custom-script">
                        Custom Script (JavaScript)
                      </Label>
                      <Textarea
                        id="custom-script"
                        value={victim.automation.customScript}
                        onChange={(e) =>
                          handleVictimChange(
                            "automation.customScript",
                            e.target.value
                          )
                        }
                        placeholder="// Custom automation script
// Ví dụ: click thêm elements, wait for specific conditions, etc."
                        rows={6}
                        className="font-mono text-sm"
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Monitoring Tab */}
          <TabsContent value="monitoring" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Giám sát & Cảnh báo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="track-activity"
                      checked={victim.monitoring.trackActivity}
                      onCheckedChange={(checked) =>
                        handleVictimChange("monitoring.trackActivity", checked)
                      }
                    />
                    <Label htmlFor="track-activity">Theo dõi hoạt động</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enable-screenshots"
                      checked={victim.monitoring.enableScreenshots}
                      onCheckedChange={(checked) =>
                        handleVictimChange(
                          "monitoring.enableScreenshots",
                          checked
                        )
                      }
                    />
                    <Label htmlFor="enable-screenshots">
                      Chụp ảnh màn hình
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="screenshot-on-error"
                      checked={victim.monitoring.screenshotOnError}
                      onCheckedChange={(checked) =>
                        handleVictimChange(
                          "monitoring.screenshotOnError",
                          checked
                        )
                      }
                    />
                    <Label htmlFor="screenshot-on-error">
                      Chụp ảnh khi lỗi
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enable-webhooks"
                      checked={victim.monitoring.enableWebhooks}
                      onCheckedChange={(checked) =>
                        handleVictimChange("monitoring.enableWebhooks", checked)
                      }
                    />
                    <Label htmlFor="enable-webhooks">
                      Webhook notifications
                    </Label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="log-level">Log Level</Label>
                    <Select
                      value={victim.monitoring.logLevel}
                      onValueChange={(value) =>
                        handleVictimChange("monitoring.logLevel", value)
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

                  <div className="space-y-2">
                    <Label htmlFor="alert-threshold">
                      Alert Threshold (failures)
                    </Label>
                    <Input
                      id="alert-threshold"
                      type="number"
                      min="1"
                      max="10"
                      value={victim.monitoring.alertThreshold}
                      onChange={(e) =>
                        handleVictimChange(
                          "monitoring.alertThreshold",
                          parseInt(e.target.value)
                        )
                      }
                    />
                  </div>
                </div>

                {victim.monitoring.enableWebhooks && (
                  <div className="space-y-2">
                    <Label htmlFor="webhook-url">Webhook URL</Label>
                    <Input
                      id="webhook-url"
                      type="url"
                      value={victim.monitoring.webhookUrl}
                      onChange={(e) =>
                        handleVictimChange(
                          "monitoring.webhookUrl",
                          e.target.value
                        )
                      }
                      placeholder="https://your-webhook-url.com"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="alert-on-failure"
                      checked={victim.monitoring.alertOnFailure}
                      onCheckedChange={(checked) =>
                        handleVictimChange("monitoring.alertOnFailure", checked)
                      }
                    />
                    <Label htmlFor="alert-on-failure">
                      Cảnh báo khi thất bại
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="alert-on-success"
                      checked={victim.monitoring.alertOnSuccess}
                      onCheckedChange={(checked) =>
                        handleVictimChange("monitoring.alertOnSuccess", checked)
                      }
                    />
                    <Label htmlFor="alert-on-success">
                      Cảnh báo khi thành công
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Advanced Tab */}
          <TabsContent value="advanced" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Cài đặt nâng cao
                </CardTitle>
                <CardDescription>
                  Các tùy chọn nâng cao cho chuyên gia
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="user-agent">User Agent</Label>
                    <Select
                      value={victim.advanced.userAgent}
                      onValueChange={(value) =>
                        handleVictimChange("advanced.userAgent", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Auto</SelectItem>
                        <SelectItem value="chrome">Chrome</SelectItem>
                        <SelectItem value="firefox">Firefox</SelectItem>
                        <SelectItem value="safari">Safari</SelectItem>
                        <SelectItem value="edge">Edge</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cookie-management">Cookie Management</Label>
                    <Select
                      value={victim.advanced.cookieManagement}
                      onValueChange={(value) =>
                        handleVictimChange("advanced.cookieManagement", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Auto</SelectItem>
                        <SelectItem value="persist">Persist</SelectItem>
                        <SelectItem value="clear">
                          Clear Each Session
                        </SelectItem>
                        <SelectItem value="manual">Manual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {victim.advanced.userAgent === "custom" && (
                  <div className="space-y-2">
                    <Label htmlFor="custom-user-agent">Custom User Agent</Label>
                    <Input
                      id="custom-user-agent"
                      value={victim.advanced.customUserAgent}
                      onChange={(e) =>
                        handleVictimChange(
                          "advanced.customUserAgent",
                          e.target.value
                        )
                      }
                      placeholder="Mozilla/5.0 (Windows NT 10.0; Win64; x64)..."
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="browser-fingerprint"
                      checked={victim.advanced.browserFingerprint}
                      onCheckedChange={(checked) =>
                        handleVictimChange(
                          "advanced.browserFingerprint",
                          checked
                        )
                      }
                    />
                    <Label htmlFor="browser-fingerprint">
                      Browser Fingerprinting
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="stealth-mode"
                      checked={victim.advanced.stealthMode}
                      onCheckedChange={(checked) =>
                        handleVictimChange("advanced.stealthMode", checked)
                      }
                    />
                    <Label htmlFor="stealth-mode">Stealth Mode</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="session-persistence"
                      checked={victim.advanced.sessionPersistence}
                      onCheckedChange={(checked) =>
                        handleVictimChange(
                          "advanced.sessionPersistence",
                          checked
                        )
                      }
                    />
                    <Label htmlFor="session-persistence">
                      Session Persistence
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="geo-spoofing"
                      checked={victim.advanced.geoSpoofing}
                      onCheckedChange={(checked) =>
                        handleVictimChange("advanced.geoSpoofing", checked)
                      }
                    />
                    <Label htmlFor="geo-spoofing">Geo Spoofing</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="timezone-spoofing"
                      checked={victim.advanced.timezoneSpoofing}
                      onCheckedChange={(checked) =>
                        handleVictimChange("advanced.timezoneSpoofing", checked)
                      }
                    />
                    <Label htmlFor="timezone-spoofing">Timezone Spoofing</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enable-javascript"
                      checked={victim.advanced.enableJavaScript}
                      onCheckedChange={(checked) =>
                        handleVictimChange("advanced.enableJavaScript", checked)
                      }
                    />
                    <Label htmlFor="enable-javascript">Enable JavaScript</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enable-images"
                      checked={victim.advanced.enableImages}
                      onCheckedChange={(checked) =>
                        handleVictimChange("advanced.enableImages", checked)
                      }
                    />
                    <Label htmlFor="enable-images">Load Images</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enable-plugins"
                      checked={victim.advanced.enablePlugins}
                      onCheckedChange={(checked) =>
                        handleVictimChange("advanced.enablePlugins", checked)
                      }
                    />
                    <Label htmlFor="enable-plugins">Enable Plugins</Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language-preference">
                    Language Preference
                  </Label>
                  <Select
                    value={victim.advanced.languagePreference}
                    onValueChange={(value) =>
                      handleVictimChange("advanced.languagePreference", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vi-VN">Tiếng Việt</SelectItem>
                      <SelectItem value="en-US">English (US)</SelectItem>
                      <SelectItem value="en-GB">English (UK)</SelectItem>
                      <SelectItem value="zh-CN">中文 (简体)</SelectItem>
                      <SelectItem value="ja-JP">日本語</SelectItem>
                      <SelectItem value="ko-KR">한국어</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-yellow-800">
                      Cảnh báo quan trọng
                    </h3>
                    <p className="text-sm text-yellow-700 mt-1">
                      Các cài đặt nâng cao có thể ảnh hưởng đến độ thành công và
                      bảo mật của victim. Chỉ thay đổi khi bạn hiểu rõ tác động
                      của chúng.
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
            {editingVictim ? "Cập nhật" : "Tạo Victim"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VictimAdvancedModal;
