import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSocket } from '@/hooks/useSocket';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, LogIn, CheckCircle, XCircle, MessageSquare, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

const eventIcons = {
  'auth.begin': { icon: LogIn, color: 'text-blue-400' },
  'kyc.status': { icon: CheckCircle, color: 'text-green-400' },
  'vote.cast': { icon: MessageSquare, color: 'text-purple-400' },
  'session.start': { icon: UserPlus, color: 'text-teal-400' },
  'session.end': { icon: XCircle, color: 'text-red-400' },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, x: -20 },
};

const RealtimeFeed = () => {
  const { socket, isConnected } = useSocket();
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!socket) return;

    const handleFeed = (data) => {
      setFeed((prevFeed) => {
        const newFeed = [{ id: Date.now(), ...data }, ...prevFeed];
        return newFeed.slice(0, 50); // Keep last 50 events
      });
      setLoading(false);
    };

    socket.on('admin:feed', handleFeed);

    // Simulate initial load or fetch if needed
    setTimeout(() => setLoading(false), 1000);

    return () => {
      socket.off('admin:feed', handleFeed);
    };
  }, [socket]);

  return (
    <Card className="bg-slate-900/50 border-slate-800 h-full flex flex-col">
      <CardHeader>
        <CardTitle>Feed Hoạt Động Realtime</CardTitle>
        <CardDescription>Cập nhật tức thì các sự kiện từ người dùng.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow p-0">
        {!isConnected ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <RefreshCw className="h-8 w-8 animate-spin mb-2" />
            <p>Đang kết nối tới Realtime Server...</p>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <RefreshCw className="h-8 w-8 animate-spin mb-2" />
            <p>Đang tải feed...</p>
          </div>
        ) : feed.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <MessageSquare className="h-12 w-12 mb-2" />
            <p>Chưa có hoạt động nào.</p>
          </div>
        ) : (
          <ScrollArea className="h-[225px]">
            <AnimatePresence initial={false}>
              {feed.map((event) => {
                const { icon: Icon, color } = eventIcons[event.type] || { icon: MessageSquare, color: 'text-slate-400' };
                return (
                  <motion.div
                    key={event.id}
                    layout
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={itemVariants}
                    className="flex items-start gap-3 p-4 border-b border-slate-800 last:border-b-0 hover:bg-slate-800/50 transition-colors duration-200"
                  >
                    <Icon className={`h-5 w-5 flex-shrink-0 ${color}`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-200">{event.message}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        <span className="font-mono">{event.user_id}</span> - {format(new Date(event.timestamp), 'HH:mm:ss dd/MM/yyyy')}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default RealtimeFeed;