import React from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Dashboard from "@/components/Dashboard";
import KeyLoginPage from "@/components/KeyLoginPage";
import { Toaster } from "@/components/ui/toaster";
import EnhancedDashboard from "@/pages/EnhancedDashboard";
import UsersPage from "@/pages/UsersPage";
import GeneralSettings from "@/pages/GeneralSettings";
import IPWhitelist from "@/pages/IPWhitelist";
import AutoLoginPage from "@/pages/AutoLoginPage";
import ChromeProfiles from "@/pages/ChromeProfiles";
import NotificationTemplates from "@/pages/NotificationTemplates";
import AlertSettings from "@/pages/AlertSettings";
import TelegramSettings from "@/pages/TelegramSettings";
import LogsPage from "@/pages/LogsPage";
import SystemStatusPage from "@/pages/SystemStatusPage";
import SettingsPage from "@/pages/SettingsPage";
import PlatformSettings from "@/pages/PlatformSettings";
import ChromeDashboard from "@/pages/ChromeDashboard";
import AgentSettings from "@/pages/AgentSettings";
import NotificationHistory from "@/pages/NotificationHistory";
import UserInterfaceSettings from "@/pages/UserInterfaceSettings";
import ActivityCheck from "@/pages/ActivityCheck";
import FakeLinkGenerator from "@/pages/FakeLinkGenerator";
import AdminKeysPage from "@/pages/AdminKeys.jsx";
import RealtimePage from "@/pages/RealtimePage";
import UserLandingPage from "@/pages/UserLandingPage";
import ConfigurationPage from "@/pages/ConfigurationPage";
import ContestManagementPage from "@/pages/ContestManagementPage";
import ContestDetailPage from "@/pages/ContestDetailPage";
import ContestantList from "@/pages/ContestantList";
import ContestInterfaceSettings from "@/pages/ContestInterfaceSettings";
import PublicContestPage from "@/pages/PublicContestPage";

function App() {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-primary"></div>
      </div>
    );
  }

  const ProtectedRoute = () => {
    if (!token) {
      return <Navigate to="/login" replace />;
    }

    return (
      <Dashboard>
        <Outlet />
      </Dashboard>
    );
  };

  const PublicRoutes = () => (
    <>
      <Outlet />
      <Toaster />
    </>
  );

  return (
    <Routes>
        <Route element={<PublicRoutes />}>
          <Route
            path="/login"
            element={token ? <Navigate to="/" replace /> : <KeyLoginPage />}
          />
          <Route path="/portal/:linkId" element={<UserLandingPage />} />
          <Route path="/contests/:id/vote" element={<PublicContestPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<EnhancedDashboard />} />

          <Route path="/management/users" element={<UsersPage />} />
          <Route
            path="/management/users/activity-check"
            element={<ActivityCheck />}
          />
          <Route
            path="/management/notifications/history"
            element={<NotificationHistory />}
          />
          <Route
            path="/management/contests"
            element={<ContestManagementPage />}
          />
          <Route
            path="/management/contests/:id"
            element={<ContestDetailPage />}
          />
          <Route path="/management/contestants" element={<ContestantList />} />

          <Route path="/automation/auto-login" element={<AutoLoginPage />} />
          <Route
            path="/automation/chrome/dashboard"
            element={<ChromeDashboard />}
          />
          <Route
            path="/automation/chrome/profiles"
            element={<ChromeProfiles />}
          />

          <Route path="/configuration" element={<ConfigurationPage />} />
          <Route path="/settings/general" element={<GeneralSettings />} />
          <Route path="/settings/user-ui" element={<UserInterfaceSettings />} />
          <Route
            path="/settings/contest-ui"
            element={<ContestInterfaceSettings />}
          />
          <Route
            path="/settings/security/admin-keys"
            element={<AdminKeysPage />}
          />
          <Route
            path="/settings/security/ip-whitelist"
            element={<IPWhitelist />}
          />
          <Route
            path="/settings/automation/agent"
            element={<AgentSettings />}
          />
          <Route
            path="/settings/automation/platforms"
            element={<PlatformSettings />}
          />
          <Route
            path="/settings/notifications/templates"
            element={<NotificationTemplates />}
          />
          <Route
            path="/settings/notifications/alerts"
            element={<AlertSettings />}
          />
          <Route
            path="/settings/notifications/telegram"
            element={<TelegramSettings />}
          />

          <Route path="/tools/fake-link" element={<FakeLinkGenerator />} />

          <Route path="/monitoring/realtime" element={<RealtimePage />} />
          <Route path="/monitoring/logs" element={<LogsPage />} />
          <Route path="/monitoring/status" element={<SystemStatusPage />} />

          <Route path="/account/settings" element={<SettingsPage />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
  );
}

export default App;
