import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Bell, 
  User, 
  Settings,
  LogOut,
  Filter,
  RefreshCw
} from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

const navigationTabs = [
  { id: 'dashboard', label: 'Bảng Điều Khiển', active: true },
  { id: 'history', label: 'Lịch Sử Truy Cập', active: false },
  { id: 'auto-management', label: 'Quản Lý Auto', active: false },
  { id: 'configuration', label: 'Cấu Hình', active: false }
];

const EnhancedTopbar = ({ onSearch, onTabChange, activeTab = 'dashboard' }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [notifications] = useState(12);

  const handleSearch = (value) => {
    setSearchTerm(value);
    onSearch?.(value);
  };

  const handleTabClick = (tabId) => {
    onTabChange?.(tabId);
  };

  return (
    <div className="bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50 px-6 py-4">
      {/* Top Row - Search and User Info */}
      <div className="flex items-center justify-between mb-4">
        {/* Search Section */}
        <div className="flex items-center gap-4 flex-1 max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Tìm kiếm lịch sử, tài khoản, IP..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 bg-slate-800/50 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500"
            />
          </div>
          <Button 
            variant="outline" 
            size="sm"
            className="bg-slate-800/50 border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <Filter className="w-4 h-4 mr-2" />
            Lọc
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="bg-slate-800/50 border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        {/* User Section */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <div className="relative">
            <Button 
              variant="ghost" 
              size="sm"
              className="text-slate-300 hover:text-white hover:bg-slate-800"
            >
              <Bell className="w-5 h-5" />
            </Button>
            {notifications > 0 && (
              <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full">
                {notifications}
              </Badge>
            )}
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-3 px-3 py-2 bg-slate-800/50 rounded-lg border border-slate-600">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="text-sm">
              <div className="text-white font-medium">admin@bvote.com</div>
              <div className="text-slate-400 text-xs">SuperAdmin</div>
            </div>
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1">
        {navigationTabs.map((tab) => (
          <motion.button
            key={tab.id}
            whileHover={{ y: -1 }}
            whileTap={{ y: 0 }}
            onClick={() => handleTabClick(tab.id)}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
              ${activeTab === tab.id
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }
            `}
          >
            {tab.label}
          </motion.button>
        ))}
      </div>

      {/* Quick Stats Bar */}
      <div className="flex items-center gap-6 mt-4 pt-4 border-t border-slate-700/30">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-slate-300">System Online</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
          <span className="text-slate-300">Auto Login Active</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
          <span className="text-slate-300">12 Pending</span>
        </div>
        <div className="flex items-center gap-2 text-sm ml-auto">
          <span className="text-slate-400">Last updated:</span>
          <span className="text-slate-300">{new Date().toLocaleTimeString('vi-VN')}</span>
        </div>
      </div>
    </div>
  );
};

export default EnhancedTopbar;
