import React from "react";
import DashboardContent from "@/pages/DashboardContent";
import { useAuth } from "@/hooks/useAuth";

const DashboardPage = ({ isSidebarOpen, toggleSidebar }) => {
  const { user } = useAuth();

  if (!user) {
    return <div>Loading user data...</div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <DashboardContent
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
      />
    </div>
  );
};

export default DashboardPage;
