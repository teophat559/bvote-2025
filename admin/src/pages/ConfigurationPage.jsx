import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Settings, Palette, Shield, Server, Bell, Key, Vote } from 'lucide-react';

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

const settingsCards = [
  {
    title: "Cài đặt chung",
    description: "Cấu hình cơ bản cho toàn bộ hệ thống.",
    icon: <Settings className="w-8 h-8 text-blue-400" />,
    link: "/settings/general"
  },
  {
    title: "Giao diện Người dùng",
    description: "Tùy chỉnh trang đích cho người dùng.",
    icon: <Palette className="w-8 h-8 text-purple-400" />,
    link: "/settings/user-ui"
  },
  {
    title: "Giao diện Thí sinh",
    description: "Tùy chỉnh trang bình chọn cuộc thi.",
    icon: <Vote className="w-8 h-8 text-teal-400" />,
    link: "/settings/contest-ui"
  },
  {
    title: "Khóa truy cập Admin",
    description: "Quản lý khóa truy cập cho quản trị viên.",
    icon: <Key className="w-8 h-8 text-amber-400" />,
    link: "/settings/security/admin-keys"
  },
  {
    title: "IP Whitelist",
    description: "Giới hạn truy cập từ các địa chỉ IP được phép.",
    icon: <Shield className="w-8 h-8 text-red-400" />,
    link: "/settings/security/ip-whitelist"
  },
  {
    title: "Nền tảng & Dịch vụ",
    description: "Quản lý các nền tảng được tích hợp.",
    icon: <Server className="w-8 h-8 text-green-400" />,
    link: "/settings/automation/platforms"
  },
  {
    title: "Thông báo & Cảnh báo",
    description: "Cấu hình hệ thống thông báo và cảnh báo.",
    icon: <Bell className="w-8 h-8 text-yellow-400" />,
    link: "/settings/notifications/alerts"
  },
];

const ConfigurationPage = () => {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
      className="space-y-6"
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-bold tracking-tight text-slate-100">Cấu Hình Hệ Thống</h1>
        <p className="text-slate-400 mt-1">Truy cập và quản lý các cài đặt quan trọng của hệ thống.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {settingsCards.map((card, index) => (
          <motion.div key={index} variants={itemVariants}>
            <Card className="h-full flex flex-col bg-slate-900/50 border-slate-700 hover:border-blue-500 transition-colors duration-300">
              <CardHeader className="flex-grow">
                <div className="flex items-start gap-4">
                  {card.icon}
                  <div>
                    <CardTitle>{card.title}</CardTitle>
                    <CardDescription className="mt-1">{card.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link to={card.link}>Quản lý</Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default ConfigurationPage;