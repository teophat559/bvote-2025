import React from 'react';
import { useSocket } from '@/context/SocketContext';
import { Wifi, WifiOff } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const ConnectionStatusBadge = () => {
  const { isConnected } = useSocket();

  const statusConfig = {
    connected: {
      text: 'Đã kết nối',
      icon: <Wifi className="w-4 h-4 mr-1.5" />,
      className: 'bg-green-500/20 text-green-400 border-green-500/30',
    },
    disconnected: {
      text: 'Mất kết nối',
      icon: <WifiOff className="w-4 h-4 mr-1.5" />,
      className: 'bg-red-500/20 text-red-400 border-red-500/30 animate-pulse',
    },
  };

  const currentStatus = isConnected ? 'connected' : 'disconnected';
  const { text, icon, className } = statusConfig[currentStatus];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.9 }}
        className={`flex items-center px-3 py-1.5 text-xs font-medium rounded-full border backdrop-blur-sm ${className}`}
      >
        {icon}
        <span>{text}</span>
      </motion.div>
    </AnimatePresence>
  );
};

export default ConnectionStatusBadge;