/**
 * Enhanced Footer Status Bar Component
 * Footer với system info và real-time status indicators
 */

import React, { useState, useEffect } from "react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Activity,
  Wifi,
  Database,
  Server,
  Users,
  Shield,
  Clock,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Zap,
  HardDrive,
  Cpu,
  MemoryStick,
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

const EnhancedFooter = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [systemStats, setSystemStats] = useState({
    uptime: "2d 14h 32m",
    activeUsers: 127,
    totalSessions: 1543,
    successRate: 94.2,
    errorCount: 8,
    lastUpdate: new Date(),
    serverLoad: 23.5,
    memoryUsage: 67.8,
    diskUsage: 45.2,
    networkStatus: "online",
    databaseStatus: "healthy",
    securityStatus: "secure"
  });

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Mock real-time system stats updates
  useEffect(() => {
    const statsTimer = setInterval(() => {
      setSystemStats(prev => ({
        ...prev,
        activeUsers: prev.activeUsers + Math.floor(Math.random() * 10 - 5),
        serverLoad: Math.max(0, Math.min(100, prev.serverLoad + (Math.random() * 4 - 2))),
        memoryUsage: Math.max(0, Math.min(100, prev.memoryUsage + (Math.random() * 2 - 1))),
        lastUpdate: new Date()
      }));
    }, 5000);

    return () => clearInterval(statsTimer);
  }, []);

  const getStatusColor = (status, value) => {
    switch (status) {
      case "online":
      case "healthy":
      case "secure":
        return "bg-green-500/20 text-green-300";
      case "warning":
        return "bg-yellow-500/20 text-yellow-300";
      case "error":
      case "offline":
        return "bg-red-500/20 text-red-300";
      default:
        if (typeof value === 'number') {
          if (value < 50) return "bg-green-500/20 text-green-300";
          if (value < 80) return "bg-yellow-500/20 text-yellow-300";
          return "bg-red-500/20 text-red-300";
        }
        return "bg-slate-500/20 text-slate-300";
    }
  };

  const refreshStats = () => {
    setSystemStats(prev => ({
      ...prev,
      lastUpdate: new Date()
    }));
  };

  return (
    <footer className="bg-gradient-to-r from-slate-900/95 to-slate-800/95 border-t border-slate-700 px-6 py-3">
      <div className="flex items-center justify-between text-sm">
        {/* Left Section - System Status */}
        <div className="flex items-center gap-6">
          {/* Network Status */}
          <div className="flex items-center gap-2">
            <Wifi className="h-4 w-4 text-green-400" />
            <Badge className={getStatusColor(systemStats.networkStatus)}>
              <Activity className="h-3 w-3 mr-1" />
              {systemStats.networkStatus.toUpperCase()}
            </Badge>
          </div>

          {/* Database Status */}
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-blue-400" />
            <Badge className={getStatusColor(systemStats.databaseStatus)}>
              <CheckCircle className="h-3 w-3 mr-1" />
              DB: {systemStats.databaseStatus.toUpperCase()}
            </Badge>
          </div>

          {/* Security Status */}
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-purple-400" />
            <Badge className={getStatusColor(systemStats.securityStatus)}>
              <Shield className="h-3 w-3 mr-1" />
              {systemStats.securityStatus.toUpperCase()}
            </Badge>
          </div>

          {/* Active Users */}
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-cyan-400" />
            <span className="text-slate-300">
              <span className="font-mono font-bold text-cyan-300">
                {systemStats.activeUsers}
              </span> users online
            </span>
          </div>
        </div>

        {/* Center Section - System Performance */}
        <div className="flex items-center gap-6">
          {/* Server Load */}
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-orange-400" />
            <span className="text-slate-300">
              CPU: <span className={`font-mono font-bold ${
                systemStats.serverLoad < 50 ? 'text-green-300' :
                systemStats.serverLoad < 80 ? 'text-yellow-300' : 'text-red-300'
              }`}>
                {systemStats.serverLoad.toFixed(1)}%
              </span>
            </span>
          </div>

          {/* Memory Usage */}
          <div className="flex items-center gap-2">
            <MemoryStick className="h-4 w-4 text-pink-400" />
            <span className="text-slate-300">
              RAM: <span className={`font-mono font-bold ${
                systemStats.memoryUsage < 50 ? 'text-green-300' :
                systemStats.memoryUsage < 80 ? 'text-yellow-300' : 'text-red-300'
              }`}>
                {systemStats.memoryUsage.toFixed(1)}%
              </span>
            </span>
          </div>

          {/* Disk Usage */}
          <div className="flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-indigo-400" />
            <span className="text-slate-300">
              Disk: <span className="font-mono font-bold text-indigo-300">
                {systemStats.diskUsage.toFixed(1)}%
              </span>
            </span>
          </div>

          {/* Success Rate */}
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-yellow-400" />
            <span className="text-slate-300">
              Success: <span className="font-mono font-bold text-green-300">
                {systemStats.successRate}%
              </span>
            </span>
          </div>
        </div>

        {/* Right Section - Time & Controls */}
        <div className="flex items-center gap-4">
          {/* System Uptime */}
          <div className="flex items-center gap-2">
            <Server className="h-4 w-4 text-green-400" />
            <span className="text-slate-300">
              Uptime: <span className="font-mono font-bold text-green-300">
                {systemStats.uptime}
              </span>
            </span>
          </div>

          {/* Last Update */}
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-slate-400" />
            <span className="text-slate-400 text-xs">
              Updated: {format(systemStats.lastUpdate, "HH:mm:ss", { locale: vi })}
            </span>
          </div>

          {/* Current Time */}
          <div className="flex items-center gap-2">
            <div className="text-slate-300">
              <div className="font-mono font-bold text-white">
                {format(currentTime, "HH:mm:ss", { locale: vi })}
              </div>
              <div className="text-xs text-slate-400 text-center">
                {format(currentTime, "dd/MM/yyyy", { locale: vi })}
              </div>
            </div>
          </div>

          {/* Refresh Button */}
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
            onClick={refreshStats}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Bottom Status Bar */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-700/50">
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <span>Total Sessions: <span className="font-mono text-slate-300">{systemStats.totalSessions.toLocaleString()}</span></span>
          <span>Errors: <span className="font-mono text-red-300">{systemStats.errorCount}</span></span>
          <span>Version: <span className="font-mono text-slate-300">v2.1.4</span></span>
        </div>
        
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>BVOTE Admin Dashboard</span>
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span>Live</span>
        </div>
      </div>
    </footer>
  );
};

export default EnhancedFooter;
