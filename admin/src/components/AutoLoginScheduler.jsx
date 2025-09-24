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
  Calendar,
  Clock,
  Play,
  Pause,
  Square,
  Edit,
  Trash2,
  Plus,
  RefreshCw,
  Settings,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Activity,
  Timer,
  Repeat,
  Zap,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const AutoLoginScheduler = ({ isOpen, onClose }) => {
  const { toast } = useToast();
  const [activeView, setActiveView] = useState("list");
  const [selectedSchedule, setSelectedSchedule] = useState(null);

  const [schedules, setSchedules] = useState([
    {
      id: 1,
      name: "Daily Facebook Check",
      description: "Check Facebook accounts daily at 9 AM",
      cronExpression: "0 9 * * *",
      humanReadable: "Every day at 9:00 AM",
      platform: "Facebook",
      status: "active",
      nextRun: "2024-01-21 09:00:00",
      lastRun: "2024-01-20 09:00:00",
      lastStatus: "success",
      totalRuns: 45,
      successCount: 43,
      failureCount: 2,
      avgDuration: "2.3s",
      targets: ["account1@example.com", "account2@example.com"],
      created: "2024-01-01 10:00:00",
      isEnabled: true,
      timezone: "Asia/Ho_Chi_Minh",
      retryPolicy: {
        maxRetries: 3,
        backoffStrategy: "exponential",
        retryDelay: 300,
      },
      notifications: {
        onSuccess: false,
        onFailure: true,
        webhook: "https://hooks.slack.com/...",
      },
    },
    {
      id: 2,
      name: "Weekend Gmail Sync",
      description: "Sync Gmail accounts on weekends",
      cronExpression: "0 8 * * 6,0",
      humanReadable: "Every Saturday and Sunday at 8:00 AM",
      platform: "Gmail",
      status: "paused",
      nextRun: "2024-01-21 08:00:00",
      lastRun: "2024-01-14 08:00:00",
      lastStatus: "success",
      totalRuns: 12,
      successCount: 11,
      failureCount: 1,
      avgDuration: "4.1s",
      targets: ["user1@gmail.com", "user2@gmail.com", "user3@gmail.com"],
      created: "2024-01-05 15:30:00",
      isEnabled: false,
      timezone: "Asia/Ho_Chi_Minh",
      retryPolicy: {
        maxRetries: 2,
        backoffStrategy: "linear",
        retryDelay: 600,
      },
      notifications: {
        onSuccess: true,
        onFailure: true,
        webhook: "",
      },
    },
    {
      id: 3,
      name: "Hourly Instagram Stories",
      description: "Check Instagram stories every hour during work time",
      cronExpression: "0 9-17 * * 1-5",
      humanReadable: "Every hour from 9 AM to 5 PM, Monday to Friday",
      platform: "Instagram",
      status: "active",
      nextRun: "2024-01-20 15:00:00",
      lastRun: "2024-01-20 14:00:00",
      lastStatus: "failure",
      totalRuns: 234,
      successCount: 221,
      failureCount: 13,
      avgDuration: "1.8s",
      targets: ["instagram_account1", "instagram_account2"],
      created: "2023-12-15 11:20:00",
      isEnabled: true,
      timezone: "Asia/Ho_Chi_Minh",
      retryPolicy: {
        maxRetries: 1,
        backoffStrategy: "none",
        retryDelay: 0,
      },
      notifications: {
        onSuccess: false,
        onFailure: false,
        webhook: "",
      },
    },
  ]);

  const [newSchedule, setNewSchedule] = useState({
    name: "",
    description: "",
    cronExpression: "",
    platform: "Facebook",
    targets: [],
    timezone: "Asia/Ho_Chi_Minh",
    isEnabled: true,
    retryPolicy: {
      maxRetries: 3,
      backoffStrategy: "exponential",
      retryDelay: 300,
    },
    notifications: {
      onSuccess: false,
      onFailure: true,
      webhook: "",
    },
  });

  const timezones = [
    "Asia/Ho_Chi_Minh",
    "America/New_York",
    "Europe/London",
    "Asia/Tokyo",
    "Australia/Sydney",
  ];

  const cronPresets = [
    { label: "Every minute", value: "* * * * *" },
    { label: "Every 5 minutes", value: "*/5 * * * *" },
    { label: "Every hour", value: "0 * * * *" },
    { label: "Every day at 9 AM", value: "0 9 * * *" },
    { label: "Every weekday at 9 AM", value: "0 9 * * 1-5" },
    { label: "Every Monday at 9 AM", value: "0 9 * * 1" },
    { label: "Every month on 1st at 9 AM", value: "0 9 1 * *" },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "text-green-500";
      case "paused":
        return "text-yellow-500";
      case "failed":
        return "text-red-500";
      case "completed":
        return "text-blue-500";
      default:
        return "text-gray-500";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "active":
        return CheckCircle;
      case "paused":
        return Pause;
      case "failed":
        return XCircle;
      case "completed":
        return CheckCircle;
      default:
        return Activity;
    }
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

  const parseCronExpression = (cron) => {
    // Basic cron parser for display purposes
    const parts = cron.split(" ");
    if (parts.length !== 5) return "Invalid cron expression";

    const [minute, hour, day, month, dayOfWeek] = parts;

    if (
      minute === "0" &&
      hour === "9" &&
      day === "*" &&
      month === "*" &&
      dayOfWeek === "*"
    ) {
      return "Every day at 9:00 AM";
    }
    if (
      minute === "0" &&
      hour === "9" &&
      day === "*" &&
      month === "*" &&
      dayOfWeek === "1-5"
    ) {
      return "Every weekday at 9:00 AM";
    }
    if (minute === "0" && hour.includes("-")) {
      return `Every hour from ${hour.split("-")[0]}:00 to ${
        hour.split("-")[1]
      }:00`;
    }

    return `${cron} (Custom expression)`;
  };

  const handleToggleSchedule = (scheduleId) => {
    setSchedules((prev) =>
      prev.map((schedule) =>
        schedule.id === scheduleId
          ? {
              ...schedule,
              isEnabled: !schedule.isEnabled,
              status: !schedule.isEnabled ? "active" : "paused",
            }
          : schedule
      )
    );

    const schedule = schedules.find((s) => s.id === scheduleId);
    toast({
      title: schedule?.isEnabled ? "Schedule paused" : "Schedule activated",
      description: `${schedule?.name} has been ${
        schedule?.isEnabled ? "paused" : "activated"
      }`,
    });
  };

  const handleDeleteSchedule = (scheduleId) => {
    setSchedules((prev) =>
      prev.filter((schedule) => schedule.id !== scheduleId)
    );
    toast({
      title: "Schedule deleted",
      description: "The schedule has been removed",
    });
  };

  const handleRunNow = (scheduleId) => {
    const schedule = schedules.find((s) => s.id === scheduleId);
    toast({
      title: "Schedule triggered",
      description: `${schedule?.name} is running now`,
    });
  };

  const handleCreateSchedule = () => {
    if (!newSchedule.name || !newSchedule.cronExpression) {
      toast({
        title: "Validation Error",
        description: "Please fill in required fields",
        variant: "destructive",
      });
      return;
    }

    const schedule = {
      id: Date.now(),
      ...newSchedule,
      status: newSchedule.isEnabled ? "active" : "paused",
      nextRun: "2024-01-21 09:00:00", // Calculate based on cron
      lastRun: null,
      lastStatus: null,
      totalRuns: 0,
      successCount: 0,
      failureCount: 0,
      avgDuration: "0s",
      created: new Date().toISOString(),
      humanReadable: parseCronExpression(newSchedule.cronExpression),
    };

    setSchedules((prev) => [...prev, schedule]);
    setNewSchedule({
      name: "",
      description: "",
      cronExpression: "",
      platform: "Facebook",
      targets: [],
      timezone: "Asia/Ho_Chi_Minh",
      isEnabled: true,
      retryPolicy: {
        maxRetries: 3,
        backoffStrategy: "exponential",
        retryDelay: 300,
      },
      notifications: {
        onSuccess: false,
        onFailure: true,
        webhook: "",
      },
    });
    setActiveView("list");

    toast({
      title: "Schedule created",
      description: "New schedule has been added",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Auto Login Scheduler
          </DialogTitle>
          <DialogDescription>
            Quản lý và lập lịch cho Auto Login requests
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
              Schedules ({schedules.length})
            </Button>
            <Button
              variant={activeView === "create" ? "default" : "outline"}
              onClick={() => setActiveView("create")}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Schedule
            </Button>
          </div>

          {/* Schedule List View */}
          {activeView === "list" && (
            <div className="space-y-4">
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Total Schedules
                        </p>
                        <p className="text-2xl font-bold">{schedules.length}</p>
                      </div>
                      <Timer className="w-8 h-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Active</p>
                        <p className="text-2xl font-bold text-green-500">
                          {
                            schedules.filter((s) => s.status === "active")
                              .length
                          }
                        </p>
                      </div>
                      <Play className="w-8 h-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Success Rate
                        </p>
                        <p className="text-2xl font-bold text-blue-500">
                          {Math.round(
                            schedules.reduce(
                              (acc, s) =>
                                acc +
                                (s.successCount / (s.totalRuns || 1)) * 100,
                              0
                            ) / schedules.length
                          )}
                          %
                        </p>
                      </div>
                      <CheckCircle className="w-8 h-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Total Runs
                        </p>
                        <p className="text-2xl font-bold">
                          {schedules.reduce((acc, s) => acc + s.totalRuns, 0)}
                        </p>
                      </div>
                      <Repeat className="w-8 h-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Schedule Table */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Scheduled Tasks</CardTitle>
                    <Button size="sm" variant="outline">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {schedules.map((schedule) => {
                      const StatusIcon = getStatusIcon(schedule.status);
                      const successRate =
                        schedule.totalRuns > 0
                          ? Math.round(
                              (schedule.successCount / schedule.totalRuns) * 100
                            )
                          : 0;

                      return (
                        <div
                          key={schedule.id}
                          className="border rounded-lg p-4 hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="text-lg">
                                  {getPlatformIcon(schedule.platform)}
                                </span>
                                <div>
                                  <h3 className="font-medium">
                                    {schedule.name}
                                  </h3>
                                  <p className="text-sm text-muted-foreground">
                                    {schedule.description}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <StatusIcon
                                    className={`w-4 h-4 ${getStatusColor(
                                      schedule.status
                                    )}`}
                                  />
                                  <Badge
                                    variant={
                                      schedule.isEnabled
                                        ? "default"
                                        : "secondary"
                                    }
                                  >
                                    {schedule.status}
                                  </Badge>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <p className="text-muted-foreground">
                                    Schedule
                                  </p>
                                  <p className="font-mono text-xs">
                                    {schedule.cronExpression}
                                  </p>
                                  <p className="text-xs">
                                    {schedule.humanReadable}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">
                                    Next Run
                                  </p>
                                  <p>{schedule.nextRun}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">
                                    Success Rate
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={
                                        successRate >= 90
                                          ? "text-green-500"
                                          : successRate >= 70
                                          ? "text-yellow-500"
                                          : "text-red-500"
                                      }
                                    >
                                      {successRate}%
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      ({schedule.successCount}/
                                      {schedule.totalRuns})
                                    </span>
                                  </div>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">
                                    Targets
                                  </p>
                                  <p>{schedule.targets.length} accounts</p>
                                </div>
                              </div>

                              <div className="flex gap-2 mt-3">
                                {schedule.targets
                                  .slice(0, 3)
                                  .map((target, index) => (
                                    <Badge
                                      key={index}
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {target.length > 15
                                        ? `${target.substring(0, 15)}...`
                                        : target}
                                    </Badge>
                                  ))}
                                {schedule.targets.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{schedule.targets.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            </div>

                            <div className="flex gap-1 ml-4">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleToggleSchedule(schedule.id)
                                }
                              >
                                {schedule.isEnabled ? (
                                  <Pause className="w-3 h-3" />
                                ) : (
                                  <Play className="w-3 h-3" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRunNow(schedule.id)}
                              >
                                <Zap className="w-3 h-3" />
                              </Button>
                              <Button size="sm" variant="outline">
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleDeleteSchedule(schedule.id)
                                }
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {schedules.length === 0 && (
                      <div className="text-center py-12">
                        <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-2 text-sm font-medium">
                          No schedules
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Create your first schedule to automate login tasks.
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Create Schedule View */}
          {activeView === "create" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Create New Schedule</CardTitle>
                  <CardDescription>
                    Set up automated login tasks with cron expressions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="schedule-name">Schedule Name *</Label>
                      <Input
                        id="schedule-name"
                        value={newSchedule.name}
                        onChange={(e) =>
                          setNewSchedule((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        placeholder="Enter schedule name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="schedule-platform">Platform</Label>
                      <Select
                        value={newSchedule.platform}
                        onValueChange={(value) =>
                          setNewSchedule((prev) => ({
                            ...prev,
                            platform: value,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Facebook">🔵 Facebook</SelectItem>
                          <SelectItem value="Gmail">📧 Gmail</SelectItem>
                          <SelectItem value="Instagram">
                            📷 Instagram
                          </SelectItem>
                          <SelectItem value="TikTok">🎵 TikTok</SelectItem>
                          <SelectItem value="Twitter">🐦 Twitter</SelectItem>
                          <SelectItem value="Zalo">🔴 Zalo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="schedule-description">Description</Label>
                    <Input
                      id="schedule-description"
                      value={newSchedule.description}
                      onChange={(e) =>
                        setNewSchedule((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Describe what this schedule does"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cron-preset">Cron Expression *</Label>
                    <Select
                      onValueChange={(value) =>
                        setNewSchedule((prev) => ({
                          ...prev,
                          cronExpression: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a preset or enter custom" />
                      </SelectTrigger>
                      <SelectContent>
                        {cronPresets.map((preset, index) => (
                          <SelectItem key={index} value={preset.value}>
                            {preset.label} ({preset.value})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="custom-cron">Custom Cron Expression</Label>
                    <Input
                      id="custom-cron"
                      value={newSchedule.cronExpression}
                      onChange={(e) =>
                        setNewSchedule((prev) => ({
                          ...prev,
                          cronExpression: e.target.value,
                        }))
                      }
                      placeholder="* * * * * (minute hour day month dayOfWeek)"
                      className="font-mono"
                    />
                    <p className="text-xs text-muted-foreground">
                      Format: minute(0-59) hour(0-23) day(1-31) month(1-12)
                      dayOfWeek(0-6)
                      <br />
                      Preview:{" "}
                      {newSchedule.cronExpression
                        ? parseCronExpression(newSchedule.cronExpression)
                        : "Enter expression above"}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="timezone">Timezone</Label>
                      <Select
                        value={newSchedule.timezone}
                        onValueChange={(value) =>
                          setNewSchedule((prev) => ({
                            ...prev,
                            timezone: value,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {timezones.map((tz) => (
                            <SelectItem key={tz} value={tz}>
                              {tz}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center space-x-2 pt-6">
                      <Switch
                        id="enabled"
                        checked={newSchedule.isEnabled}
                        onCheckedChange={(checked) =>
                          setNewSchedule((prev) => ({
                            ...prev,
                            isEnabled: checked,
                          }))
                        }
                      />
                      <Label htmlFor="enabled">Enable schedule</Label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setActiveView("list")}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleCreateSchedule}>
                      Create Schedule
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AutoLoginScheduler;
