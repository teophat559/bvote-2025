import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  Eye,
  EyeOff,
  Key,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
// Alert component will be replaced with inline div
import { apiService } from "@/services/apiService";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const AdminKeyLogin = ({ onClose }) => {
  const [adminKey, setAdminKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!adminKey.trim()) {
      setError("Vui lòng nhập mã key admin");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await apiService.adminLogin(adminKey.trim());

      // Sign in with admin user
      await signIn(response.user, response.token);

      toast.success("🎉 Đăng nhập admin thành công!");

      // Close modal and redirect to admin page
      if (onClose) onClose();
      navigate("/admin");
    } catch (err) {
      setError(err.message || "Mã key admin không hợp lệ");
      toast.error("❌ " + (err.message || "Mã key admin không hợp lệ"));
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 25 },
    },
  };

  const iconVariants = {
    hidden: { scale: 0, rotate: -180 },
    visible: {
      scale: 1,
      rotate: 0,
      transition: { delay: 0.2, type: "spring", stiffness: 300 },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full max-w-md mx-auto"
    >
      <Card className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 border border-purple-500/30 shadow-2xl shadow-purple-500/20">
        <CardHeader className="text-center space-y-4">
          <motion.div variants={iconVariants} className="flex justify-center">
            <div className="relative">
              <Shield className="w-16 h-16 text-purple-400" />
              <Key className="w-6 h-6 text-yellow-400 absolute -bottom-1 -right-1" />
            </div>
          </motion.div>

          <div>
            <CardTitle className="text-2xl font-bold text-white">
              🔐 Admin Access
            </CardTitle>
            <CardDescription className="text-purple-200">
              Nhập mã key để truy cập quyền quản trị
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-slate-300 font-medium">
                Mã Key Truy Cập
              </label>
              <div className="relative">
                <Input
                  type={showKey ? "text" : "password"}
                  placeholder="Nhập: ADMIN_BVOTE_2025_KEY"
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  className="w-full pr-12 bg-slate-800/50 border-purple-500/30 text-white placeholder-slate-500 focus:border-purple-400 focus:ring-purple-400/20 font-mono text-base tracking-wide pl-4"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded text-slate-400 hover:text-purple-400 hover:bg-slate-700/50 transition-all"
                  disabled={loading}
                  title={showKey ? "Ẩn mã key" : "Hiển thị mã key"}
                >
                  {showKey ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">
                  {adminKey.length}/20 ký tự
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setAdminKey("ADMIN_BVOTE_2025_KEY");
                    toast.success("Đã điền sẵn mã key!");
                  }}
                  className="text-purple-400 hover:text-purple-300 underline"
                  disabled={loading}
                >
                  Điền sẵn mã key
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center space-x-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || !adminKey.trim()}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white font-semibold py-3 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang xác thực...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Truy cập Admin</span>
                </div>
              )}
            </Button>
          </form>

          <div className="text-center space-y-3">
            <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-600/50">
              <p className="text-xs text-slate-400 mb-2">Mã Key Admin:</p>
              <div className="flex items-center justify-between bg-slate-900/50 px-3 py-2 rounded border">
                <code className="text-yellow-400 text-sm font-mono">
                  ADMIN_BVOTE_2025_KEY
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText("ADMIN_BVOTE_2025_KEY");
                    toast.success("Đã copy mã key!");
                  }}
                  className="text-slate-400 hover:text-purple-400 transition-colors ml-2"
                  title="Copy mã key"
                >
                  📋
                </button>
              </div>
            </div>
            <p className="text-xs text-slate-400">
              Chỉ quản trị viên có mã key hợp lệ mới có thể truy cập
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AdminKeyLogin;
