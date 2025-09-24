/**
 * Auto Login Dashboard Page
 * Page wrapper cho AdminAutoLoginDashboard component
 */

import React from "react";
import AdminAutoLoginDashboard from "../components/dashboard/AdminAutoLoginDashboard";

const AutoLoginDashboardPage = () => {
  return (
    <div className="space-y-6">
      <div className="border-b pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Auto Login Dashboard
            </h1>
            <p className="text-muted-foreground mt-2">
              Quản lý và theo dõi các yêu cầu auto login từ users
            </p>
          </div>
        </div>
      </div>

      <AdminAutoLoginDashboard />
    </div>
  );
};

export default AutoLoginDashboardPage;
