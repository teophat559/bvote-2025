import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield, AlertTriangle, RefreshCw } from 'lucide-react';

const OtpScreen = ({ onBack, platform, account, onSubmit, loading }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [attempts, setAttempts] = useState(0);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]);

  const maxAttempts = 3;
  const otpLength = 6;

  useEffect(() => {
    // Countdown timer
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);

  const handleOtpChange = (index, value) => {
    // Only allow numbers
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < otpLength - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all fields are filled
    if (newOtp.every(digit => digit !== '') && newOtp.length === otpLength) {
      handleSubmit(newOtp.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = (otpCode = null) => {
    const code = otpCode || otp.join('');
    if (code.length === otpLength) {
      if (attempts >= maxAttempts) {
        alert('Đã vượt quá số lần nhập sai cho phép. Vui lòng liên hệ hỗ trợ.');
        return;
      }
      
      onSubmit('otp_verify', { 
        platform, 
        account, 
        otp: code,
        attempt: attempts + 1 
      });
      setAttempts(prev => prev + 1);
    }
  };

  const handleResendOtp = () => {
    setTimeLeft(300);
    setCanResend(false);
    setOtp(['', '', '', '', '', '']);
    setAttempts(0);
    // Call API to resend OTP
    onSubmit('otp_resend', { platform, account });
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      key="otpScreen"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-md mx-auto bg-white rounded-lg shadow-2xl overflow-hidden border border-gray-200"
    >
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 flex items-center">
        <button
          onClick={onBack}
          className="mr-3 p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h2 className="text-lg font-medium text-gray-800">Xác thực OTP</h2>
      </div>

      {/* Content */}
      <div className="px-8 py-8 text-center">
        {/* OTP Icon */}
        <motion.div
          className="w-20 h-20 mx-auto rounded-full bg-blue-50 border-2 border-blue-200 flex items-center justify-center mb-6"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <Shield className="w-10 h-10 text-blue-500" />
        </motion.div>

        {/* Title */}
        <h1 className="text-2xl font-semibold text-gray-800 mb-4">
          Nhập mã OTP
        </h1>

        {/* Description */}
        <p className="text-gray-600 mb-2 leading-relaxed">
          Admin đã yêu cầu xác thực OTP cho tài khoản <strong>{platform}</strong>
        </p>
        <p className="text-sm text-gray-500 mb-8">
          Mã OTP sẽ được cung cấp bởi admin trong giây lát
        </p>

        {/* Account Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="text-sm text-gray-700">
            <div className="font-medium">Nền tảng: {platform}</div>
            <div className="font-medium mt-1">Tài khoản: {account}</div>
          </div>
        </div>

        {/* OTP Input */}
        <div className="mb-6">
          <div className="flex justify-center space-x-3 mb-4">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={el => inputRefs.current[index] = el}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-12 text-center text-xl font-bold border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                autoComplete="off"
              />
            ))}
          </div>

          {/* Attempts Warning */}
          {attempts > 0 && attempts < maxAttempts && (
            <div className="flex items-center justify-center text-orange-600 text-sm mb-4">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Còn {maxAttempts - attempts} lần thử
            </div>
          )}

          {attempts >= maxAttempts && (
            <div className="flex items-center justify-center text-red-600 text-sm mb-4">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Đã vượt quá số lần cho phép. Vui lòng liên hệ hỗ trợ.
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          onClick={() => handleSubmit()}
          disabled={loading || otp.some(digit => digit === '') || attempts >= maxAttempts}
          className="w-full bg-blue-600 text-white py-3 rounded-md font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-4"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Đang xác thực...
            </div>
          ) : (
            'Xác thực OTP'
          )}
        </button>

        {/* Timer và Resend */}
        <div className="text-center">
          {!canResend ? (
            <p className="text-sm text-gray-500">
              Gửi lại mã sau: <span className="font-mono font-bold">{formatTime(timeLeft)}</span>
            </p>
          ) : (
            <button
              onClick={handleResendOtp}
              className="text-blue-600 text-sm font-medium hover:underline transition-colors flex items-center justify-center mx-auto"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Gửi lại mã OTP
            </button>
          )}
        </div>

        {/* Help Text */}
        <div className="mt-8 text-xs text-gray-500">
          <p>
            Không nhận được mã? Kiểm tra tin nhắn hoặc liên hệ admin.
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default OtpScreen;
