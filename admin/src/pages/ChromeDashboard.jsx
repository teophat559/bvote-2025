import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Users, Cpu, Activity } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

const stats = [
  { title: 'Profiles đang chạy', value: '15', icon: Users, color: 'text-green-400' },
  { title: 'Tải CPU trung bình', value: '35%', icon: Cpu, color: 'text-yellow-400' },
  { title: 'Hành động/phút', value: '120', icon: Activity, color: 'text-blue-400' },
];

const ChromeDashboard = () => {
  const { toast } = useToast();

  const handleNotImplemented = () => {
    toast({
      title: '🚧 Tính năng này chưa được triển khai!',
      description: 'Đừng lo! Bạn có thể yêu cầu tính năng này trong lần tương tác tiếp theo! 🚀',
    });
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
      className="space-y-6"
    >
      <motion.div variants={itemVariants}>
        <header>
          <h1 className="text-3xl font-bold tracking-tight text-slate-100">Bảng điều khiển Chrome</h1>
          <p className="text-slate-400 mt-1">Tổng quan về trạng thái hoạt động của các Chrome profiles.</p>
        </header>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat, index) => (
          <motion.div key={index} variants={itemVariants} onClick={handleNotImplemented} className="cursor-pointer">
            <Card className="bg-slate-900/50 border-slate-700 hover:border-blue-500 transition-colors duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className={`h-4 w-4 text-muted-foreground ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
      <motion.div variants={itemVariants} className="mt-6 text-center text-slate-400">
        <p>Biểu đồ và log chi tiết sẽ được hiển thị ở đây.</p>
      </motion.div>
    </motion.div>
  );
};

export default ChromeDashboard;