/**
 * REST Adaptor
 * Quản lý tất cả HTTP requests với auto-authentication và error handling
 */
import axios from "axios";
import { BaseAdaptor } from "../base/BaseAdaptor.js";
import config from "../config.js";

export class RestAdaptor extends BaseAdaptor {
  constructor() {
    super("RestAdaptor");

    this.client = null;
    this.token = null;
    this.refreshToken = null;
    this.isRefreshing = false;
    this.failedQueue = [];

    this.initializeClient();
    this.loadTokens();
  }

  /**
   * Khởi tạo Axios client với interceptors
   */
  initializeClient() {
    this.client = axios.create({
      baseURL: config.api.baseURL,
      timeout: config.api.timeout,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    // Request interceptor - tự động gắn token
    this.client.interceptors.request.use(
      (requestConfig) => {
        const tracker = this.startPerformanceTracking(
          `${requestConfig.method?.toUpperCase()} ${requestConfig.url}`
        );
        requestConfig.metadata = { tracker };

        if (this.token) {
          requestConfig.headers.Authorization = `Bearer ${this.token}`;
        }

        this.log(
          "debug",
          `Request: ${requestConfig.method?.toUpperCase()} ${
            requestConfig.url
          }`,
          {
            headers: requestConfig.headers,
            data: requestConfig.data,
          }
        );

        return requestConfig;
      },
      (error) => {
        this.error("Request interceptor error", error);
        return Promise.reject(error);
      }
    );

    // Response interceptor - xử lý token refresh và errors
    this.client.interceptors.response.use(
      (response) => {
        this.endPerformanceTracking(response.config.metadata?.tracker);

        this.log(
          "debug",
          `Response: ${response.status} ${response.config.url}`,
          {
            data: response.data,
          }
        );

        return response;
      },
      async (error) => {
        const originalRequest = error.config;

        this.endPerformanceTracking(originalRequest.metadata?.tracker);

        // Token hết hạn
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // Đang refresh token, queue request
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            })
              .then((token) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return this.client(originalRequest);
              })
              .catch((err) => {
                return Promise.reject(err);
              });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const newToken = await this.refreshTokens();
            this.processQueue(null, newToken);
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            this.processQueue(refreshError, null);
            this.handleAuthenticationFailure();
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        // Log error
        this.error("HTTP Request failed", error, {
          url: error.config?.url,
          method: error.config?.method,
          status: error.response?.status,
          data: error.response?.data,
        });

        return Promise.reject(this.standardizeHttpError(error));
      }
    );
  }

  /**
   * Load tokens from storage
   */
  loadTokens() {
    try {
      this.token = localStorage.getItem(config.auth.tokenKey);
      this.refreshToken = localStorage.getItem(config.auth.refreshTokenKey);

      if (this.token) {
        this.log("debug", "Tokens loaded from storage");
      }
    } catch (error) {
      this.error("Failed to load tokens from storage", error);
    }
  }

  /**
   * Save tokens to storage
   */
  saveTokens(token, refreshToken) {
    try {
      this.token = token;
      this.refreshToken = refreshToken;

      localStorage.setItem(config.auth.tokenKey, token);
      if (refreshToken) {
        localStorage.setItem(config.auth.refreshTokenKey, refreshToken);
      }

      this.log("debug", "Tokens saved to storage");
    } catch (error) {
      this.error("Failed to save tokens to storage", error);
    }
  }

  /**
   * Clear tokens
   */
  clearTokens() {
    this.token = null;
    this.refreshToken = null;

    localStorage.removeItem(config.auth.tokenKey);
    localStorage.removeItem(config.auth.refreshTokenKey);

    this.log("debug", "Tokens cleared");
  }

  /**
   * Refresh access token
   */
  async refreshTokens() {
    if (!this.refreshToken) {
      throw new Error("No refresh token available");
    }

    try {
      const response = await axios.post(`${config.api.baseURL}/auth/refresh`, {
        refresh_token: this.refreshToken,
      });

      const { access_token, refresh_token } = response.data;
      this.saveTokens(access_token, refresh_token);

      this.log("info", "Tokens refreshed successfully");
      return access_token;
    } catch (error) {
      this.error("Token refresh failed", error);
      this.clearTokens();
      throw error;
    }
  }

  /**
   * Process queued requests after token refresh
   */
  processQueue(error, token = null) {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve(token);
      }
    });

    this.failedQueue = [];
  }

  /**
   * Handle authentication failure
   */
  handleAuthenticationFailure() {
    this.clearTokens();
    this.emit("auth:failed");

    // Redirect to login if in browser
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }

  /**
   * Standardize HTTP errors
   */
  standardizeHttpError(error) {
    let code = "HTTP_ERROR";
    let message = "Đã xảy ra lỗi khi gọi API";

    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const data = error.response.data;

      switch (status) {
        case 400:
          code = "BAD_REQUEST";
          message = data?.message || "Yêu cầu không hợp lệ";
          break;
        case 401:
          code = "UNAUTHORIZED";
          message = "Phiên đăng nhập đã hết hạn";
          break;
        case 403:
          code = "FORBIDDEN";
          message = "Không có quyền thực hiện hành động này";
          break;
        case 404:
          code = "NOT_FOUND";
          message = "Không tìm thấy tài nguyên";
          break;
        case 422:
          code = "VALIDATION_ERROR";
          message = data?.message || "Dữ liệu không hợp lệ";
          break;
        case 429:
          code = "TOO_MANY_REQUESTS";
          message = "Quá nhiều yêu cầu, vui lòng thử lại sau";
          break;
        case 500:
          code = "SERVER_ERROR";
          message = "Lỗi máy chủ, vui lòng thử lại sau";
          break;
        default:
          code = `HTTP_${status}`;
          message = data?.message || `Lỗi HTTP ${status}`;
      }
    } else if (error.request) {
      // Network error
      code = "NETWORK_ERROR";
      message = "Không thể kết nối tới máy chủ";
    } else {
      // Other error
      code = "REQUEST_ERROR";
      message = error.message || "Lỗi không xác định";
    }

    return this.standardizeError(error, code);
  }

  /**
   * Generic HTTP methods
   */
  async get(url, params = {}, options = {}) {
    const response = await this.client.get(url, { params, ...options });
    return this.standardizeResponse(response.data);
  }

  async post(url, data = {}, options = {}) {
    const response = await this.client.post(url, data, options);
    return this.standardizeResponse(response.data);
  }

  async put(url, data = {}, options = {}) {
    const response = await this.client.put(url, data, options);
    return this.standardizeResponse(response.data);
  }

  async patch(url, data = {}, options = {}) {
    const response = await this.client.patch(url, data, options);
    return this.standardizeResponse(response.data);
  }

  async delete(url, options = {}) {
    const response = await this.client.delete(url, options);
    return this.standardizeResponse(response.data);
  }

  /**
   * Upload file with progress
   */
  async upload(url, file, onProgress = null) {
    const formData = new FormData();
    formData.append("file", file);

    const options = {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    };

    if (onProgress) {
      options.onUploadProgress = (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress(percentCompleted);
      };
    }

    const response = await this.client.post(url, formData, options);
    return this.standardizeResponse(response.data);
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      // In mock mode, return mock health status
      if (this.mode === "mock") {
        return this.standardizeResponse({
          status: "healthy",
          mode: "mock",
          adaptor: this.name,
          timestamp: new Date().toISOString(),
        });
      }

      const response = await this.get("/health");
      return response;
    } catch (error) {
      // In mock mode, don't treat as error
      if (this.mode === "mock") {
        return this.standardizeResponse({
          status: "healthy",
          mode: "mock",
          adaptor: this.name,
          timestamp: new Date().toISOString(),
        });
      }
      return this.standardizeError(error, "HEALTH_CHECK_FAILED");
    }
  }
}

// Singleton instance
export const restAdaptor = new RestAdaptor();
