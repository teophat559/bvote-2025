import axios from "axios";
import toast from "react-hot-toast";

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;
const TIMEOUT = 10000;

// Create axios instance
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

// Simple circuit breaker for user app
class SimpleCircuitBreaker {
  constructor() {
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.threshold = 3;
    this.resetTimeout = 30000; // 30 seconds
  }

  async execute(request) {
    if (this.isOpen()) {
      throw new Error("Dịch vụ tạm thời không khả dụng");
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

  isOpen() {
    if (this.failureCount >= this.threshold) {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.reset();
        return false;
      }
      return true;
    }
    return false;
  }

  onSuccess() {
    this.failureCount = 0;
  }

  onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
  }

  reset() {
    this.failureCount = 0;
    this.lastFailureTime = null;
  }
}

// Global circuit breaker
const circuitBreaker = new SimpleCircuitBreaker();

// Simple cache for user app
class SimpleCache {
  constructor() {
    this.cache = new Map();
    this.ttl = 180000; // 3 minutes
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item || Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    return item.data;
  }

  set(key, data, customTTL = null) {
    this.cache.set(key, {
      data,
      expiry: Date.now() + (customTTL || this.ttl),
    });
  }

  clear() {
    this.cache.clear();
  }
}

// Global cache
const cache = new SimpleCache();

// Offline detection
const isOnline = () => navigator.onLine;

// Retry with backoff
const retry = async (fn, retries = MAX_RETRIES) => {
  try {
    return await fn();
  } catch (error) {
    const isRetryable =
      retryableStatusCodes.includes(error.response?.status) ||
      retryableNetworkErrors.some((code) => error.code === code) ||
      error.message.includes("timeout");

    if (retries > 0 && isRetryable && isOnline()) {
      const delay = RETRY_DELAY * (MAX_RETRIES - retries + 1);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return retry(fn, retries - 1);
    }

    throw error;
  }
};

// Main API request function
export const apiRequest = async (config) => {
  const { url, method = "GET", data, useCache = false, fallbackData } = config;
  const cacheKey = `${method}:${url}`;

  // Check offline status
  if (!isOnline()) {
    // Try cache first
    if (useCache) {
      const cachedData = cache.get(cacheKey);
      if (cachedData) {
        toast("📱 Đang offline - sử dụng dữ liệu đã lưu", {
          icon: "🔄",
          duration: 2000,
        });
        return { data: cachedData, fromCache: true };
      }
    }

    // Use fallback data
    if (fallbackData) {
      toast.error("📱 Không có kết nối - sử dụng dữ liệu mặc định", {
        duration: 3000,
      });
      return { data: fallbackData, fromFallback: true };
    }

    throw new Error("Không có kết nối mạng");
  }

  // Check cache for GET requests
  if (useCache && method.toLowerCase() === "get") {
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return { data: cachedData, fromCache: true };
    }
  }

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

    // Cache successful GET responses
    if (useCache && method.toLowerCase() === "get") {
      cache.set(cacheKey, response.data);
    }

    return response;
  } catch (error) {
    // Try to get stale cached data
    if (useCache) {
      const cachedData = cache.get(cacheKey);
      if (cachedData) {
        toast.error("⚠️ Lỗi tải dữ liệu - hiển thị dữ liệu cũ", {
          duration: 3000,
        });
        return { data: cachedData, fromCache: true, stale: true };
      }
    }

    // Use fallback data
    if (fallbackData) {
      toast.error("⚠️ Lỗi API - sử dụng dữ liệu dự phòng", {
        duration: 3000,
      });
      return { data: fallbackData, fromFallback: true };
    }

    handleApiError(error);
    throw error;
  }
};

// User-friendly error handling
export const handleApiError = (error) => {
  let message = "Có lỗi xảy ra";

  if (!isOnline()) {
    message = "📱 Mất kết nối mạng";
    toast.error(message, { duration: 4000 });
    return;
  }

  if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
    message = "⏱️ Hết thời gian chờ - vui lòng thử lại";
  } else if (error.response) {
    const status = error.response.status;

    switch (status) {
      case 400:
        message = "❌ Thông tin không hợp lệ";
        break;
      case 401:
        message = "🔐 Phiên đăng nhập hết hạn";
        break;
      case 403:
        message = "🚫 Không có quyền truy cập";
        break;
      case 404:
        message = "🔍 Không tìm thấy dữ liệu";
        break;
      case 429:
        message = "🚦 Quá nhiều yêu cầu - vui lòng chờ";
        break;
      case 500:
        message = "💥 Lỗi hệ thống - vui lòng thử lại";
        break;
      case 502:
        message = "🔗 Lỗi kết nối hệ thống";
        break;
      case 503:
        message = "🔧 Hệ thống đang bảo trì";
        break;
      case 504:
        message = "⏱️ Hệ thống phản hồi chậm - vui lòng thử lại";
        break;
      default:
        message = `❌ Lỗi ${status}`;
    }
  } else {
    message = "🌐 Không thể kết nối tới máy chủ";
  }

  toast.error(message, {
    duration: 4000,
    position: "top-center",
  });
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

// Auth token interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("userToken");
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
    if (error.response?.status === 401) {
      localStorage.removeItem("userToken");
      localStorage.removeItem("userData");

      // Only redirect if not already on login page
      if (!window.location.pathname.includes("login")) {
        toast.error("🔐 Phiên đăng nhập hết hạn - vui lòng đăng nhập lại");
        // You might want to redirect to login or show login modal
      }
    }
    return Promise.reject(error);
  }
);

// Network status monitoring
let wasOffline = false;

const handleOnline = () => {
  if (wasOffline) {
    toast.success("🌐 Đã kết nối lại!", {
      duration: 2000,
      position: "top-center",
    });
    wasOffline = false;
  }
};

const handleOffline = () => {
  toast.error("📱 Mất kết nối mạng", {
    duration: 4000,
    position: "top-center",
  });
  wasOffline = true;
};

// Setup network monitoring
window.addEventListener("online", handleOnline);
window.addEventListener("offline", handleOffline);

// Export utilities
export { cache, circuitBreaker, apiClient, isOnline };

// Prefetch contest data
export const prefetchContestData = async () => {
  if (!isOnline()) return;

  try {
    const contestEndpoints = [
      "/contests/active",
      "/leaderboard/top",
      "/user/profile",
    ];

    await Promise.allSettled(
      contestEndpoints.map((endpoint) => apiGet(endpoint, { useCache: true }))
    );
  } catch (error) {
    console.warn("Failed to prefetch contest data:", error);
  }
};

// Auto-prefetch on app start
setTimeout(prefetchContestData, 1000);
