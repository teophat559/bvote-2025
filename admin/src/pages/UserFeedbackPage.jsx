import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { motion } from "framer-motion";
import {
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Flag,
  HelpCircle,
  Search,
  Eye,
  CheckCircle,
  Clock,
  Trash2,
  RefreshCw,
  Calendar,
  Globe,
  Smartphone,
  User,
  Mail,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Card, CardContent } from "../components/ui/card";
import { restAdaptor } from "../adaptors";
import { useSocket } from "../hooks/useSocket";
import { useToast } from "../components/ui/use-toast";

const UserFeedbackPage = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [actionLoading, setActionLoading] = useState(new Map());
  const { socket, isConnected } = useSocket();
  const { toast } = useToast();

  // Load feedbacks
  useEffect(() => {
    const loadFeedbacks = async () => {
      try {
        setLoading(true);
        const response = await restAdaptor.get("/user/feedback");
        if (response.success) {
          setFeedbacks(response.data);
        }
      } catch (error) {
        toast({
          title: "Lỗi!",
          description: "Không thể tải danh sách feedback",
          variant: "destructive",
        });
        // Fallback to mock data
        setFeedbacks(generateMockFeedbacks());
      } finally {
        setLoading(false);
      }
    };

    loadFeedbacks();
  }, [toast]);

  // Generate mock feedback data
  const generateMockFeedbacks = () => [
    {
      id: "fb-001",
      historyId: "hist-123",
      victimId: "VICTIM_001", // Added victim connection
      userEmail: "user@example.com", // Added user email for tracking
      feedbackType: "positive",
      message: "Dịch vụ rất tốt, đăng nhập nhanh chóng!",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0",
      url: "http://localhost:3003/access-history",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      status: "new",
      adminNotes: "",
      resolvedAt: null,
      resolvedBy: null,
    },
    {
      id: "fb-002",
      historyId: "hist-456",
      victimId: "VICTIM_002", // Added victim connection
      userEmail: "testuser@gmail.com", // Added user email for tracking
      feedbackType: "report",
      message: "Có lỗi khi đăng nhập Facebook, trang bị treo",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0",
      url: "http://localhost:3003/access-history",
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      status: "read",
      adminNotes: "Đã kiểm tra, sẽ fix trong version tiếp theo",
      resolvedAt: null,
      resolvedBy: "admin",
    },
    {
      id: "fb-003",
      historyId: "hist-789",
      victimId: "VICTIM_003", // Added victim connection
      userEmail: "insta@example.com", // Added user email for tracking
      feedbackType: "question",
      message: "Làm sao để tăng tốc độ đăng nhập?",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0",
      url: "http://localhost:3003/access-history",
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      status: "resolved",
      adminNotes: "Đã hướng dẫn user qua email",
      resolvedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      resolvedBy: "admin",
    },
  ];

  // WebSocket realtime updates
  useEffect(() => {
    if (!socket) return;

    const handleNewFeedback = (feedback) => {
      setFeedbacks((prev) => [feedback, ...prev]);
      toast({
        title: "Feedback mới!",
        description: `${getFeedbackTypeLabel(feedback.feedbackType)} từ user`,
        variant: "default",
      });
    };

    const handleFeedbackUpdated = (feedback) => {
      setFeedbacks((prev) =>
        prev.map((f) => (f.id === feedback.id ? feedback : f))
      );
    };

    const handleFeedbackDeleted = ({ id }) => {
      setFeedbacks((prev) => prev.filter((f) => f.id !== id));
    };

    socket.on("user_feedback:new", handleNewFeedback);
    socket.on("user_feedback:updated", handleFeedbackUpdated);
    socket.on("user_feedback:deleted", handleFeedbackDeleted);

    return () => {
      socket.off("user_feedback:new", handleNewFeedback);
      socket.off("user_feedback:updated", handleFeedbackUpdated);
      socket.off("user_feedback:deleted", handleFeedbackDeleted);
    };
  }, [socket, toast]);

  // Filter feedbacks
  const filteredFeedbacks = feedbacks.filter((feedback) => {
    const matchesSearch =
      feedback.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feedback.historyId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feedback.adminNotes?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType =
      filterType === "all" || feedback.feedbackType === filterType;
    const matchesStatus =
      filterStatus === "all" || feedback.status === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  // Update feedback status
  const updateFeedbackStatus = async (feedbackId, status, adminNotes = "") => {
    const actionKey = `${feedbackId}-${status}`;

    if (actionLoading.get(actionKey)) return;

    setActionLoading((prev) => new Map(prev).set(actionKey, true));

    try {
      const response = await restAdaptor.put(
        `/user/feedback/${feedbackId}/status`,
        {
          status,
          adminNotes,
          resolvedBy: "admin",
        }
      );

      if (response.success) {
        setFeedbacks((prev) =>
          prev.map((f) => (f.id === feedbackId ? response.data : f))
        );

        toast({
          title: "Thành công!",
          description: `Đã cập nhật trạng thái feedback thành "${getStatusLabel(
            status
          )}"`,
          variant: "default",
        });
      }
    } catch (error) {
      toast({
        title: "Lỗi!",
        description: `Không thể cập nhật feedback: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setActionLoading((prev) => {
        const newMap = new Map(prev);
        newMap.delete(actionKey);
        return newMap;
      });
    }
  };

  // Delete feedback
  const deleteFeedback = async (feedbackId) => {
    const actionKey = `${feedbackId}-delete`;

    if (actionLoading.get(actionKey)) return;

    setActionLoading((prev) => new Map(prev).set(actionKey, true));

    try {
      const response = await restAdaptor.delete(`/user/feedback/${feedbackId}`);

      if (response.success) {
        setFeedbacks((prev) => prev.filter((f) => f.id !== feedbackId));

        toast({
          title: "Đã xóa!",
          description: "Feedback đã được xóa thành công",
          variant: "default",
        });
      }
    } catch (error) {
      toast({
        title: "Lỗi!",
        description: `Không thể xóa feedback: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setActionLoading((prev) => {
        const newMap = new Map(prev);
        newMap.delete(actionKey);
        return newMap;
      });
    }
  };

  // Helper functions
  const getFeedbackTypeLabel = (type) => {
    const labels = {
      positive: "Tích cực",
      negative: "Tiêu cực",
      report: "Báo cáo",
      question: "Câu hỏi",
    };
    return labels[type] || type;
  };

  const getStatusLabel = (status) => {
    const labels = {
      new: "Mới",
      read: "Đã đọc",
      resolved: "Đã giải quyết",
    };
    return labels[status] || status;
  };

  const getFeedbackTypeIcon = (type) => {
    const icons = {
      positive: ThumbsUp,
      negative: ThumbsDown,
      report: Flag,
      question: HelpCircle,
    };
    return icons[type] || MessageSquare;
  };

  const getStatusBadge = (status) => {
    const config = {
      new: {
        color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
        icon: Clock,
      },
      read: {
        color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
        icon: Eye,
      },
      resolved: {
        color: "bg-green-500/20 text-green-400 border-green-500/30",
        icon: CheckCircle,
      },
    };

    const { color, icon: StatusIcon } = config[status] || config.new;

    return (
      <Badge className={`${color} border flex items-center gap-1`}>
        <StatusIcon className="w-3 h-3" />
        {getStatusLabel(status)}
      </Badge>
    );
  };

  const ActionButton = ({
    feedbackId,
    action,
    icon: Icon,
    label,
    variant = "outline",
  }) => {
    const actionKey = `${feedbackId}-${action}`;
    const isLoading = actionLoading.get(actionKey);

    const getActionEmoji = (action) => {
      const emojis = {
        read: "👁️",
        resolved: "✅",
        delete: "🗑️",
        pending: "⏳",
      };
      return emojis[action] || "⚡";
    };

    return (
      <Button
        size="sm"
        variant={variant}
        onClick={() => {
          const emoji = getActionEmoji(action);
          toast({
            title: `${emoji} ${label}`,
            description: `Đang ${
              action === "delete" ? "xóa" : "cập nhật"
            } feedback #${feedbackId}`,
            duration: 2000,
          });

          if (action === "delete") {
            deleteFeedback(feedbackId);
          } else {
            updateFeedbackStatus(feedbackId, action);
          }
        }}
        disabled={isLoading}
        className={`h-7 px-2 text-xs transition-all duration-200 hover:scale-105 active:scale-95 ${
          action === "delete"
            ? "hover:shadow-red-500/25 hover:bg-red-600/10"
            : "hover:shadow-blue-500/25 hover:bg-blue-600/10"
        } ${isLoading ? "opacity-50 cursor-not-allowed hover:scale-100" : ""}`}
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

  // PropTypes for ActionButton
  ActionButton.propTypes = {
    feedbackId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
      .isRequired,
    action: PropTypes.string.isRequired,
    icon: PropTypes.elementType.isRequired,
    label: PropTypes.string.isRequired,
    variant: PropTypes.string,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-500" />
          <p>Đang tải feedback từ users...</p>
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
                <MessageSquare className="w-8 h-8 text-blue-500" />
                User Feedback
              </h1>
              <p className="text-gray-400 mt-2">
                Quản lý phản hồi từ users ({feedbacks.length} feedback)
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
                    title: "🔄 Refreshing Feedback",
                    description: "Đang tải lại dữ liệu phản hồi mới nhất",
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
                placeholder="Tìm kiếm feedback..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-800 border-gray-600 text-white"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-md text-white"
            >
              <option value="all">Tất cả loại</option>
              <option value="positive">Tích cực</option>
              <option value="negative">Tiêu cực</option>
              <option value="report">Báo cáo</option>
              <option value="question">Câu hỏi</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-md text-white"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="new">Mới</option>
              <option value="read">Đã đọc</option>
              <option value="resolved">Đã giải quyết</option>
            </select>
          </div>
        </div>

        {/* Feedback List */}
        <div className="space-y-4">
          {filteredFeedbacks.map((feedback) => {
            const TypeIcon = getFeedbackTypeIcon(feedback.feedbackType);
            return (
              <motion.div
                key={feedback.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.01 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="bg-gray-800/70 border-gray-700 hover:border-gray-600 transition-colors">
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                      {/* Main Content */}
                      <div className="lg:col-span-2">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <TypeIcon className="w-5 h-5 text-blue-400" />
                            <span className="font-medium text-blue-300">
                              {getFeedbackTypeLabel(feedback.feedbackType)}
                            </span>
                            <span className="text-gray-500">•</span>
                            <span className="text-gray-400 text-sm">
                              {feedback.historyId}
                            </span>
                          </div>
                          {getStatusBadge(feedback.status)}
                        </div>

                        <div className="bg-gray-900/50 p-3 rounded-lg mb-3">
                          <p className="text-white text-sm leading-relaxed">
                            {feedback.message || "Không có nội dung"}
                          </p>
                        </div>

                        {feedback.adminNotes && (
                          <div className="bg-blue-900/20 border border-blue-500/30 p-3 rounded-lg">
                            <p className="text-blue-200 text-sm">
                              <strong>Ghi chú admin:</strong>{" "}
                              {feedback.adminNotes}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Technical Info */}
                      <div className="text-sm text-gray-400">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {new Date(feedback.timestamp).toLocaleString(
                                "vi-VN"
                              )}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4" />
                            <span className="truncate">
                              {new URL(feedback.url).pathname}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Smartphone className="w-4 h-4" />
                            <span className="truncate">
                              {feedback.userAgent.includes("Chrome")
                                ? "Chrome"
                                : feedback.userAgent.includes("Firefox")
                                ? "Firefox"
                                : "Other"}
                            </span>
                          </div>
                          {feedback.victimId && (
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-purple-400" />
                              <div className="space-y-1">
                                <span className="text-purple-400 font-mono text-xs">
                                  {feedback.victimId}
                                </span>
                                <button
                                  onClick={() =>
                                    window.open(
                                      `/victims?search=${feedback.victimId}`,
                                      "_blank"
                                    )
                                  }
                                  className="text-xs text-purple-300 hover:text-purple-200 underline block"
                                >
                                  View Victim
                                </button>
                              </div>
                            </div>
                          )}
                          {feedback.userEmail && (
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-blue-400" />
                              <span className="text-blue-400 text-xs">
                                {feedback.userEmail}
                              </span>
                            </div>
                          )}
                          {feedback.resolvedAt && (
                            <div className="text-green-400 text-xs">
                              Giải quyết:{" "}
                              {new Date(feedback.resolvedAt).toLocaleString(
                                "vi-VN"
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2">
                        <span className="text-sm font-medium text-gray-300 mb-1">
                          Hành động:
                        </span>
                        <div className="grid grid-cols-2 gap-2">
                          {feedback.status === "new" && (
                            <ActionButton
                              feedbackId={feedback.id}
                              action="read"
                              icon={Eye}
                              label="Đánh dấu đã đọc"
                            />
                          )}
                          {feedback.status !== "resolved" && (
                            <ActionButton
                              feedbackId={feedback.id}
                              action="resolved"
                              icon={CheckCircle}
                              label="Giải quyết"
                            />
                          )}
                          <ActionButton
                            feedbackId={feedback.id}
                            action="delete"
                            icon={Trash2}
                            label="Xóa"
                            variant="outline"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {filteredFeedbacks.length === 0 && (
          <div className="text-center py-12">
            <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <h3 className="text-xl font-medium text-gray-400 mb-2">
              Không có feedback nào
            </h3>
            <p className="text-gray-500">
              {searchQuery || filterType !== "all" || filterStatus !== "all"
                ? "Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm"
                : "Chưa có feedback nào từ users"}
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default UserFeedbackPage;
