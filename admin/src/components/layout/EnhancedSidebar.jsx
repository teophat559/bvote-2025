import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Home, 
  Database, 
  Activity, 
  Zap, 
  Settings,
  Users,
  FileText,
  BarChart3,
  Bot,
  Cog,
  ChevronRight,
  ChevronDown
} from 'lucide-react';

const sidebarItems = [
  {
    id: 'dashboard',
    title: 'Trang Chính',
    icon: Home,
    path: '/',
    gradient: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'data-management',
    title: 'Quản Lý Dữ Liệu',
    icon: Database,
    gradient: 'from-green-500 to-emerald-500',
    children: [
      { id: 'users', title: 'Tài Khoản', icon: Users, path: '/management/users' },
      { id: 'database', title: 'Database', icon: Database, path: '/management/database' },
      { id: 'logs', title: 'Nhật Ký', icon: FileText, path: '/management/logs' }
    ]
  },
  {
    id: 'monitoring',
    title: 'Giám Sát & Hoạt Động',
    icon: Activity,
    gradient: 'from-purple-500 to-pink-500',
    children: [
      { id: 'activity', title: 'Hoạt Động Login', icon: Activity, path: '/monitoring/activity' },
      { id: 'charts', title: 'Biểu Đồ', icon: BarChart3, path: '/monitoring/charts' },
      { id: 'realtime', title: 'Real-time Log', icon: Activity, path: '/monitoring/realtime' }
    ]
  },
  {
    id: 'automation',
    title: 'Tự Động Hóa',
    icon: Zap,
    gradient: 'from-yellow-500 to-orange-500',
    children: [
      { id: 'auto-login', title: 'Auto Login Flow', icon: Bot, path: '/automation/auto-login' },
      { id: 'rules', title: 'Cài Đặt Rule', icon: Settings, path: '/automation/rules' },
      { id: 'otp', title: 'Quản Lý OTP', icon: Zap, path: '/automation/otp' }
    ]
  },
  {
    id: 'settings',
    title: 'Cài Đặt & Công Cụ',
    icon: Settings,
    gradient: 'from-gray-500 to-slate-500',
    children: [
      { id: 'system', title: 'Cấu Hình Hệ Thống', icon: Cog, path: '/settings/system' },
      { id: 'integrations', title: 'Tích Hợp Tool', icon: Settings, path: '/settings/integrations' },
      { id: 'profiles', title: 'Chrome Profiles', icon: Settings, path: '/management/profiles' }
    ]
  }
];

const EnhancedSidebar = ({ currentPath = '/' }) => {
  const [expandedItems, setExpandedItems] = useState(['data-management', 'automation']);

  const toggleExpanded = (itemId) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const SidebarItem = ({ item, level = 0 }) => {
    const isExpanded = expandedItems.includes(item.id);
    const isActive = currentPath === item.path;
    const hasChildren = item.children && item.children.length > 0;
    const Icon = item.icon;

    return (
      <div className="mb-1">
        <motion.div
          whileHover={{ x: 4 }}
          className={`
            flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200
            ${level === 0 ? 'mx-2' : 'mx-4 ml-6'}
            ${isActive 
              ? 'bg-gradient-to-r ' + item.gradient + ' text-white shadow-lg' 
              : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
            }
          `}
          onClick={() => hasChildren ? toggleExpanded(item.id) : null}
        >
          <div className="flex items-center gap-3">
            <div className={`
              p-1.5 rounded-md transition-all duration-200
              ${isActive 
                ? 'bg-white/20' 
                : 'bg-slate-700/50 group-hover:bg-slate-600/50'
              }
            `}>
              <Icon className="w-4 h-4" />
            </div>
            <span className="font-medium text-sm">{item.title}</span>
          </div>
          
          {hasChildren && (
            <motion.div
              animate={{ rotate: isExpanded ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRight className="w-4 h-4" />
            </motion.div>
          )}
        </motion.div>

        {hasChildren && (
          <motion.div
            initial={false}
            animate={{ 
              height: isExpanded ? 'auto' : 0,
              opacity: isExpanded ? 1 : 0
            }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="mt-1 space-y-1">
              {item.children.map(child => (
                <SidebarItem key={child.id} item={child} level={level + 1} />
              ))}
            </div>
          </motion.div>
        )}
      </div>
    );
  };

  return (
    <div className="w-64 bg-slate-900/95 backdrop-blur-sm border-r border-slate-700/50 h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg">BVOTE Admin</h1>
            <p className="text-slate-400 text-xs">Enhanced Dashboard</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="p-2 space-y-2 overflow-y-auto h-full">
        {sidebarItems.map(item => (
          <SidebarItem key={item.id} item={item} />
        ))}
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700/50 bg-slate-900/95">
        <div className="flex items-center gap-2 text-slate-400 text-xs">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span>System Online</span>
        </div>
      </div>
    </div>
  );
};

export default EnhancedSidebar;
