import React from 'react';
import { motion } from 'framer-motion';
import { Facebook, Instagram, Twitter, Youtube, Bot } from 'lucide-react';
import PlatformCard from '@/components/dashboard/PlatformCard';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

const platforms = [
  {
    name: 'Facebook',
    description: 'Tự động đăng nhập, tương tác và quản lý tài khoản Facebook.',
    icon: <Facebook className="h-8 w-8 text-blue-600" />,
    isEnabled: true,
  },
  {
    name: 'Google',
    description: 'Quản lý đăng nhập các dịch vụ của Google như Gmail, Youtube.',
    icon: <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" className="h-8 w-8" />,
    isEnabled: true,
  },
  {
    name: 'Instagram',
    description: 'Tự động hóa các tác vụ trên Instagram, từ đăng nhập đến tương tác.',
    icon: <Instagram className="h-8 w-8 text-pink-500" />,
    isEnabled: false,
  },
  {
    name: 'TikTok',
    description: 'Quản lý và tự động hóa các tài khoản TikTok.',
    icon: <Bot className="h-8 w-8 text-cyan-400" />, // Placeholder, will be updated
    isEnabled: false,
  },
  {
    name: 'Twitter (X)',
    description: 'Tự động hóa các hoạt động trên nền tảng X (Twitter).',
    icon: <Twitter className="h-8 w-8 text-sky-500" />,
    isEnabled: false,
  },
  {
    name: 'Youtube',
    description: 'Tự động hóa các hoạt động trên nền tảng Youtube.',
    icon: <Youtube className="h-8 w-8 text-red-500" />,
    isEnabled: false,
  },
];

const PlatformSettings = () => {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-6"
    >
      <motion.div variants={itemVariants}>
        <header>
          <h1 className="text-3xl font-bold tracking-tight text-slate-100">Cài đặt Nền tảng</h1>
          <p className="text-slate-400 mt-1">Quản lý và cấu hình các nền tảng được hỗ trợ cho Auto Login.</p>
        </header>
      </motion.div>

      <motion.div 
        variants={containerVariants}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {platforms.map((platform, index) => (
          <motion.div key={index} variants={itemVariants}>
            <PlatformCard
              name={platform.name}
              description={platform.description}
              icon={platform.icon}
              initialEnabled={platform.isEnabled}
            />
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
};

export default PlatformSettings;