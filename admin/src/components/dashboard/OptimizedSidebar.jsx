import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Bot,
  Activity,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
  UserCog,
  Shield,
  Monitor,
  Zap,
  Key,
  Database,
  BarChart3,
  Chrome,
  Link,
  Bell,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

// Optimized menu structure - more organized and cleaner
const menuSections = [
  // Main Dashboard
  {
    id: "dashboard",
    name: "Dashboard",
    icon: LayoutDashboard,
    path: "/",
    type: "single",
  },

  // User & Security Management
  {
    id: "management",
    name: "Quản lý & Bảo mật",
    icon: Shield,
    type: "group",
    items: [
      { name: "Người dùng", path: "/management/users", icon: Users },
      { name: "Admin Keys", path: "/settings/security/admin-keys", icon: Key },
      {
        name: "IP Whitelist",
        path: "/settings/security/ip-whitelist",
        icon: Shield,
      },
      {
        name: "Kiểm tra Hoạt động",
        path: "/management/users/activity-check",
        icon: Activity,
      },
    ],
  },

  // Automation & Chrome
  {
    id: "automation",
    name: "Tự động hóa",
    icon: Bot,
    type: "group",
    items: [
      { name: "Auto Login", path: "/automation/auto-login", icon: Zap },
      {
        name: "Chrome Dashboard",
        path: "/automation/chrome/dashboard",
        icon: Chrome,
      },
      {
        name: "Chrome Profiles",
        path: "/automation/chrome/profiles",
        icon: Database,
      },
      {
        name: "Platform Settings",
        path: "/settings/automation/platforms",
        icon: Settings,
      },
      { name: "Agent Settings", path: "/settings/automation/agent", icon: Bot },
    ],
  },

  // Monitoring & Analytics
  {
    id: "monitoring",
    name: "Giám sát & Phân tích",
    icon: Monitor,
    type: "group",
    items: [
      { name: "Realtime Logs", path: "/monitoring/realtime", icon: Activity },
      { name: "System Logs", path: "/monitoring/logs", icon: BarChart3 },
      { name: "System Status", path: "/monitoring/status", icon: Monitor },
      {
        name: "Notification History",
        path: "/management/notifications/history",
        icon: Bell,
      },
    ],
  },

  // Tools & Utilities
  {
    id: "tools",
    name: "Công cụ",
    icon: Link,
    type: "group",
    items: [
      { name: "Fake Link Generator", path: "/tools/fake-link", icon: Link },
    ],
  },

  // Settings
  {
    id: "settings",
    name: "Cài đặt",
    icon: Settings,
    type: "group",
    items: [
      { name: "General Settings", path: "/settings/general", icon: Settings },
      { name: "UI Settings", path: "/settings/ui", icon: Settings },
      { name: "Auto Settings", path: "/settings/automation/auto", icon: Bot },
      {
        name: "Notification Templates",
        path: "/settings/notifications/templates",
        icon: Bell,
      },
      {
        name: "Alert Settings",
        path: "/settings/notifications/alerts",
        icon: Bell,
      },
      {
        name: "Telegram Settings",
        path: "/settings/notifications/telegram",
        icon: Bell,
      },
    ],
  },
];

const OptimizedSidebar = () => {
  const { logout, user } = useAuth();
  const location = useLocation();
  const [expandedSections, setExpandedSections] = useState([
    "management",
    "automation",
  ]);

  const toggleSection = (sectionId) => {
    setExpandedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const isPathActive = (path) => {
    return location.pathname === path;
  };

  const isSectionActive = (section) => {
    if (section.type === "single") {
      return isPathActive(section.path);
    }
    return section.items?.some((item) => isPathActive(item.path));
  };

  const SingleNavItem = ({ item }) => (
    <NavLink
      to={item.path}
      className={({ isActive }) =>
        `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
          isActive
            ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/25"
            : "text-slate-300 hover:bg-slate-800 hover:text-white hover:translate-x-1"
        }`
      }
    >
      <item.icon className="w-5 h-5 mr-3" />
      <span>{item.name}</span>
    </NavLink>
  );

  const GroupNavItem = ({ section }) => {
    const isExpanded = expandedSections.includes(section.id);
    const isActive = isSectionActive(section);

    return (
      <div className="space-y-1">
        <button
          onClick={() => toggleSection(section.id)}
          className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
            isActive
              ? "bg-slate-800 text-white border border-slate-600"
              : "text-slate-300 hover:bg-slate-800 hover:text-white"
          }`}
        >
          <div className="flex items-center">
            <section.icon className="w-5 h-5 mr-3" />
            <span>{section.name}</span>
          </div>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-4 h-4" />
          </motion.div>
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="ml-4 space-y-1 border-l border-slate-700 pl-4"
            >
              {section.items.map((item, index) => (
                <NavLink
                  key={index}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2 text-sm rounded-md transition-all duration-200 ${
                      isActive
                        ? "bg-blue-600/20 text-blue-300 border-l-2 border-blue-400"
                        : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                    }`
                  }
                >
                  <item.icon className="w-4 h-4 mr-2 opacity-70" />
                  <span>{item.name}</span>
                </NavLink>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ x: -280 }}
      animate={{ x: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className="flex flex-col h-full bg-gradient-to-b from-slate-900 to-slate-800 text-white border-r border-slate-700/50 shadow-2xl"
    >
      {/* Logo & Header */}
      <div className="flex items-center justify-center p-6 border-b border-slate-700/50 bg-slate-900/50">
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="flex-shrink-0"
        >
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
        </motion.div>
        <div className="ml-3">
          <h1 className="text-xl font-bold tracking-wider bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Admin Panel
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {user?.name || "Super Admin"}
          </p>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800">
        {menuSections.map((section, index) => (
          <div key={section.id}>
            {section.type === "single" ? (
              <SingleNavItem item={section} />
            ) : (
              <GroupNavItem section={section} />
            )}
          </div>
        ))}
      </nav>

      {/* Footer - Account & Logout */}
      <div className="px-4 py-4 border-t border-slate-700/50 bg-slate-900/30 space-y-2">
        <NavLink
          to="/account/settings"
          className={({ isActive }) =>
            `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
              isActive
                ? "bg-slate-700 text-white"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            }`
          }
        >
          <UserCog className="w-5 h-5 mr-3" />
          <span>Tài khoản</span>
        </NavLink>

        <button
          onClick={logout}
          className="w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg text-slate-300 hover:bg-red-500/20 hover:text-red-400 transition-all duration-200 hover:scale-105"
        >
          <LogOut className="w-5 h-5 mr-3" />
          <span>Đăng xuất</span>
        </button>
      </div>

      {/* Quick Stats Footer */}
      <div className="px-4 py-2 text-xs text-slate-500 border-t border-slate-800">
        <div className="flex justify-between items-center">
          <span>Admin Session</span>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            <span>Online</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default OptimizedSidebar;
