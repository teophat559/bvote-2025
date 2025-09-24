/**
 * Backend Provider - Comprehensive Backend Context
 * Replaces Supabase with full-featured mock backend
 */

import React, { createContext, useContext, useEffect, useState } from "react";
import { mockBackend } from "@/services/mockBackendService";
import { realtimeService } from "@/services/realtimeService";
import { databaseService } from "@/services/databaseService";
import { useToast } from "@/components/ui/use-toast";

export const BackendContext = createContext(null);

export const BackendProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [systemHealth, setSystemHealth] = useState(null);
  const [connectionError, setConnectionError] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    // Initialize backend services
    const initBackend = async () => {
      try {
        console.log("🚀 Initializing Backend Services...");

        // Wait for services to initialize
        await new Promise((resolve) => setTimeout(resolve, 1000));

        setIsConnected(true);
        setConnectionError(null);

        // Get initial system health
        const health = mockBackend.getSystemHealth();
        setSystemHealth(health);

        toast({
          title: "🟢 Backend Connected",
          description: "Hệ thống backend đã sẵn sàng",
          variant: "default",
        });

        console.log("✅ Backend Services initialized successfully");

        // Setup health monitoring
        const healthInterval = setInterval(() => {
          const health = mockBackend.getSystemHealth();
          setSystemHealth(health);
        }, 30000); // Every 30 seconds

        return () => clearInterval(healthInterval);
      } catch (error) {
        console.error("❌ Backend initialization failed:", error);
        setConnectionError(error.message);
        setIsConnected(false);

        toast({
          title: "🔴 Backend Error",
          description: "Không thể kết nối backend",
          variant: "destructive",
        });
      }
    };

    initBackend();

    // Cleanup on unmount
    return () => {
      realtimeService.destroy();
    };
  }, [toast]);

  // Backend API methods
  const api = {
    // Database operations
    db: {
      find: (table, filters) => databaseService.find(table, filters),
      findById: (table, id) => databaseService.findById(table, id),
      insert: (table, record) => databaseService.insert(table, record),
      update: (table, id, updates) =>
        databaseService.update(table, id, updates),
      delete: (table, id) => databaseService.delete(table, id),
      getStats: (table) => databaseService.getStats(table),
      exportData: (tables) => databaseService.exportData(tables),
      importData: (data) => databaseService.importData(data),
    },

    // Realtime operations
    realtime: {
      channel: (name) => realtimeService.channel(name),
      emit: (channel, event, data) =>
        realtimeService.emit(channel, event, data),
      removeChannel: (channelRef) => realtimeService.removeChannel(channelRef),
      getStatus: () => realtimeService.getConnectionStatus(),
    },

    // Authentication
    auth: {
      authenticate: (key) => mockBackend.authenticate(key),
      verifyToken: (token) => {
        // Simple token verification for mock
        return Promise.resolve({
          valid: token && token.startsWith("mock_token_"),
          user: token ? { id: "admin", name: "Admin User" } : null,
        });
      },
    },

    // System operations
    system: {
      getHealth: () => mockBackend.getSystemHealth(),
      getStats: () => mockBackend.get("system_stats"),
      getEvents: () => mockBackend.get("realtime_events"),
    },
  };

  const contextValue = {
    isConnected,
    connectionError,
    systemHealth,
    api,

    // Legacy Supabase-like API for easier migration
    supabase: {
      channel: (name) => realtimeService.channel(name),
      removeChannel: (channelRef) => realtimeService.removeChannel(channelRef),
      from: (table) => ({
        select: (columns = "*") => ({
          eq: (column, value) =>
            databaseService.find(table, { [column]: value }),
          in: (column, values) =>
            databaseService.find(table, {
              [column]: { operator: "in", value: values },
            }),
          gt: (column, value) =>
            databaseService.find(table, {
              [column]: { operator: "gt", value },
            }),
          lt: (column, value) =>
            databaseService.find(table, {
              [column]: { operator: "lt", value },
            }),
          ilike: (column, value) =>
            databaseService.find(table, {
              [column]: { operator: "contains", value },
            }),
        }),
        insert: (data) => databaseService.insert(table, data),
        update: (updates) => ({
          eq: (column, value) => {
            // For simplicity, update first match
            return databaseService
              .find(table, { [column]: value })
              .then((results) => {
                if (results.length > 0) {
                  return databaseService.update(table, results[0].id, updates);
                }
                throw new Error("No matching record found");
              });
          },
        }),
        delete: () => ({
          eq: (column, value) => {
            return databaseService
              .find(table, { [column]: value })
              .then((results) => {
                const deletePromises = results.map((item) =>
                  databaseService.delete(table, item.id)
                );
                return Promise.all(deletePromises);
              });
          },
        }),
      }),
    },
  };

  return (
    <BackendContext.Provider value={contextValue}>
      {children}
    </BackendContext.Provider>
  );
};

// Custom hook for using backend
export const useBackend = () => {
  const context = useContext(BackendContext);
  if (!context) {
    throw new Error("useBackend must be used within a BackendProvider");
  }
  return context;
};

// Legacy hook for Supabase compatibility
export const useSupabase = () => {
  const { supabase, isConnected } = useBackend();
  return { supabase, isConnected };
};

export default BackendProvider;
