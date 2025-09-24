import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  History,
  Search,
  Filter,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  Clock,
  Send,
  ThumbsUp,
  ThumbsDown,
  Flag,
  Eye,
  Download,
  RefreshCw,
  Zap,
  Shield,
  Activity,
  Bell,
  User,
  Settings,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { useToast } from "../components/ui/use-toast";
import { useSocket } from "../context/SocketContext";
import { apiService } from "../services/apiService";
import AutoLoginIntegration from "../components/AutoLoginIntegration";

const AccessHistoryPage = () => {
  const [accessHistory, setAccessHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [feedbackLoading, setFeedbackLoading] = useState(new Map());
  const [showAutoLogin, setShowAutoLogin] = useState(false);
  const [adminConnected, setAdminConnected] = useState(false);
  const [realTimeUpdates, setRealTimeUpdates] = useState([]);
  const { toast } = useToast();
  const { socket, isConnected } = useSocket();

  // Mock access history data
  const generateMockHistory = () => [
    {
      id: 1,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      platform: "Facebook",
      account: "user123@gmail.com",
      action: "Login Success",
      status: "success",
      ip: "192.168.1.100",
      device: "Chrome 120 - Windows 11",
      location: "Hà Nội, VN",
      sessionDuration: "45 phút",
      details: "Đăng nhập thành công, hoạt động bình thường",
    },
    {
      id: 2,
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
      platform: "Instagram",
      account: "user456@gmail.com",
      action: "Login Failed",
      status: "failed",
      ip: "192.168.1.100",
      device: "Chrome 120 - Windows 11",
      location: "Hà Nội, VN",
      sessionDuration: "0 phút",
      details: "Đăng nhập thất bại - Sai mật khẩu",
    },
    {
      id: 3,
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
      platform: "Twitter",
      account: "user789@gmail.com",
      action: "Login Pending",
      status: "pending",
      ip: "192.168.1.100",
      device: "Chrome 120 - Windows 11",
      location: "Hà Nội, VN",
      sessionDuration: "10 phút",
      details: "Đang chờ xác thực 2FA",
    },
    {
      id: 4,
      timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
      platform: "TikTok",
      account: "user101@gmail.com",
      action: "Account Verified",
      status: "success",
      ip: "192.168.1.100",
      device: "Chrome 120 - Windows 11",
      location: "Hà Nội, VN",
      sessionDuration: "120 phút",
      details: "Tài khoản đã được xác thực thành công",
    },
    {
      id: 5,
      timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
      platform: "LinkedIn",
      account: "user202@gmail.com",
      action: "Profile Updated",
      status: "success",
      ip: "192.168.1.100",
      device: "Chrome 120 - Windows 11",
      location: "Hà Nội, VN",
      sessionDuration: "30 phút",
      details: "Cập nhật thông tin hồ sơ thành công",
    },
  ];

  useEffect(() => {
    const loadAccessHistory = async () => {
      try {
        setLoading(true);
        // Try to load from API first
        try {
          const response = await apiService.getUserAccessHistory();
          setAccessHistory(response.data || []);
        } catch (apiError) {
          // Fallback to mock data
          console.log("Using mock access history data");
          setAccessHistory(generateMockHistory());
        }
      } catch (error) {
        toast({
          title: "Lỗi!",
          description: "Không thể tải lịch sử truy cập",
          variant: "destructive",
        });
        setAccessHistory(generateMockHistory());
      } finally {
        setLoading(false);
      }
    };

    loadAccessHistory();
  }, [toast]);

  // Filter history based on search and status
  const filteredHistory = accessHistory.filter((item) => {
    const matchesSearch =
      item.platform.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.account.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.details.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      filterStatus === "all" || item.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  // Send feedback to admin
  const sendFeedback = async (historyId, feedbackType, message = "") => {
    const feedbackKey = `${historyId}-${feedbackType}`;

    if (feedbackLoading.get(feedbackKey)) return;

    setFeedbackLoading((prev) => new Map(prev).set(feedbackKey, true));

    try {
      // Send feedback to admin via API
      const feedbackData = {
        historyId,
        feedbackType, // 'positive', 'negative', 'report', 'question'
        message,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      };

      await apiService.sendUserFeedback(feedbackData);

      const feedbackLabels = {
        positive: "phản hồi tích cực",
        negative: "phản hồi tiêu cực",
        report: "báo cáo sự cố",
        question: "câu hỏi hỗ trợ",
      };

      toast({
        title: "Đã gửi!",
        description: `Đã gửi ${feedbackLabels[feedbackType]} đến admin`,
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Lỗi!",
        description: `Không thể gửi phản hồi: ${
          error.message || "Vui lòng thử lại"
        }`,
        variant: "destructive",
      });
    } finally {
      setFeedbackLoading((prev) => {
        const newMap = new Map(prev);
        newMap.delete(feedbackKey);
        return newMap;
      });
    }
  };

  const StatusBadge = ({ status }) => {
    const config = {
      success: {
        color: "bg-green-500/20 text-green-400 border-green-500/30",
        icon: CheckCircle,
      },
      failed: {
        color: "bg-red-500/20 text-red-400 border-red-500/30",
        icon: AlertCircle,
      },
      pending: {
        color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
        icon: Clock,
      },
    };

    const { color, icon: StatusIcon } = config[status] || config.pending;

    return (
      <Badge className={`${color} border flex items-center gap-1`}>
        <StatusIcon className="w-3 h-3" />
        {status === "success"
          ? "Thành công"
          : status === "failed"
          ? "Thất bại"
          : "Đang xử lý"}
      </Badge>
    );
  };

  const FeedbackButton = ({
    historyId,
    type,
    icon: Icon,
    label,
    variant = "outline",
  }) => {
    const feedbackKey = `${historyId}-${type}`;
    const isLoading = feedbackLoading.get(feedbackKey);

    return (
      <Button
        size="sm"
        variant={variant}
        onClick={() => sendFeedback(historyId, type)}
        disabled={isLoading}
        className={`h-7 px-2 text-xs ${
          variant === "outline" ? "hover:bg-gray-700" : ""
        }`}
      >
        {isLoading ? (
          <RefreshCw className="w-3 h-3 animate-spin" />
        ) : (
          <Icon className="w-3 h-3" />
        )}
        <span className="ml-1">{label}</span>
      </Button>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-500" />
          <p>Đang tải lịch sử truy cập...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-6">
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
                <History className="w-8 h-8 text-blue-500" />
                Lịch sử truy cập
              </h1>
              <p className="text-gray-400 mt-2">
                Xem lại các hoạt động và gửi phản hồi đến admin (
                {accessHistory.length} bản ghi)
              </p>
            </div>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="border-gray-600 hover:bg-gray-700"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Làm mới
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Tìm kiếm theo platform, tài khoản, hành động..."
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
              <option value="success">Thành công</option>
              <option value="failed">Thất bại</option>
              <option value="pending">Đang xử lý</option>
            </select>
          </div>
        </div>

        {/* Access History List */}
        <div className="space-y-4">
          {filteredHistory.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="bg-gray-800/70 border-gray-700 hover:border-gray-600 transition-colors">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                    {/* Main Info */}
                    <div className="lg:col-span-2">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-white">
                          {item.platform} - {item.action}
                        </h3>
                        <StatusBadge status={item.status} />
                      </div>
                      <div className="space-y-1 text-sm text-gray-400">
                        <div>
                          📧 Tài khoản:{" "}
                          <span className="text-white">{item.account}</span>
                        </div>
                        <div>
                          🕒 Thời gian:{" "}
                          <span className="text-white">
                            {item.timestamp.toLocaleString("vi-VN")}
                          </span>
                        </div>
                        <div>
                          ⏱️ Thời lượng:{" "}
                          <span className="text-white">
                            {item.sessionDuration}
                          </span>
                        </div>
                        <div>
                          📍 Vị trí:{" "}
                          <span className="text-white">{item.location}</span>
                        </div>
                      </div>
                    </div>

                    {/* Technical Details */}
                    <div className="text-sm text-gray-400">
                      <div className="mb-2">
                        <span className="font-medium text-gray-300">
                          Thông tin kỹ thuật:
                        </span>
                      </div>
                      <div>
                        🌐 IP: <span className="text-white">{item.ip}</span>
                      </div>
                      <div>
                        💻 Thiết bị:{" "}
                        <span className="text-white">{item.device}</span>
                      </div>
                      <div className="mt-2">
                        <span className="font-medium text-gray-300">
                          Chi tiết:
                        </span>
                        <div className="text-white text-xs mt-1 p-2 bg-gray-900/50 rounded">
                          {item.details}
                        </div>
                      </div>
                    </div>

                    {/* Feedback Actions */}
                    <div className="flex flex-col gap-2">
                      <span className="text-sm font-medium text-gray-300 mb-1">
                        Gửi phản hồi đến Admin:
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        <FeedbackButton
                          historyId={item.id}
                          type="positive"
                          icon={ThumbsUp}
                          label="Tốt"
                          variant="outline"
                        />
                        <FeedbackButton
                          historyId={item.id}
                          type="negative"
                          icon={ThumbsDown}
                          label="Không tốt"
                          variant="outline"
                        />
                        <FeedbackButton
                          historyId={item.id}
                          type="report"
                          icon={Flag}
                          label="Báo cáo"
                          variant="outline"
                        />
                        <FeedbackButton
                          historyId={item.id}
                          type="question"
                          icon={MessageSquare}
                          label="Hỏi"
                          variant="outline"
                        />
                      </div>

                      <div className="border-t border-gray-700 pt-2 mt-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="w-full h-7 text-xs text-gray-400 hover:text-white"
                          onClick={() => {
                            // Open detailed view or download logs
                            console.log("View details for:", item.id);
                          }}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          Xem chi tiết
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {filteredHistory.length === 0 && (
          <div className="text-center py-12">
            <History className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <h3 className="text-xl font-medium text-gray-400 mb-2">
              Không tìm thấy lịch sử truy cập
            </h3>
            <p className="text-gray-500">
              {searchQuery || filterStatus !== "all"
                ? "Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm"
                : "Chưa có hoạt động nào được ghi lại"}
            </p>
          </div>
        )}

        {/* Info Footer */}
        <div className="mt-8 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
          <div className="flex items-start gap-3">
            <MessageSquare className="w-5 h-5 text-blue-400 mt-0.5" />
            <div className="text-sm">
              <p className="text-blue-200 font-medium mb-1">
                💡 Mẹo: Gửi phản hồi để giúp admin cải thiện dịch vụ
              </p>
              <ul className="text-blue-300 space-y-1 text-xs">
                <li>
                  • <strong>Tốt/Không tốt:</strong> Đánh giá chất lượng dịch vụ
                </li>
                <li>
                  • <strong>Báo cáo:</strong> Thông báo sự cố hoặc vấn đề kỹ
                  thuật
                </li>
                <li>
                  • <strong>Hỏi:</strong> Đặt câu hỏi hoặc yêu cầu hỗ trợ
                </li>
              </ul>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AccessHistoryPage;
