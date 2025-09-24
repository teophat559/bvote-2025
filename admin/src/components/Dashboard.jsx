import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/dashboard/Sidebar";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import SystemFooter from "@/components/dashboard/SystemFooter";
import { socketAdaptor } from "@/adaptors/socket/SocketAdaptor.js";

const Dashboard = ({ children }) => {
  const { logout, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const sidebarWidth = "280px";
  const [socketStatus, setSocketStatus] = useState({
    state: "disconnected",
    connected: false,
    id: null,
  });

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  useEffect(() => {
    const update = () => setSocketStatus(socketAdaptor.getStatus());
    update();
    socketAdaptor.on && socketAdaptor.on("socket:connected", update);
    socketAdaptor.on && socketAdaptor.on("socket:disconnected", update);
    socketAdaptor.on && socketAdaptor.on("socket:error", update);
    return () => {
      socketAdaptor.off && socketAdaptor.off("socket:connected", update);
      socketAdaptor.off && socketAdaptor.off("socket:disconnected", update);
      socketAdaptor.off && socketAdaptor.off("socket:error", update);
    };
  }, []);

  const handleRetry = () => {
    try {
      socketAdaptor.disconnect();
      socketAdaptor.connect();
    } catch {}
  };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <Sidebar
        isOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
        onLogout={logout}
        sidebarWidth={sidebarWidth}
        user={user}
      />
      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="flex items-center justify-between h-[65px] px-6 border-b border-border flex-shrink-0">
          <Button variant="ghost" size="icon" onClick={toggleSidebar}>
            <Menu className="h-6 w-6 text-muted-foreground" />
          </Button>
          <div
            className="flex items-center gap-3"
            title={`id: ${socketStatus.id || "N/A"}`}
          >
            <span
              className={`px-2 py-1 rounded text-xs ${
                socketStatus.connected
                  ? "bg-green-600/20 text-green-400"
                  : "bg-red-600/20 text-red-400"
              }`}
            >
              {socketStatus.connected
                ? "Realtime: Connected"
                : "Realtime: Disconnected"}
            </span>
            <Button variant="outline" size="sm" onClick={handleRetry}>
              Retry
            </Button>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-y-auto custom-scrollbar">
          {children}
        </main>
        <SystemFooter />
      </div>
    </div>
  );
};

export default Dashboard;
