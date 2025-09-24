/**
 * Component để nhận và hiển thị các yêu cầu đăng nhập từ User
 * Tích hợp với Admin system
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, CheckCircle, XCircle, Shield, User, Calendar, Globe, Smartphone } from 'lucide-react';

const AdminLoginRequestReceiver = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load mock requests from localStorage
    loadMockRequests();
    
    // Poll for new requests
    const interval = setInterval(loadMockRequests, 2000);
    
    return () => clearInterval(interval);
  }, []);

  const loadMockRequests = () => {
    try {
      const mockRequests = JSON.parse(localStorage.getItem('mockLoginRequests') || '{}');
      const requestsList = Object.values(mockRequests).sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      );
      setRequests(requestsList);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load requests:', error);
      setLoading(false);
    }
  };

  const handleApprove = (requestId) => {
    updateRequestStatus(requestId, 'approved');
  };

  const handleReject = (requestId) => {
    updateRequestStatus(requestId, 'rejected');
  };

  const handleRequireOtp = (requestId) => {
    updateRequestStatus(requestId, 'otp_required');
  };

  const updateRequestStatus = (requestId, newStatus) => {
    const mockRequests = JSON.parse(localStorage.getItem('mockLoginRequests') || '{}');
    if (mockRequests[requestId]) {
      mockRequests[requestId].status = newStatus;
      mockRequests[requestId].adminAction = new Date().toISOString();
      localStorage.setItem('mockLoginRequests', JSON.stringify(mockRequests));
      loadMockRequests();
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="w-5 h-5 text-orange-500" />;
      case 'approved': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'rejected': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'otp_required': return <Shield className="w-5 h-5 text-blue-500" />;
      default: return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'approved': return 'bg-green-50 text-green-700 border-green-200';
      case 'rejected': return 'bg-red-50 text-red-700 border-red-200';
      case 'otp_required': return 'bg-blue-50 text-blue-700 border-blue-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getPlatformIcon = (platform) => {
    const icons = {
      facebook: '📘',
      google: '🔍',
      instagram: '📷',
      zalo: '💬',
      yahoo: '📧',
      microsoft: '🪟'
    };
    return icons[platform.toLowerCase()] || '🌐';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải yêu cầu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center">
          <User className="w-6 h-6 mr-2" />
          Yêu cầu đăng nhập từ User ({requests.length})
        </h2>
        <p className="text-gray-600 mt-1">
          Xem xét và phê duyệt các yêu cầu đăng nhập tự động
        </p>
      </div>

      <div className="max-h-96 overflow-y-auto">
        <AnimatePresence>
          {requests.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Chưa có yêu cầu đăng nhập nào</p>
            </div>
          ) : (
            requests.map((request) => (
              <motion.div
                key={request.requestId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="p-6 border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Platform and Account */}
                    <div className="flex items-center mb-3">
                      <span className="text-2xl mr-3">
                        {getPlatformIcon(request.platform)}
                      </span>
                      <div>
                        <h3 className="font-medium text-gray-800">
                          {request.platform} - {request.account}
                        </h3>
                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs border ${getStatusColor(request.status)}`}>
                          {getStatusIcon(request.status)}
                          <span className="ml-1 capitalize">{request.status}</span>
                        </div>
                      </div>
                    </div>

                    {/* Request Details */}
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        {new Date(request.timestamp).toLocaleString('vi-VN')}
                      </div>
                      <div className="flex items-center">
                        <Globe className="w-4 h-4 mr-2" />
                        ID: {request.requestId?.slice(-8)}
                      </div>
                    </div>

                    {/* Admin Actions */}
                    {request.status === 'pending' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleApprove(request.requestId)}
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
                        >
                          ✅ Phê duyệt
                        </button>
                        <button
                          onClick={() => handleRequireOtp(request.requestId)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                          🔐 Yêu cầu OTP
                        </button>
                        <button
                          onClick={() => handleReject(request.requestId)}
                          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm font-medium"
                        >
                          ❌ Từ chối
                        </button>
                      </div>
                    )}

                    {request.status !== 'pending' && (
                      <div className="text-sm text-gray-500">
                        Đã xử lý lúc: {new Date(request.adminAction || request.timestamp).toLocaleString('vi-VN')}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AdminLoginRequestReceiver;
