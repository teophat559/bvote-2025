/**
 * OTP Verification Modal Component
 * Handles OTP verification for auto-login requests
 */

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import autoLoginService from "@/services/autoLoginService";

const OTPVerificationModal = ({
  isOpen,
  onClose,
  requestId,
  platform,
  onSuccess,
}) => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [resendCooldown, setResendCooldown] = useState(0);

  const inputRefs = useRef([]);

  useEffect(() => {
    if (isOpen) {
      setOtp(["", "", "", "", "", ""]);
      setError("");
      setTimeLeft(300);
      setResendCooldown(0);

      // Focus first input
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Countdown timer
  useEffect(() => {
    if (!isOpen || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          toast.error("Mã OTP đã hết hạn");
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, timeLeft, onClose]);

  // Resend cooldown
  useEffect(() => {
    if (resendCooldown <= 0) return;

    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleInputChange = (index, value) => {
    // Only allow numbers
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError("");

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all filled
    if (newOtp.every((digit) => digit !== "") && newOtp.join("").length === 6) {
      handleSubmit(newOtp.join(""));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      // Focus previous input on backspace
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text");
    const digits = pastedData.replace(/\D/g, "").slice(0, 6);

    if (digits.length === 6) {
      const newOtp = digits.split("");
      setOtp(newOtp);
      setError("");
      handleSubmit(digits);
    }
  };

  const handleSubmit = async (otpCode = null) => {
    const otpToSubmit = otpCode || otp.join("");

    if (otpToSubmit.length !== 6) {
      setError("Vui lòng nhập đầy đủ 6 chữ số");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await autoLoginService.verifyOTP(requestId, otpToSubmit);

      if (result.success) {
        toast.success("Xác thực OTP thành công!");
        onSuccess?.(result);
        onClose();
      } else {
        setError(result.message || "Mã OTP không đúng");
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      console.error("OTP verification error:", error);
      setError("Lỗi xác thực OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;

    setLoading(true);
    try {
      const result = await autoLoginService.resendOTP(requestId);

      if (result.success) {
        toast.success("Đã gửi lại mã OTP");
        setTimeLeft(300); // Reset timer
        setResendCooldown(60); // 1 minute cooldown
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      } else {
        toast.error("Không thể gửi lại OTP");
      }
    } catch (error) {
      console.error("Resend OTP error:", error);
      toast.error("Lỗi gửi lại OTP");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl"
        >
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Xác thực OTP
            </h2>
            <p className="text-gray-600">
              Nhập mã OTP 6 chữ số được gửi để xác thực yêu cầu đăng nhập{" "}
              <strong>{platform}</strong>
            </p>
          </div>

          {/* OTP Input */}
          <div className="mb-6">
            <div className="flex justify-center gap-3 mb-4">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className={`
                    w-12 h-12 text-center text-xl font-bold border-2 rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                    ${error ? "border-red-300" : "border-gray-300"}
                    ${loading ? "opacity-50" : ""}
                  `}
                  disabled={loading}
                />
              ))}
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-600 text-sm text-center mb-2"
              >
                {error}
              </motion.div>
            )}

            {/* Timer */}
            <div className="text-center text-sm text-gray-500">
              Mã sẽ hết hạn sau:{" "}
              <span className="font-mono font-bold text-orange-600">
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={() => handleSubmit()}
              disabled={loading || otp.some((digit) => !digit)}
              className={`
                w-full py-3 px-4 rounded-lg font-medium transition-all
                ${
                  loading || otp.some((digit) => !digit)
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }
              `}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      className="opacity-25"
                    />
                    <path
                      fill="currentColor"
                      d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      className="opacity-75"
                    />
                  </svg>
                  Đang xác thực...
                </div>
              ) : (
                "Xác thực OTP"
              )}
            </button>

            <button
              onClick={handleResendOTP}
              disabled={loading || resendCooldown > 0}
              className="w-full py-2 px-4 text-blue-600 hover:text-blue-700 font-medium disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              {resendCooldown > 0
                ? `Gửi lại sau ${resendCooldown}s`
                : "Gửi lại mã OTP"}
            </button>

            <button
              onClick={onClose}
              disabled={loading}
              className="w-full py-2 px-4 text-gray-600 hover:text-gray-700 font-medium disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              Hủy
            </button>
          </div>

          {/* Info */}
          <div className="mt-6 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-start gap-2 text-sm text-blue-800">
              <svg
                className="w-4 h-4 mt-0.5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <strong>Lưu ý:</strong> Mã OTP được gửi qua SMS hoặc email đã
                đăng ký. Nếu không nhận được mã, vui lòng kiểm tra spam folder
                hoặc gửi lại.
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default OTPVerificationModal;
