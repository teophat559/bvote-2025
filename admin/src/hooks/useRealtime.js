/**
 * useRealtime Hook
 * Modern replacement for Supabase realtime functionality
 */

import { useEffect, useRef, useCallback } from "react";
import { realtimeService } from "@/services/realtimeService";
import { useToast } from "@/components/ui/use-toast";

export const useRealtime = (channelName, options = {}) => {
  const channelRef = useRef(null);
  const subscribersRef = useRef(new Map());
  const { toast } = useToast();

  const {
    autoConnect = true,
    showToastOnUpdate = false,
    reconnectOnError = true,
    enableLogging = false,
  } = options;

  // Subscribe to events
  const on = useCallback(
    (event, callback) => {
      if (!channelRef.current) {
        console.warn(`Channel ${channelName} not initialized`);
        return;
      }

      // Store subscriber for cleanup
      subscribersRef.current.set(event, callback);

      // Enhanced callback with error handling
      const enhancedCallback = (payload) => {
        try {
          if (enableLogging) {
            console.log(`📡 [${channelName}] ${event}:`, payload);
          }

          if (showToastOnUpdate && event !== "system") {
            toast({
              title: "🔄 Cập nhật Realtime",
              description: `${channelName} đã được cập nhật`,
              duration: 2000,
            });
          }

          callback(payload);
        } catch (error) {
          console.error(`Error in realtime callback for ${event}:`, error);

          if (reconnectOnError) {
            reconnect();
          }
        }
      };

      channelRef.current.on(event, enhancedCallback);

      if (enableLogging) {
        console.log(`👂 Subscribed to ${event} on ${channelName}`);
      }
    },
    [channelName, showToastOnUpdate, reconnectOnError, enableLogging, toast]
  );

  // Connect to channel
  const connect = useCallback(() => {
    if (channelRef.current) {
      return; // Already connected
    }

    try {
      channelRef.current = realtimeService.channel(channelName);

      if (enableLogging) {
        console.log(`🔌 Connected to channel: ${channelName}`);
      }

      return channelRef.current;
    } catch (error) {
      console.error(`Failed to connect to channel ${channelName}:`, error);

      if (toast) {
        toast({
          title: "❌ Kết nối Realtime thất bại",
          description: `Không thể kết nối ${channelName}`,
          variant: "destructive",
        });
      }
    }
  }, [channelName, enableLogging, toast]);

  // Disconnect from channel
  const disconnect = useCallback(() => {
    if (channelRef.current) {
      try {
        channelRef.current.unsubscribe();
        realtimeService.removeChannel(channelRef.current);
        channelRef.current = null;
        subscribersRef.current.clear();

        if (enableLogging) {
          console.log(`🔌 Disconnected from channel: ${channelName}`);
        }
      } catch (error) {
        console.error(`Error disconnecting from ${channelName}:`, error);
      }
    }
  }, [channelName, enableLogging]);

  // Reconnect
  const reconnect = useCallback(() => {
    if (enableLogging) {
      console.log(`🔄 Reconnecting to channel: ${channelName}`);
    }

    disconnect();
    setTimeout(() => {
      connect();

      // Re-subscribe to events
      subscribersRef.current.forEach((callback, event) => {
        on(event, callback);
      });
    }, 1000);
  }, [channelName, enableLogging, disconnect, connect, on]);

  // Subscribe and start listening
  const subscribe = useCallback(() => {
    if (!channelRef.current) {
      connect();
    }

    if (channelRef.current) {
      channelRef.current.subscribe();

      if (enableLogging) {
        console.log(`✅ Subscribed to channel: ${channelName}`);
      }
    }
  }, [channelName, enableLogging, connect]);

  // Emit events
  const emit = useCallback(
    (event, data) => {
      realtimeService.emit(channelName, event, data);

      if (enableLogging) {
        console.log(`📤 Emitted ${event} on ${channelName}:`, data);
      }
    },
    [channelName, enableLogging]
  );

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  // Get connection status
  const getStatus = useCallback(() => {
    return {
      connected: !!channelRef.current,
      channel: channelName,
      subscribers: subscribersRef.current.size,
      lastActivity: new Date().toISOString(),
    };
  }, [channelName]);

  return {
    // Core methods
    on,
    subscribe,
    emit,

    // Connection management
    connect,
    disconnect,
    reconnect,

    // Status
    getStatus,
    isConnected: !!channelRef.current,

    // Channel reference (for advanced usage)
    channelRef: channelRef.current,
  };
};

// Specialized hooks
export const useLoginRequests = (options = {}) => {
  return useRealtime("login_requests", {
    showToastOnUpdate: true,
    enableLogging: true,
    ...options,
  });
};

export const useSystemMonitoring = (options = {}) => {
  return useRealtime("system_monitoring", {
    showToastOnUpdate: false,
    enableLogging: false,
    ...options,
  });
};

export const useAdminActivity = (options = {}) => {
  return useRealtime("admin_activity", {
    showToastOnUpdate: true,
    enableLogging: true,
    ...options,
  });
};

export default useRealtime;
