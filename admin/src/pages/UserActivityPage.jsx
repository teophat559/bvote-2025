/**
 * User Activity Page
 * Page component wrapper for UserActivityDashboard
 */

import React from "react";
import UserActivityDashboard from "../components/dashboard/UserActivityDashboard";

const UserActivityPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Activity Monitor</h1>
          <p className="text-muted-foreground">
            Theo dõi hoạt động của người dùng trong thời gian thực
          </p>
        </div>
      </div>

      <UserActivityDashboard />
    </div>
  );
};

export default UserActivityPage;
