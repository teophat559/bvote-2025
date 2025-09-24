/**
 * Admin Command Page
 * Page wrapper for AdminCommandCenter component
 */

import React from "react";
import AdminCommandCenter from "../components/dashboard/AdminCommandCenter";

const AdminCommandPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Command Center</h1>
          <p className="text-muted-foreground">
            Gửi lệnh và thông báo đến người dùng trong thời gian thực
          </p>
        </div>
      </div>

      <AdminCommandCenter />
    </div>
  );
};

export default AdminCommandPage;
