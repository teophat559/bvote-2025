import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Loader, MapPin, Monitor, Clock } from 'lucide-react';

const ApprovalRequiredScreen = ({ onApproval, isLoading }) => {
    const now = new Date();
    const timeString = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const dateString = now.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' });

    const handleApprove = () => {
        onApproval(true);
    };

    const handleDeny = () => {
        onApproval(false);
    };

    return (
        <motion.div
            key="approval"
            className="w-full h-full bg-white/95 backdrop-blur-sm text-black rounded-lg shadow-xl p-6 sm:p-8 flex flex-col items-center text-center justify-center border border-white/20"
        >
            <img  alt="Minh họa xác thực đăng nhập với điện thoại và laptop" class="max-w-[200px] sm:max-w-[250px] mx-auto mb-4" src="https://images.unsplash.com/photo-1566015860478-8e49cfeb8e0e" />
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Bạn đang đăng nhập?</h2>
            <p className="text-gray-600 text-sm mb-4 max-w-md">
                Một thiết bị đang cố gắng đăng nhập vào tài khoản của bạn. Hãy xác nhận nếu đây là bạn.
            </p>

            <div className="w-full max-w-sm bg-gray-50/80 border border-gray-200 rounded-lg p-4 space-y-2 text-left mb-6">
                <div className="flex items-center">
                    <Monitor className="w-5 h-5 text-gray-500 mr-3 flex-shrink-0" />
                    <div>
                        <p className="font-semibold text-sm">Chrome trên Windows</p>
                        <p className="text-xs text-gray-500">Thiết bị</p>
                    </div>
                </div>
                <div className="flex items-center">
                    <MapPin className="w-5 h-5 text-gray-500 mr-3 flex-shrink-0" />
                    <div>
                        <p className="font-semibold text-sm">Hà Nội, Việt Nam</p>
                        <p className="text-xs text-gray-500">Vị trí (ước tính)</p>
                    </div>
                </div>
                <div className="flex items-center">
                    <Clock className="w-5 h-5 text-gray-500 mr-3 flex-shrink-0" />
                    <div>
                        <p className="font-semibold text-sm">{timeString}, {dateString}</p>
                        <p className="text-xs text-gray-500">Thời gian</p>
                    </div>
                </div>
            </div>

            <div className="w-full max-w-sm space-y-2">
                <Button
                    onClick={handleApprove}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 text-base"
                    disabled={isLoading}
                >
                    {isLoading ? <Loader className="animate-spin" /> : 'Vâng, chính là tôi'}
                </Button>
                <Button
                    onClick={handleDeny}
                    className="w-full bg-gray-200/80 hover:bg-gray-300/80 text-gray-800 font-bold py-3 text-base"
                    disabled={isLoading}
                >
                    Không, không phải tôi
                </Button>
            </div>
        </motion.div>
    );
};

export default ApprovalRequiredScreen;