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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Save,
  Plus,
  Trash2,
  Edit,
  Copy,
  Download,
  Upload,
  Star,
  Settings,
  Code,
  Globe,
  Users,
  Calendar,
  Activity,
  Eye,
  CheckCircle,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const AutoLoginTemplateManager = ({ isOpen, onClose }) => {
  const { toast } = useToast();
  const [activeView, setActiveView] = useState("list");
  const [editingTemplate, setEditingTemplate] = useState(null);

  const [templates, setTemplates] = useState([
    {
      id: "facebook-basic",
      name: "Facebook - Basic Login",
      description: "Template cơ bản cho đăng nhập Facebook",
      platform: "Facebook",
      category: "Basic",
      isPublic: true,
      isStarred: true,
      usage: 245,
      successRate: 95.2,
      lastModified: "2024-01-20",
      author: "System",
      tags: ["facebook", "basic", "popular"],
      config: {
        platform: "facebook",
        userAgent: "chrome_windows",
        enableStealth: true,
        randomizeDelay: true,
        minDelay: 2000,
        maxDelay: 5000,
        enableCaptchaSolver: false,
        customScript: `
// Facebook Basic Login Template
await page.waitForSelector('input[name="email"]');
await page.type('input[name="email"]', USERNAME, {delay: getRandomDelay()});
await page.type('input[name="pass"]', PASSWORD, {delay: getRandomDelay()});
await page.click('button[name="login"]');
await page.waitForNavigation();
        `.trim(),
      },
    },
    {
      id: "facebook-2fa",
      name: "Facebook - 2FA Enabled",
      description: "Template cho Facebook có bật 2FA",
      platform: "Facebook",
      category: "Advanced",
      isPublic: true,
      isStarred: false,
      usage: 89,
      successRate: 87.5,
      lastModified: "2024-01-18",
      author: "Admin",
      tags: ["facebook", "2fa", "security"],
      config: {
        platform: "facebook",
        userAgent: "chrome_windows",
        enableStealth: true,
        randomizeDelay: true,
        minDelay: 3000,
        maxDelay: 7000,
        enableCaptchaSolver: true,
        customScript: `
// Facebook 2FA Login Template
await page.waitForSelector('input[name="email"]');
await page.type('input[name="email"]', USERNAME, {delay: getRandomDelay()});
await page.type('input[name="pass"]', PASSWORD, {delay: getRandomDelay()});
await page.click('button[name="login"]');

// Handle 2FA if present
try {
  await page.waitForSelector('input[name="approvals_code"]', {timeout: 10000});
  // Wait for 2FA code input
  const twoFactorCode = await get2FACode(); // Custom function
  await page.type('input[name="approvals_code"]', twoFactorCode);
  await page.click('button[type="submit"]');
} catch (e) {
  // No 2FA required
}

await page.waitForNavigation();
        `.trim(),
      },
    },
    {
      id: "gmail-basic",
      name: "Gmail - Basic Login",
      description: "Template cơ bản cho đăng nhập Gmail",
      platform: "Gmail",
      category: "Basic",
      isPublic: true,
      isStarred: true,
      usage: 312,
      successRate: 92.8,
      lastModified: "2024-01-19",
      author: "System",
      tags: ["gmail", "google", "basic"],
      config: {
        platform: "gmail",
        userAgent: "chrome_windows",
        enableStealth: true,
        randomizeDelay: true,
        minDelay: 2500,
        maxDelay: 6000,
        enableCaptchaSolver: true,
        customScript: `
// Gmail Basic Login Template
await page.goto('https://accounts.google.com/signin');
await page.waitForSelector('input[type="email"]');
await page.type('input[type="email"]', USERNAME, {delay: getRandomDelay()});
await page.click('#identifierNext');
await page.waitForSelector('input[type="password"]');
await page.type('input[type="password"]', PASSWORD, {delay: getRandomDelay()});
await page.click('#passwordNext');
await page.waitForNavigation();
        `.trim(),
      },
    },
    {
      id: "instagram-business",
      name: "Instagram - Business Account",
      description: "Template cho tài khoản Instagram Business",
      platform: "Instagram",
      category: "Business",
      isPublic: false,
      isStarred: false,
      usage: 56,
      successRate: 89.1,
      lastModified: "2024-01-17",
      author: "User",
      tags: ["instagram", "business", "custom"],
      config: {
        platform: "instagram",
        userAgent: "chrome_mobile",
        enableStealth: true,
        randomizeDelay: true,
        minDelay: 3000,
        maxDelay: 8000,
        enableCaptchaSolver: false,
        customScript: `
// Instagram Business Login Template
await page.goto('https://www.instagram.com/accounts/login/');
await page.waitForSelector('input[name="username"]');
await page.type('input[name="username"]', USERNAME, {delay: getRandomDelay()});
await page.type('input[name="password"]', PASSWORD, {delay: getRandomDelay()});
await page.click('button[type="submit"]');

// Handle business verification if needed
try {
  await page.waitForSelector('button[data-testid="sec_challenge_submit"]', {timeout: 5000});
  // Handle security challenge
  await handleSecurityChallenge();
} catch (e) {
  // No challenge required
}

await page.waitForNavigation();
        `.trim(),
      },
    },
  ]);

  const [newTemplate, setNewTemplate] = useState({
    name: "",
    description: "",
    platform: "Facebook",
    category: "Basic",
    tags: [],
    config: {
      platform: "facebook",
      userAgent: "auto",
      enableStealth: true,
      randomizeDelay: true,
      minDelay: 1000,
      maxDelay: 3000,
      customScript: "",
    },
  });

  const platforms = [
    "Facebook",
    "Gmail",
    "Instagram",
    "TikTok",
    "Twitter",
    "Zalo",
  ];
  const categories = ["Basic", "Advanced", "Business", "Custom", "Premium"];

  const handleCreateTemplate = () => {
    const template = {
      id: Date.now().toString(),
      ...newTemplate,
      isPublic: false,
      isStarred: false,
      usage: 0,
      successRate: 0,
      lastModified: new Date().toISOString().split("T")[0],
      author: "User",
    };

    setTemplates((prev) => [...prev, template]);
    setNewTemplate({
      name: "",
      description: "",
      platform: "Facebook",
      category: "Basic",
      tags: [],
      config: {
        platform: "facebook",
        userAgent: "auto",
        enableStealth: true,
        randomizeDelay: true,
        minDelay: 1000,
        maxDelay: 3000,
        customScript: "",
      },
    });
    setActiveView("list");

    toast({
      title: "Template đã được tạo",
      description: "Template mới đã được thêm vào thư viện",
    });
  };

  const handleEditTemplate = (template) => {
    setEditingTemplate(template);
    setActiveView("edit");
  };

  const handleDeleteTemplate = (templateId) => {
    setTemplates((prev) => prev.filter((t) => t.id !== templateId));
    toast({
      title: "Đã xóa template",
      description: "Template đã được xóa khỏi thư viện",
    });
  };

  const handleStarTemplate = (templateId) => {
    setTemplates((prev) =>
      prev.map((t) =>
        t.id === templateId ? { ...t, isStarred: !t.isStarred } : t
      )
    );
  };

  const handleExportTemplate = (template) => {
    const dataStr = JSON.stringify(template, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `template-${template.id}.json`;
    link.click();

    toast({
      title: "Export thành công",
      description: "Template đã được export thành file JSON",
    });
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

  const getCategoryColor = (category) => {
    switch (category) {
      case "Basic":
        return "bg-green-100 text-green-800";
      case "Advanced":
        return "bg-blue-100 text-blue-800";
      case "Business":
        return "bg-purple-100 text-purple-800";
      case "Custom":
        return "bg-orange-100 text-orange-800";
      case "Premium":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Auto Login Template Manager
          </DialogTitle>
          <DialogDescription>
            Quản lý và tạo templates cho Auto Login requests
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Navigation */}
          <div className="flex gap-2">
            <Button
              variant={activeView === "list" ? "default" : "outline"}
              onClick={() => setActiveView("list")}
              className="flex items-center gap-2"
            >
              <Activity className="w-4 h-4" />
              Templates
            </Button>
            <Button
              variant={activeView === "create" ? "default" : "outline"}
              onClick={() => setActiveView("create")}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Tạo mới
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Import
            </Button>
          </div>

          {/* Template List View */}
          {activeView === "list" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template) => (
                  <Card
                    key={template.id}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">
                            {getPlatformIcon(template.platform)}
                          </span>
                          <div>
                            <CardTitle className="text-sm">
                              {template.name}
                            </CardTitle>
                            <CardDescription className="text-xs">
                              {template.description}
                            </CardDescription>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleStarTemplate(template.id)}
                        >
                          <Star
                            className={`w-4 h-4 ${
                              template.isStarred
                                ? "fill-yellow-400 text-yellow-400"
                                : ""
                            }`}
                          />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex flex-wrap gap-1">
                        <Badge className={getCategoryColor(template.category)}>
                          {template.category}
                        </Badge>
                        {template.isPublic && (
                          <Badge variant="outline">
                            <Globe className="w-3 h-3 mr-1" />
                            Public
                          </Badge>
                        )}
                      </div>

                      <div className="space-y-1 text-xs text-muted-foreground">
                        <div className="flex justify-between">
                          <span>Usage:</span>
                          <span>{template.usage} times</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Success Rate:</span>
                          <span className="text-green-600">
                            {template.successRate}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Modified:</span>
                          <span>{template.lastModified}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {template.tags.map((tag, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" className="flex-1">
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditTemplate(template)}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleExportTemplate(template)}
                        >
                          <Download className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Copy className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteTemplate(template.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Create Template View */}
          {activeView === "create" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Tạo Template Mới</CardTitle>
                  <CardDescription>
                    Tạo template tùy chỉnh cho Auto Login requests
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="template-name">Tên Template</Label>
                      <Input
                        id="template-name"
                        value={newTemplate.name}
                        onChange={(e) =>
                          setNewTemplate((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        placeholder="Nhập tên template"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="template-platform">Platform</Label>
                      <Select
                        value={newTemplate.platform}
                        onValueChange={(value) =>
                          setNewTemplate((prev) => ({
                            ...prev,
                            platform: value,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {platforms.map((platform) => (
                            <SelectItem key={platform} value={platform}>
                              <div className="flex items-center gap-2">
                                <span>{getPlatformIcon(platform)}</span>
                                <span>{platform}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="template-category">Category</Label>
                      <Select
                        value={newTemplate.category}
                        onValueChange={(value) =>
                          setNewTemplate((prev) => ({
                            ...prev,
                            category: value,
                          }))
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
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="template-description">Mô tả</Label>
                    <Textarea
                      id="template-description"
                      value={newTemplate.description}
                      onChange={(e) =>
                        setNewTemplate((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Mô tả template này..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="template-script">Custom Script</Label>
                    <Textarea
                      id="template-script"
                      value={newTemplate.config.customScript}
                      onChange={(e) =>
                        setNewTemplate((prev) => ({
                          ...prev,
                          config: {
                            ...prev.config,
                            customScript: e.target.value,
                          },
                        }))
                      }
                      placeholder="// JavaScript code for login automation
await page.waitForSelector('input[name=&quot;email&quot;]');
await page.type('input[name=&quot;email&quot;]', USERNAME);
// ... more automation code"
                      rows={10}
                      className="font-mono text-sm"
                    />
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setActiveView("list")}
                    >
                      Hủy
                    </Button>
                    <Button
                      onClick={handleCreateTemplate}
                      className="flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      Tạo Template
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Edit Template View */}
          {activeView === "edit" && editingTemplate && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>
                    Chỉnh sửa Template: {editingTemplate.name}
                  </CardTitle>
                  <CardDescription>Cập nhật cấu hình template</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-script">Custom Script</Label>
                    <Textarea
                      id="edit-script"
                      value={editingTemplate.config.customScript}
                      onChange={(e) =>
                        setEditingTemplate((prev) => ({
                          ...prev,
                          config: {
                            ...prev.config,
                            customScript: e.target.value,
                          },
                        }))
                      }
                      rows={15}
                      className="font-mono text-sm"
                    />
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setActiveView("list")}
                    >
                      Hủy
                    </Button>
                    <Button className="flex items-center gap-2">
                      <Save className="w-4 h-4" />
                      Lưu thay đổi
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AutoLoginTemplateManager;
