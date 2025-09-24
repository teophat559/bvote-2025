import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import HomePage from "@/pages/HomePage";
import ContestDetailsPage from "@/pages/ContestDetailsPage";
import LeaderboardPage from "@/pages/LeaderboardPage";
import ProfilePage from "@/pages/ProfilePage";
import KYCPage from "@/pages/KYCPage";
import AdminPage from "@/pages/AdminPage";
import { HelmetProvider } from "react-helmet-async";
import { Toaster as HotToaster } from "react-hot-toast";
import { SocketProvider } from "@/context/SocketContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import RealtimeNotifications from "@/components/RealtimeNotifications";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster as ShadcnToaster } from "@/components/ui/toaster";
import { AnimatePresence } from "framer-motion";
import ErrorBoundary from "@/components/ErrorBoundary";

function App() {
  const location = useLocation();
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <AuthProvider>
          <SocketProvider>
            <RealtimeNotifications />
            <AnimatePresence mode="wait">
              <Routes location={location} key={location.pathname}>
                <Route path="/" element={<HomePage />} />
                <Route
                  path="/contest/:contestId"
                  element={<ContestDetailsPage />}
                />
                <Route path="/leaderboard" element={<LeaderboardPage />} />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/kyc"
                  element={
                    <ProtectedRoute>
                      <KYCPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute adminOnly={true}>
                      <AdminPage />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </AnimatePresence>
            <HotToaster position="top-center" reverseOrder={false} />
            <ShadcnToaster />
          </SocketProvider>
        </AuthProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;
