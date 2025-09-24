import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ShieldAlert, RefreshCw } from 'lucide-react';

const LoginFailedScreen = ({ onTryAgain, error }) => {
    return (
        <motion.div
            key="loginFailed"
            className="w-full h-full bg-destructive/5 backdrop-blur-sm text-destructive-foreground rounded-lg shadow-xl p-6 sm:p-8 flex flex-col items-center justify-center text-center border border-destructive/20"
        >
            <motion.div
                animate={{
                    rotate: [-10, 10, -10, 10, 0],
                    transition: { duration: 0.5, type: 'spring', stiffness: 200, damping: 5 }
                }}
            >
                <ShieldAlert size={64} className="text-destructive mb-4" />
            </motion.div>
            <h2 className="text-2xl font-bold text-destructive mb-2">Đăng nhập thất bại</h2>
            <p className="text-destructive/80 text-base mb-6 max-w-sm">
                {error || 'Quá trình đăng nhập không thành công do hết thời gian chờ hoặc có lỗi xảy ra.'}
            </p>
            
            <Button
                onClick={onTryAgain}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold py-3 text-lg px-8"
            >
                <RefreshCw className="mr-2 h-5 w-5"/>
                Thử lại
            </Button>
        </motion.div>
    );
};

export default LoginFailedScreen;