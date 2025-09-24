import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Server, Wifi, Database, CheckCircle, AlertCircle, XCircle, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

const SystemPage = () => {
  const { toast } = useToast();
  const [services, setServices] = useState([
    { name: 'REST API', status: 'loading', icon: Wifi },
    { name: 'Socket.IO', status: 'loading', icon: Server },
    { name: 'Database', status: 'loading', icon: Database },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const checkStatus = () => {
    setIsLoading(true);
    setServices(services.map(s => ({ ...s, status: 'loading' })));
    
    toast({
      title: 'Đang kiểm tra...',
      description: 'Hệ thống đang kiểm tra trạng thái các dịch vụ.',
    });

    setTimeout(() => {
      setServices(services.map(s => {
        const rand = Math.random();
        let status = 'operational';
        if (rand > 0.9) status = 'degraded';
        if (rand > 0.95) status = 'outage';
        return { ...s, status };
      }));
      setIsLoading(false);
      toast({
        title: '🚧 Tính năng này chưa được triển khai!',
        description: 'Đừng lo! Bạn có thể yêu cầu tính năng này trong lần tương tác tiếp theo! 🚀',
      });
    }, 1500);
  };

  useEffect(() => {
    checkStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getStatusInfo = (status) => {
    switch (status) {
      case 'operational':
        return { text: 'Hoạt động', color: 'text-green-400', icon: <CheckCircle className="h-4 w-4" /> };
      case 'degraded':
        return { text: 'Suy giảm', color: 'text-yellow-400', icon: <AlertCircle className="h-4 w-4" /> };
      case 'outage':
        return { text: 'Mất kết nối', color: 'text-red-400', icon: <XCircle className="h-4 w-4" /> };
      default:
        return { text: 'Đang kiểm tra...', color: 'text-slate-400', icon: <RefreshCw className="h-4 w-4 animate-spin" /> };
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
      className="space-y-6"
    >
      <motion.div variants={itemVariants}>
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-100">Trạng thái hệ thống</h1>
            <p className="text-slate-400 mt-1">Giám sát trạng thái hoạt động của các dịch vụ cốt lõi.</p>
          </div>
          <Button onClick={checkStatus} className="bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Kiểm tra lại
          </Button>
        </header>
      </motion.div>
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-4">
        <motion.div variants={itemVariants}>
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle>Trạng thái dịch vụ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {services.map(service => {
                const statusInfo = getStatusInfo(service.status);
                return (
                  <div key={service.name} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <service.icon className="h-6 w-6 text-slate-300" />
                      <span className="font-semibold">{service.name}</span>
                    </div>
                    <div className={`flex items-center gap-2 font-semibold ${statusInfo.color}`}>
                      {statusInfo.icon}
                      <span>{statusInfo.text}</span>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={itemVariants}>
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle>Thông tin môi trường</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-3">
              <p><strong>Phiên bản Build:</strong> <Badge variant="secondary">{import.meta.env.VITE_BUILD_VERSION || 'N/A'}</Badge></p>
              <p><strong>Chế độ Mock:</strong> <Badge variant={import.meta.env.VITE_USE_MOCK === '1' ? 'destructive' : 'success'}>{import.meta.env.VITE_USE_MOCK === '1' ? 'Đang bật' : 'Đã tắt'}</Badge></p>
              <p><strong>API URL:</strong> <span className="font-mono text-cyan-400">{import.meta.env.VITE_API_URL}</span></p>
              <p><strong>Socket URL:</strong> <span className="font-mono text-cyan-400">{import.meta.env.VITE_SOCKET_URL}</span></p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default SystemPage;