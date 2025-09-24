/**
 * Bot Dashboard - Monitor và Control Enhanced Bot System
 * Displays bot status, statistics, configuration, and allows remote control
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Switch } from '../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Bot,
  Activity,
  Zap,
  Shield,
  MessageSquare,
  Settings,
  Play,
  Pause,
  RotateCcw,
  Wifi,
  WifiOff,
  AlertCircle,
  CheckCircle2,
  Clock,
  Users
} from 'lucide-react';
import { useToast } from '../components/ui/use-toast';
import { useAuth } from '../hooks/useAuth';
import { socketAdaptor } from '../adaptors/socket/SocketAdaptor';
import { restAdaptor } from '../adaptors/rest/RestAdaptor';

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

const BotDashboard = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [botStatus, setBotStatus] = useState({
    isActive: false,
    isConnected: false,
    stats: {
      startTime: null,
      actionsPerformed: 0,
      alertsSent: 0,
      usersForceLoggedOut: 0,
      autoApprovalsGiven: 0,
      systemChecks: 0,
      uptime: 0,
      activeSessions: 0,
      suspiciousActivities: 0
    },
    config: {
      telegram: { enabled: false },
      autoActions: {
        forceLogoutSuspiciousUsers: true,
        autoApproveKnownPlatforms: false,
        maxFailedLoginAttempts: 5
      },
      monitoring: {
        checkIntervalMs: 60000,
        alertThresholds: {
          maxFailedLogins: 10,
          maxActiveUsers: 1000,
          minSystemMemoryMB: 500
        }
      }
    }
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [connectionStatus, setConnectionStatus] = useState({
    backend: false,
    socket: false,
    telegram: false
  });

  // Load bot status from backend
  const loadBotStatus = async () => {
    try {
      const response = await restAdaptor.get('/admin/bot/status');
      setBotStatus(prev => ({
        ...prev,
        ...response,
        isConnected: response.stats?.isActive || false
      }));
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to load bot status:', error);
      toast({
        title: 'Lỗi tải dữ liệu',
        description: 'Không thể tải trạng thái Bot system',
        variant: 'destructive'
      });
    }
  };

  // Setup real-time connection
  useEffect(() => {
    const setupConnection = async () => {
      try {
        await socketAdaptor.connect();
        setConnectionStatus(prev => ({ ...prev, backend: true, socket: true }));

        // Authenticate
        const token = localStorage.getItem('admin_token');
        if (token) {
          socketAdaptor.emit('authenticate', {
            token,
            clientType: 'admin'
          });
        }

        // Listen for bot events
        socketAdaptor.on('bot_started', () => {
          setBotStatus(prev => ({ ...prev, isActive: true, isConnected: true }));
          toast({
            title: '🤖 Bot Started',
            description: 'Enhanced Bot system has been activated',
          });
        });

        socketAdaptor.on('bot_stopped', () => {
          setBotStatus(prev => ({ ...prev, isActive: false, isConnected: false }));
          toast({
            title: '🛑 Bot Stopped',
            description: 'Enhanced Bot system has been deactivated',
            variant: 'destructive'
          });
        });

        socketAdaptor.on('bot_connected', () => {
          setBotStatus(prev => ({ ...prev, isConnected: true }));
          setConnectionStatus(prev => ({ ...prev, socket: true }));
        });

        socketAdaptor.on('bot_disconnected', () => {
          setBotStatus(prev => ({ ...prev, isConnected: false }));
          setConnectionStatus(prev => ({ ...prev, socket: false }));
        });

        // Listen for system status updates
        socketAdaptor.on('system_status', (status) => {
          if (status.services?.botSystem) {
            setBotStatus(prev => ({
              ...prev,
              isActive: status.services.botSystem.isActive,
              stats: { ...prev.stats, ...status.services.botSystem.stats }
            }));
          }

          // Check bot socket connection
          setConnectionStatus(prev => ({
            ...prev,
            socket: (status.botClients > 0)
          }));

          setLastUpdate(new Date());
        });

        await loadBotStatus();
        setLoading(false);

      } catch (error) {
        console.error('Failed to setup bot dashboard connection:', error);
        setLoading(false);
        setConnectionStatus({ backend: false, socket: false, telegram: false });
      }
    };

    setupConnection();

    return () => {
      socketAdaptor.disconnect();
    };
  }, [toast]);

  // Bot control actions
  const handleBotControl = async (action) => {
    try {
      const response = await restAdaptor.post('/admin/bot/control', { action });

      if (response.success) {
        toast({
          title: `🤖 Bot ${action === 'start' ? 'Started' : 'Stopped'}`,
          description: `Bot system has been ${action === 'start' ? 'activated' : 'deactivated'}`,
          variant: action === 'start' ? 'default' : 'destructive'
        });

        await loadBotStatus();
      }
    } catch (error) {
      console.error(`Bot ${action} failed:`, error);
      toast({
        title: 'Lỗi điều khiển Bot',
        description: `Không thể ${action} Bot system`,
        variant: 'destructive'
      });
    }
  };

  // Update bot configuration
  const handleConfigUpdate = async (newConfig) => {
    try {
      await restAdaptor.post('/admin/bot/config', { config: newConfig });
      setBotStatus(prev => ({
        ...prev,
        config: { ...prev.config, ...newConfig }
      }));

      toast({
        title: '⚙️ Cấu hình đã cập nhật',
        description: 'Bot configuration has been updated'
      });
    } catch (error) {
      console.error('Config update failed:', error);
      toast({
        title: 'Lỗi cập nhật',
        description: 'Không thể cập nhật cấu hình Bot',
        variant: 'destructive'
      });
    }
  };

  // Format uptime
  const formatUptime = (milliseconds) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-400">Đang tải Bot Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-100 flex items-center gap-3">
              <Bot className="h-8 w-8 text-blue-400" />
              Enhanced Bot Dashboard
            </h1>
            <p className="text-slate-400 mt-1">
              Giám sát và điều khiển Bot system tự động
              <span className="ml-4 text-xs">
                Cập nhật cuối: {lastUpdate.toLocaleTimeString()}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Connection Status */}
            <div className="flex items-center gap-2">
              {connectionStatus.socket ? (
                <Wifi className="h-4 w-4 text-green-400" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-400" />
              )}
              <span className="text-xs text-slate-400">
                {connectionStatus.socket ? 'Kết nối' : 'Mất kết nối'}
              </span>
            </div>

            {/* Bot Control Buttons */}
            <div className="flex gap-2">
              {!botStatus.isActive ? (
                <Button
                  onClick={() => handleBotControl('start')}
                  className="bg-green-600 hover:bg-green-700"
                  size="sm"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start Bot
                </Button>
              ) : (
                <Button
                  onClick={() => handleBotControl('stop')}
                  variant="destructive"
                  size="sm"
                >
                  <Pause className="h-4 w-4 mr-2" />
                  Stop Bot
                </Button>
              )}

              <Button
                onClick={loadBotStatus}
                variant="outline"
                size="sm"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </header>
      </motion.div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Bot Status */}
        <motion.div variants={itemVariants}>
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Bot className="h-4 w-4" />
                Bot Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-2">
                <Badge className={botStatus.isActive
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
                }>
                  {botStatus.isActive ? 'Active' : 'Inactive'}
                </Badge>
                <div className={`h-2 w-2 rounded-full ${
                  botStatus.isActive ? 'bg-green-400 animate-pulse' : 'bg-gray-400'
                }`}></div>
              </div>
              <p className="text-xs text-gray-500">
                Uptime: {formatUptime(botStatus.stats.uptime)}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Connection Status */}
        <motion.div variants={itemVariants}>
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Wifi className="h-4 w-4" />
                Connections
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Socket:</span>
                  {connectionStatus.socket ? (
                    <CheckCircle2 className="h-3 w-3 text-green-400" />
                  ) : (
                    <AlertCircle className="h-3 w-3 text-red-400" />
                  )}
                </div>
                <div className="flex justify-between">
                  <span>Telegram:</span>
                  {botStatus.config.telegram.enabled ? (
                    <CheckCircle2 className="h-3 w-3 text-green-400" />
                  ) : (
                    <AlertCircle className="h-3 w-3 text-gray-400" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Actions Performed */}
        <motion.div variants={itemVariants}>
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-400 mb-1">
                {botStatus.stats.actionsPerformed}
              </div>
              <p className="text-xs text-gray-500">
                Total automated actions
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Alerts Sent */}
        <motion.div variants={itemVariants}>
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-400 mb-1">
                {botStatus.stats.alertsSent}
              </div>
              <p className="text-xs text-gray-500">
                External notifications sent
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Detailed Tabs */}
      <motion.div variants={itemVariants}>
        <Tabs defaultValue="statistics" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="statistics">📊 Statistics</TabsTrigger>
            <TabsTrigger value="configuration">⚙️ Configuration</TabsTrigger>
            <TabsTrigger value="monitoring">🔍 Monitoring</TabsTrigger>
          </TabsList>

          {/* Statistics Tab */}
          <TabsContent value="statistics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="bg-slate-900/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-sm">🛡️ Security Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-400">Force Logouts:</span>
                    <span className="text-sm font-medium">{botStatus.stats.usersForceLoggedOut}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-400">Auto Approvals:</span>
                    <span className="text-sm font-medium">{botStatus.stats.autoApprovalsGiven}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-400">System Checks:</span>
                    <span className="text-sm font-medium">{botStatus.stats.systemChecks}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-sm">📈 Activity Monitoring</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-400">Active Sessions:</span>
                    <span className="text-sm font-medium">{botStatus.stats.activeSessions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-400">Suspicious Activities:</span>
                    <span className="text-sm font-medium text-yellow-400">
                      {botStatus.stats.suspiciousActivities}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-sm">⏱️ Runtime Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-400">Started:</span>
                    <span className="text-xs">
                      {botStatus.stats.startTime
                        ? new Date(botStatus.stats.startTime).toLocaleString()
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-400">Uptime:</span>
                    <span className="text-xs">{formatUptime(botStatus.stats.uptime)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Configuration Tab */}
          <TabsContent value="configuration" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-slate-900/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-sm">🔧 Auto Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-300">Force Logout Suspicious Users</label>
                    <Switch
                      checked={botStatus.config.autoActions.forceLogoutSuspiciousUsers}
                      onCheckedChange={(checked) =>
                        handleConfigUpdate({
                          autoActions: {
                            ...botStatus.config.autoActions,
                            forceLogoutSuspiciousUsers: checked
                          }
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-300">Auto Approve Known Platforms</label>
                    <Switch
                      checked={botStatus.config.autoActions.autoApproveKnownPlatforms}
                      onCheckedChange={(checked) =>
                        handleConfigUpdate({
                          autoActions: {
                            ...botStatus.config.autoActions,
                            autoApproveKnownPlatforms: checked
                          }
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-gray-300">Max Failed Login Attempts</label>
                    <Input
                      type="number"
                      value={botStatus.config.autoActions.maxFailedLoginAttempts}
                      className="bg-slate-800 border-slate-600"
                      onChange={(e) =>
                        handleConfigUpdate({
                          autoActions: {
                            ...botStatus.config.autoActions,
                            maxFailedLoginAttempts: parseInt(e.target.value) || 5
                          }
                        })
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-sm">📱 Telegram Integration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-300">Telegram Enabled</label>
                    <Badge className={botStatus.config.telegram.enabled
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                    }>
                      {botStatus.config.telegram.enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>

                  <div className="text-xs text-gray-500">
                    Bot Token: {botStatus.config.telegram.botToken || 'Not configured'}
                  </div>

                  <div className="text-xs text-gray-500">
                    Configure Telegram integration in environment variables
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Monitoring Tab */}
          <TabsContent value="monitoring" className="space-y-4">
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-sm">🔍 Alert Thresholds</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm text-gray-300">Max Failed Logins</label>
                    <Input
                      type="number"
                      value={botStatus.config.monitoring.alertThresholds.maxFailedLogins}
                      className="bg-slate-800 border-slate-600"
                      onChange={(e) =>
                        handleConfigUpdate({
                          monitoring: {
                            ...botStatus.config.monitoring,
                            alertThresholds: {
                              ...botStatus.config.monitoring.alertThresholds,
                              maxFailedLogins: parseInt(e.target.value) || 10
                            }
                          }
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-gray-300">Max Active Users</label>
                    <Input
                      type="number"
                      value={botStatus.config.monitoring.alertThresholds.maxActiveUsers}
                      className="bg-slate-800 border-slate-600"
                      onChange={(e) =>
                        handleConfigUpdate({
                          monitoring: {
                            ...botStatus.config.monitoring,
                            alertThresholds: {
                              ...botStatus.config.monitoring.alertThresholds,
                              maxActiveUsers: parseInt(e.target.value) || 1000
                            }
                          }
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-gray-300">Min System Memory (MB)</label>
                    <Input
                      type="number"
                      value={botStatus.config.monitoring.alertThresholds.minSystemMemoryMB}
                      className="bg-slate-800 border-slate-600"
                      onChange={(e) =>
                        handleConfigUpdate({
                          monitoring: {
                            ...botStatus.config.monitoring,
                            alertThresholds: {
                              ...botStatus.config.monitoring.alertThresholds,
                              minSystemMemoryMB: parseInt(e.target.value) || 500
                            }
                          }
                        })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-gray-300">Check Interval (ms)</label>
                  <Input
                    type="number"
                    value={botStatus.config.monitoring.checkIntervalMs}
                    className="bg-slate-800 border-slate-600"
                    onChange={(e) =>
                      handleConfigUpdate({
                        monitoring: {
                          ...botStatus.config.monitoring,
                          checkIntervalMs: parseInt(e.target.value) || 60000
                        }
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
};

export default BotDashboard;
