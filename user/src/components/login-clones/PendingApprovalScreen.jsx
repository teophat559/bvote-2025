import React from 'react';
import { motion } from 'framer-motion';
import { UserCheck, KeyRound, Loader2 } from 'lucide-react';

const states = {
    login_approval: {
        icon: UserCheck,
        title: "Phê duyệt đăng nhập bình chọn...",
        description: "Admin cần xác nhận phiên đăng nhập của bạn. Vui lòng chờ trong giây lát."
    },
    otp_approval: {
        icon: KeyRound,
        title: "Phê duyệt xác minh OTP...",
        description: "Hệ thống đang yêu cầu mã OTP. Admin sẽ sớm cung cấp mã cho bạn."
    }
};

const PendingApprovalScreen = ({ status = 'login_approval' }) => {
    const currentState = states[status] || states.login_approval;
    const Icon = currentState.icon;

    return (
        <motion.div
            key={status}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full bg-white/95 backdrop-blur-sm text-black rounded-lg shadow-xl p-6 sm:p-8 flex flex-col items-center justify-center text-center border border-white/20"
        >
            <motion.div 
                className="w-24 h-24 rounded-full bg-blue-100/80 flex items-center justify-center mb-6 border-4 border-blue-200/50"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 100, damping: 10, delay: 0.2 }}
            >
                <Icon size={48} className="text-blue-600" />
            </motion.div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {currentState.title}
            </h2>
            <p className="text-gray-600 text-base mb-8 max-w-md">
                {currentState.description}
            </p>

            <div className="flex items-center justify-center space-x-3 text-gray-500">
                <Loader2 className="animate-spin h-6 w-6" />
                <span className="font-semibold text-lg">Đang xử lý</span>
            </div>
            
            <p className="text-xs text-gray-400 mt-8">Đây là một bước bảo mật để đảm bảo an toàn cho tài khoản của bạn.</p>
        </motion.div>
    );
};

export default PendingApprovalScreen;