import axios from "axios";
import { toast } from "sonner";

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second
const TIMEOUT = 10000; // 10 seconds

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
});

// Retry configuration
const retryableStatusCodes = [408, 429, 500, 502, 503, 504];
const retryableNetworkErrors = [
  "ECONNRESET",
  "ECONNREFUSED",
  "ETIMEDOUT",
  "ENOTFOUND",
];

// Circuit breaker implementation
class CircuitBreaker {
  constructor(threshold = 5, resetTimeout = 60000) {
    this.failureThreshold = threshold;
    this.resetTimeout = resetTimeout;
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.state = "CLOSED"; // CLOSED, OPEN, HALF_OPEN
  }

  async execute(request) {
    if (this.state === "OPEN") {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = "HALF_OPEN";
        this.failureCount = 0;
      } else {
        throw new Error("Circuit breaker is OPEN - service unavailable");
      }
    }

    try {
      const response = await request();
      this.onSuccess();
      return response;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.failureCount = 0;
    this.state = "CLOSED";
  }

  onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.failureThreshold) {
      this.state = "OPEN";
    }
  }
}

// Global circuit breaker instance
const circuitBreaker = new CircuitBreaker();

// Cache implementation
class APICache {
  constructor(ttl = 300000) {
    // 5 minutes default TTL
    this.cache = new Map();
    this.ttl = ttl;
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  set(key, data, customTTL = null) {
    const ttl = customTTL || this.ttl;
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttl,
    });
  }

  delete(key) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  size() {
    return this.cache.size;
  }
}

// Global cache instance
const apiCache = new APICache();

// Offline detection
class OfflineManager {
  constructor() {
    this.isOnline = navigator.onLine;
    this.listeners = [];

    window.addEventListener("online", () => {
      this.isOnline = true;
      this.notifyListeners("online");
    });

    window.addEventListener("offline", () => {
      this.isOnline = false;
      this.notifyListeners("offline");
    });
  }

  addListener(callback) {
    this.listeners.push(callback);
  }

  removeListener(callback) {
    this.listeners = this.listeners.filter((l) => l !== callback);
  }

  notifyListeners(status) {
    this.listeners.forEach((callback) => callback(status));
  }
}

// Global offline manager
const offlineManager = new OfflineManager();

// Retry with exponential backoff
const retry = async (fn, retries = MAX_RETRIES) => {
  try {
    return await fn();
  } catch (error) {
    const isRetryable =
      retryableStatusCodes.includes(error.response?.status) ||
      retryableNetworkErrors.some((code) => error.code === code) ||
      error.message.includes("timeout") ||
      error.message.includes("Network Error");

    if (retries > 0 && isRetryable) {
      const delay = RETRY_DELAY * (MAX_RETRIES - retries + 1); // Exponential backoff
      console.log(
        `API call failed, retrying in ${delay}ms... (${retries} retries left)`
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
      return retry(fn, retries - 1);
    }

    throw error;
  }
};

// Enhanced API request function
export const apiRequest = async (config) => {
  const {
    url,
    method = "GET",
    data,
    cache = false,
    cacheTTL,
    fallbackData,
  } = config;
  const cacheKey = `${method}:${url}:${JSON.stringify(data || {})}`;

  // Check if offline
  if (!offlineManager.isOnline) {
    // Try to get cached data
    if (cache) {
      const cachedData = apiCache.get(cacheKey);
      if (cachedData) {
        toast.info("Đang sử dụng dữ liệu đã lưu (offline)", {
          description: "Kết nối mạng không khả dụng",
        });
        return { data: cachedData, fromCache: true };
      }
    }

    // Use fallback data if available
    if (fallbackData) {
      toast.warning("Sử dụng dữ liệu dự phòng (offline)", {
        description: "Không thể kết nối đến máy chủ",
      });
      return { data: fallbackData, fromFallback: true };
    }

    throw new Error("Không có kết nối mạng và không có dữ liệu dự phòng");
  }

  // Check cache first (for GET requests)
  if (cache && method.toLowerCase() === "get") {
    const cachedData = apiCache.get(cacheKey);
    if (cachedData) {
      return { data: cachedData, fromCache: true };
    }
  }

  // Execute request with circuit breaker and retry logic
  try {
    const response = await circuitBreaker.execute(() =>
      retry(() =>
        apiClient.request({
          url,
          method,
          data,
          ...config,
        })
      )
    );

    // Cache successful responses
    if (cache && method.toLowerCase() === "get") {
      apiCache.set(cacheKey, response.data, cacheTTL);
    }

    return response;
  } catch (error) {
    console.error("API request failed:", error);

    // Try to get stale cached data as fallback
    if (cache) {
      const cachedData = apiCache.get(cacheKey);
      if (cachedData) {
        toast.warning("Sử dụng dữ liệu đã lưu (lỗi API)", {
          description: "Không thể tải dữ liệu mới, hiển thị dữ liệu cũ",
        });
        return { data: cachedData, fromCache: true, stale: true };
      }
    }

    // Use fallback data if available
    if (fallbackData) {
      toast.warning("Sử dụng dữ liệu dự phòng", {
        description: "API không khả dụng, hiển thị dữ liệu dự phòng",
      });
      return { data: fallbackData, fromFallback: true };
    }

    // Show user-friendly error message
    handleApiError(error);
    throw error;
  }
};

// Error handling
export const handleApiError = (error) => {
  let message = "Đã xảy ra lỗi không mong muốn";
  let description = "";

  if (!offlineManager.isOnline) {
    message = "Mất kết nối mạng";
    description = "Vui lòng kiểm tra kết nối internet";
  } else if (
    error.code === "ECONNABORTED" ||
    error.message.includes("timeout")
  ) {
    message = "Hết thời gian chờ";
    description = "Máy chủ phản hồi chậm, vui lòng thử lại";
  } else if (error.response) {
    const status = error.response.status;

    switch (status) {
      case 400:
        message = "Dữ liệu không hợp lệ";
        description =
          error.response.data?.error || "Vui lòng kiểm tra thông tin đã nhập";
        break;
      case 401:
        message = "Phiên làm việc hết hạn";
        description = "Vui lòng đăng nhập lại";
        // Redirect to login or refresh token
        break;
      case 403:
        message = "Không có quyền truy cập";
        description = "Bạn không được phép thực hiện thao tác này";
        break;
      case 404:
        message = "Không tìm thấy dữ liệu";
        description = "Tài nguyên yêu cầu không tồn tại";
        break;
      case 429:
        message = "Quá nhiều yêu cầu";
        description = "Vui lòng thử lại sau ít phút";
        break;
      case 500:
        message = "Lỗi máy chủ";
        description = "Máy chủ đang gặp sự cố, vui lòng thử lại sau";
        break;
      case 502:
        message = "Bad Gateway";
        description = "Lỗi kết nối giữa frontend và backend";
        break;
      case 503:
        message = "Dịch vụ không khả dụng";
        description = "Hệ thống đang bảo trì, vui lòng thử lại sau";
        break;
      case 504:
        message = "Gateway Timeout";
        description =
          "Backend server không phản hồi - Hãy kiểm tra xem backend có đang chạy không";
        break;
      default:
        message = `Lỗi ${status}`;
        description = error.response.data?.error || "Vui lòng thử lại";
    }
  } else if (error.request) {
    message = "Không thể kết nối";
    description = "Kiểm tra kết nối mạng hoặc máy chủ có thể đang bảo trì";
  }

  toast.error(message, { description });
};

// Convenience methods
export const apiGet = (url, options = {}) =>
  apiRequest({ ...options, url, method: "GET" });

export const apiPost = (url, data, options = {}) =>
  apiRequest({ ...options, url, method: "POST", data });

export const apiPut = (url, data, options = {}) =>
  apiRequest({ ...options, url, method: "PUT", data });

export const apiDelete = (url, options = {}) =>
  apiRequest({ ...options, url, method: "DELETE" });

// Request interceptor for auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          });

          const { access_token } = response.data;
          localStorage.setItem("authToken", access_token);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem("authToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

// Export utilities
export { apiCache, circuitBreaker, offlineManager, apiClient, API_BASE_URL };

// Prefetch common data
export const prefetchCommonData = async () => {
  try {
    const commonEndpoints = [
      "/dashboard/stats",
      "/system/status",
      "/user/profile",
    ];

    await Promise.allSettled(
      commonEndpoints.map(
        (endpoint) => apiGet(endpoint, { cache: true, cacheTTL: 60000 }) // 1 minute cache
      )
    );

    console.log("Common data prefetched successfully");
  } catch (error) {
    console.warn("Failed to prefetch common data:", error);
  }
};

// Initialize prefetch on app start
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", prefetchCommonData);
} else {
  prefetchCommonData();
}
