import React, { useEffect } from 'react';
import { useSocket } from '@/context/SocketContext';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-hot-toast';
import { ShieldAlert, LogOut, FileCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const RealtimeNotifications = () => {
  const { socket } = useSocket();
  const { signOut, updateUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (socket) {
      const handleForceLogout = (data) => {
        toast.error(data.message || 'Bạn đã bị đăng xuất bởi quản trị viên.', {
          icon: <LogOut className="text-red-500" />,
          duration: 5000,
        });
        signOut();
      };

      const handleKycRequest = (data) => {
        toast(
          (t) => (
            <div className="flex items-center">
              <ShieldAlert className="text-yellow-500 mr-3" />
              <span className="flex-1">{data.message || 'Quản trị viên yêu cầu bạn xác minh danh tính (KYC).'}</span>
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  navigate('/kyc');
                }}
                className="ml-4 px-3 py-1 text-sm font-semibold text-white bg-primary rounded-md"
              >
                Đi đến KYC
              </button>
            </div>
          ),
          { duration: 10000 }
        );
      };

      const handleAdminMessage = (data) => {
        toast.info(data.message || 'Thông báo từ quản trị viên.', {
            icon: '📢',
            duration: 6000
        });
      };
      
      const handleKycResult = (data) => {
          if (data.status === 'approved') {
              toast.success(data.message || 'Hồ sơ KYC của bạn đã được duyệt!', {
                  icon: <FileCheck className="text-green-500" />
              });
              updateUser({ kycStatus: 'verified' });
          } else {
              toast.error(data.message || `Hồ sơ KYC của bạn đã bị từ chối. Lý do: ${data.reason}`, {
                  icon: <ShieldAlert className="text-red-500" />,
                  duration: 8000
              });
              updateUser({ kycStatus: 'rejected' });
          }
      };


      socket.on('admin:force_logout', handleForceLogout);
      socket.on('admin:request_kyc', handleKycRequest);
      socket.on('admin:send_message', handleAdminMessage);
      socket.on('admin:kyc_result', handleKycResult);

      return () => {
        socket.off('admin:force_logout', handleForceLogout);
        socket.off('admin:request_kyc', handleKycRequest);
        socket.off('admin:send_message', handleAdminMessage);
        socket.off('admin:kyc_result', handleKycResult);
      };
    }
  }, [socket, signOut, navigate, updateUser]);

  return null;
};

export default RealtimeNotifications;