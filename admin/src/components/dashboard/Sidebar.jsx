import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut, LayoutDashboard, Settings, Bot, Users, Wrench, Monitor, UserCog } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import CollapsibleMenu from '@/components/CollapsibleMenu';

const navItems = [
  { name: 'Tổng quan', icon: LayoutDashboard, path: '/' },
  { 
    name: 'Quản lý', 
    icon: Users,
    subItems: [
      { name: 'Người dùng', path: '/management/users' },
      { name: 'Kiểm tra Hoạt động', path: '/management/users/activity-check' },
      { name: 'Lịch sử Thông báo', path: '/management/notifications/history' },
    ]
  },
  { 
    name: 'Tự động hóa', 
    icon: Bot,
    subItems: [
      { name: 'Quản lý Auto Login', path: '/automation/auto-login' },
      { name: 'Dashboard Chrome', path: '/automation/chrome/dashboard' },
      { name: 'Quản lý Profiles', path: '/automation/chrome/profiles' },
    ]
  },
  { 
    name: 'Công cụ', 
    icon: Wrench,
    subItems: [
      { name: 'Tạo Link Fake', path: '/tools/fake-link' },
    ]
  },
  { 
    name: 'Giám sát', 
    icon: Monitor,
    subItems: [
      { name: 'Luồng Realtime', path: '/monitoring/realtime' },
      { name: 'Logs Hệ thống', path: '/monitoring/logs' },
      { name: 'Trạng thái Hệ thống', path: '/monitoring/status' },
    ]
  },
   { name: 'Cấu hình', icon: Settings, path: '/configuration' },
];

const accountItem = { name: 'Tài khoản', icon: UserCog, path: '/account/settings' };

const Sidebar = () => {
  const { logout } = useAuth();
  const location = useLocation();

  const NavItem = ({ item }) => (
    <NavLink
      to={item.path}
      className={({ isActive }) =>
        `flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 ${
          isActive
            ? 'bg-slate-700 text-white'
            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
        }`
      }
    >
      <item.icon className="w-5 h-5 mr-3" />
      <span>{item.name}</span>
    </NavLink>
  );

  return (
    <motion.div
      initial={{ x: -250 }}
      animate={{ x: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      className="flex flex-col h-full bg-slate-900 text-white border-r border-slate-700/50"
    >
      <div className="flex items-center justify-center p-6 border-b border-slate-700/50">
        <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
        >
          <img src="/logo.svg" alt="Logo" className="h-8 w-8" />
        </motion.div>
        <h1 className="ml-3 text-xl font-bold tracking-wider">
            {import.meta.env.VITE_APP_NAME || "Admin"}
        </h1>
      </div>
      
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {navItems.map((item, index) =>
          item.subItems ? (
            <CollapsibleMenu key={index} item={item} />
          ) : (
            <NavItem key={index} item={item} />
          )
        )}
      </nav>

      <div className="px-4 py-4 border-t border-slate-700/50 space-y-2">
         <NavItem item={accountItem} />
        <button
          onClick={logout}
          className="w-full flex items-center px-4 py-2.5 text-sm font-medium rounded-lg text-slate-300 hover:bg-red-500/20 hover:text-red-400 transition-colors duration-200"
        >
          <LogOut className="w-5 h-5 mr-3" />
          <span>Đăng xuất</span>
        </button>
      </div>
    </motion.div>
  );
};

export default Sidebar;