/**
 * Enhanced API Hook - React Hook for Enhanced API Service
 * Hook React để sử dụng Enhanced API với state management
 */

import { useState, useEffect, useCallback } from "react";
import {
  enhancedApiClient,
  enhancedAutoLoginAPI,
} from "@/services/enhancedApiService";
import connectionMonitor from "@/services/connectionMonitor";
import { useToast } from "@/components/ui/use-toast";

export const useEnhancedApi = () => {
  const [connectionStatus, setConnectionStatus] = useState(
    connectionMonitor.status
  );
  const [apiHealth, setApiHealth] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = connectionMonitor.subscribe(setConnectionStatus);
    return unsubscribe;
  }, []);

  // Get API health status
  const getApiHealth = useCallback(async () => {
    try {
      const health = enhancedApiClient.getHealthStatus();
      setApiHealth(health);
      return health;
    } catch (error) {
      console.error("Failed to get API health:", error);
      return null;
    }
  }, []);

  // Auto Login specific hooks
  const useAutoLogin = () => {
    const [requests, setRequests] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [schedules, setSchedules] = useState([]);
    const [monitoring, setMonitoring] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch auto login requests
    const fetchRequests = useCallback(
      async (filters = {}) => {
        setLoading(true);
        setError(null);
        try {
          const data = await enhancedAutoLoginAPI.getRequests(filters);
          setRequests(data);
          return data;
        } catch (err) {
          setError(err.message);
          toast({
            title: "Lỗi tải dữ liệu",
            description: err.message,
            variant: "destructive",
          });
          throw err;
        } finally {
          setLoading(false);
        }
      },
      [toast]
    );

    // Create auto login request
    const createRequest = useCallback(
      async (requestData) => {
        setLoading(true);
        setError(null);
        try {
          const result = await enhancedAutoLoginAPI.createRequest(requestData);

          // Refresh requests list
          await fetchRequests();

          toast({
            title: "Thành công",
            description: "Auto Login request đã được tạo thành công!",
          });

          return result;
        } catch (err) {
          setError(err.message);
          toast({
            title: "Lỗi tạo request",
            description: err.message,
            variant: "destructive",
          });
          throw err;
        } finally {
          setLoading(false);
        }
      },
      [fetchRequests, toast]
    );

    // Update auto login request
    const updateRequest = useCallback(
      async (id, updates) => {
        setLoading(true);
        setError(null);
        try {
          const result = await enhancedAutoLoginAPI.updateRequest(id, updates);

          // Update local state
          setRequests((prev) =>
            prev.map((req) => (req.id === id ? { ...req, ...updates } : req))
          );

          toast({
            title: "Cập nhật thành công",
            description: "Auto Login request đã được cập nhật!",
          });

          return result;
        } catch (err) {
          setError(err.message);
          toast({
            title: "Lỗi cập nhật",
            description: err.message,
            variant: "destructive",
          });
          throw err;
        } finally {
          setLoading(false);
        }
      },
      [toast]
    );

    // Delete auto login request
    const deleteRequest = useCallback(
      async (id) => {
        setLoading(true);
        setError(null);
        try {
          await enhancedAutoLoginAPI.deleteRequest(id);

          // Remove from local state
          setRequests((prev) => prev.filter((req) => req.id !== id));

          toast({
            title: "Xóa thành công",
            description: "Auto Login request đã được xóa!",
          });
        } catch (err) {
          setError(err.message);
          toast({
            title: "Lỗi xóa request",
            description: err.message,
            variant: "destructive",
          });
          throw err;
        } finally {
          setLoading(false);
        }
      },
      [toast]
    );

    // Execute auto login request
    const executeRequest = useCallback(
      async (id) => {
        setLoading(true);
        setError(null);
        try {
          const result = await enhancedAutoLoginAPI.executeRequest(id);

          toast({
            title: "Thực thi thành công",
            description: "Auto Login request đang được thực thi!",
          });

          return result;
        } catch (err) {
          setError(err.message);
          toast({
            title: "Lỗi thực thi",
            description: err.message,
            variant: "destructive",
          });
          throw err;
        } finally {
          setLoading(false);
        }
      },
      [toast]
    );

    // Fetch templates
    const fetchTemplates = useCallback(async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await enhancedAutoLoginAPI.getTemplates();
        setTemplates(data);
        return data;
      } catch (err) {
        setError(err.message);
        console.error("Failed to fetch templates:", err);
        return [];
      } finally {
        setLoading(false);
      }
    }, []);

    // Create template
    const createTemplate = useCallback(
      async (templateData) => {
        setLoading(true);
        setError(null);
        try {
          const result = await enhancedAutoLoginAPI.createTemplate(
            templateData
          );

          // Refresh templates
          await fetchTemplates();

          toast({
            title: "Template đã tạo",
            description: "Template Auto Login đã được tạo thành công!",
          });

          return result;
        } catch (err) {
          setError(err.message);
          toast({
            title: "Lỗi tạo template",
            description: err.message,
            variant: "destructive",
          });
          throw err;
        } finally {
          setLoading(false);
        }
      },
      [fetchTemplates, toast]
    );

    // Fetch schedules
    const fetchSchedules = useCallback(async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await enhancedAutoLoginAPI.getSchedules();
        setSchedules(data);
        return data;
      } catch (err) {
        setError(err.message);
        console.error("Failed to fetch schedules:", err);
        return [];
      } finally {
        setLoading(false);
      }
    }, []);

    // Create schedule
    const createSchedule = useCallback(
      async (scheduleData) => {
        setLoading(true);
        setError(null);
        try {
          const result = await enhancedAutoLoginAPI.createSchedule(
            scheduleData
          );

          // Refresh schedules
          await fetchSchedules();

          toast({
            title: "Schedule đã tạo",
            description: "Lịch trình Auto Login đã được tạo thành công!",
          });

          return result;
        } catch (err) {
          setError(err.message);
          toast({
            title: "Lỗi tạo schedule",
            description: err.message,
            variant: "destructive",
          });
          throw err;
        } finally {
          setLoading(false);
        }
      },
      [fetchSchedules, toast]
    );

    // Fetch monitoring data
    const fetchMonitoring = useCallback(async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await enhancedAutoLoginAPI.getMonitoringData();
        setMonitoring(data);
        return data;
      } catch (err) {
        setError(err.message);
        console.error("Failed to fetch monitoring data:", err);
        return null;
      } finally {
        setLoading(false);
      }
    }, []);

    return {
      // State
      requests,
      templates,
      schedules,
      monitoring,
      loading,
      error,

      // Actions
      fetchRequests,
      createRequest,
      updateRequest,
      deleteRequest,
      executeRequest,
      fetchTemplates,
      createTemplate,
      fetchSchedules,
      createSchedule,
      fetchMonitoring,
    };
  };

  // Generic API request wrapper
  const apiRequest = useCallback(
    async (apiCall, options = {}) => {
      const {
        showSuccessToast = false,
        successMessage = "Thành công!",
        showErrorToast = true,
        errorMessage = "Có lỗi xảy ra!",
      } = options;

      try {
        const result = await apiCall();

        if (showSuccessToast) {
          toast({
            title: "Thành công",
            description: successMessage,
          });
        }

        return result;
      } catch (error) {
        if (showErrorToast) {
          toast({
            title: "Lỗi",
            description: error.message || errorMessage,
            variant: "destructive",
          });
        }
        throw error;
      }
    },
    [toast]
  );

  // Test API connection
  const testConnection = useCallback(async () => {
    return connectionMonitor.testConnection();
  }, []);

  // Diagnose connection
  const diagnoseConnection = useCallback(async () => {
    return enhancedApiClient.diagnoseConnection();
  }, []);

  return {
    // Connection status
    connectionStatus,
    apiHealth,

    // API client
    apiClient: enhancedApiClient,

    // Auto Login API
    autoLoginAPI: enhancedAutoLoginAPI,
    useAutoLogin,

    // Utilities
    apiRequest,
    getApiHealth,
    testConnection,
    diagnoseConnection,
  };
};

export default useEnhancedApi;
