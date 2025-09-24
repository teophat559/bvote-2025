/**
 * System Status Widgets
 * Real-time system monitoring widgets preserving original UI design
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

const SystemStatusWidgets = ({
  systemStatus = {},
  onRefresh,
  className = ""
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update US time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Get US time zones
  const getUSTime = (timezone) => {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }).format(currentTime);
  };

  // Format uptime
  const formatUptime = (seconds) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  // Format memory usage
  const formatMemory = (bytes) => {
    return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
  };

  // Get status color
  const getStatusColor = (value, thresholds) => {
    if (value >= thresholds.danger) return 'bg-red-100 text-red-800';
    if (value >= thresholds.warning) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {/* US Clock Widget */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            🕐 Giờ Hoa Kỳ
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-center">
            <div className="text-xs text-gray-500">New York (EST)</div>
            <div className="text-lg font-mono font-bold">
              {getUSTime('America/New_York')}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500">Los Angeles (PST)</div>
            <div className="text-sm font-mono">
              {getUSTime('America/Los_Angeles')}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Health Widget */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            ⚙️ Hệ Thống
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-600">Uptime</span>
            <span className="text-sm font-medium">
              {formatUptime(systemStatus.server?.uptime || 0)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-600">Memory</span>
            <Badge className={getStatusColor(
              (systemStatus.server?.memory?.heapUsed || 0) / 1024 / 1024,
              { warning: 500, danger: 1000 }
            )}>
              {formatMemory(systemStatus.server?.memory?.heapUsed || 0)}
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-600">Status</span>
            <Badge className="bg-green-100 text-green-800">
              Healthy
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Connections Widget */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            🔗 Kết Nối
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-600">Admin</span>
            <Badge className="bg-blue-100 text-blue-800">
              {systemStatus.connections?.adminClients || 0}
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-600">Users</span>
            <Badge className="bg-green-100 text-green-800">
              {systemStatus.connections?.userClients || 0}
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-600">Total</span>
            <Badge className="bg-gray-100 text-gray-800">
              {systemStatus.connections?.totalClients || 0}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Services Widget */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            🚀 Dịch Vụ
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-600">Event Bus</span>
            <Badge className="bg-green-100 text-green-800">
              {systemStatus.services?.eventBus?.eventsCount || 0}
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-600">Chrome</span>
            <Badge className="bg-purple-100 text-purple-800">
              {systemStatus.services?.chromeAutomation?.activeProfiles || 0}
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-600">Bot</span>
            <div className="flex items-center gap-1">
              <Badge className={
                systemStatus.services?.botSystem?.isActive
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-800"
              }>
                {systemStatus.services?.botSystem?.isActive ? 'Active' : 'Inactive'}
              </Badge>
              {systemStatus.connections?.botClients > 0 && (
                <div className="h-1 w-1 rounded-full bg-green-400 animate-pulse" title="Bot connected via socket"></div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications Widget */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            🔔 Thông Báo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {systemStatus.notifications?.unread || 0}
            </div>
            <div className="text-xs text-gray-500">Chưa đọc</div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="w-full text-xs"
            onClick={() => onRefresh?.('notifications')}
          >
            Xem tất cả
          </Button>
        </CardContent>
      </Card>

      {/* Activity Stats Widget */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            📊 Hoạt Động
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-600">Logins</span>
            <span className="text-sm font-medium">
              {systemStatus.stats?.todayLogins || 0}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-600">Votes</span>
            <span className="text-sm font-medium">
              {systemStatus.stats?.todayVotes || 0}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-600">Auto Logins</span>
            <span className="text-sm font-medium">
              {systemStatus.stats?.todayAutoLogins || 0}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Chrome Profiles Widget */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            🌐 Chrome Profiles
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-600">Total</span>
            <Badge className="bg-blue-100 text-blue-800">
              {systemStatus.services?.chromeAutomation?.totalProfiles || 0}
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-600">Active</span>
            <Badge className="bg-green-100 text-green-800">
              {systemStatus.services?.chromeAutomation?.activeProfiles || 0}
            </Badge>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="w-full text-xs"
            onClick={() => onRefresh?.('chrome')}
          >
            Quản lý
          </Button>
        </CardContent>
      </Card>

      {/* Bot Stats Widget */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            🤖 Bot System
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-600">Actions</span>
            <span className="text-sm font-medium">
              {systemStatus.services?.botSystem?.stats?.actionsPerformed || 0}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-600">Alerts</span>
            <span className="text-sm font-medium">
              {systemStatus.services?.botSystem?.stats?.alertsSent || 0}
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="w-full text-xs"
            onClick={() => onRefresh?.('bot')}
          >
            Cấu hình
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemStatusWidgets;
