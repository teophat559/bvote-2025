// API Client Service for UserBvote
import { contestAdaptor } from "../adaptors";
import { mockContests, mockContestants, mockUser } from "./mockData.js";

// Real API Client for production
class RealApiClient {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
    this.timeout = 30000;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      timeout: this.timeout,
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP Error: ${response.status}`);
      }

      return {
        success: true,
        data,
        status: response.status,
      };
    } catch (error) {
      console.error(`API Request failed: ${endpoint}`, error);
      return {
        success: false,
        error: error.message,
        status: error.status || 500,
      };
    }
  }

  // Public API endpoints (no auth required)
  async getContests() {
    return this.request("/public/contests");
  }

  async getContestDetails(id) {
    return this.request(`/contests/detailed?id=${id}`);
  }

  // Health check
  async healthCheck() {
    return this.request("/health");
  }
}

class MockApiClient {
  constructor() {
    this.baseURL = "http://localhost:3000/api";
    this.mockDelay = 300;
  }

  async simulateDelay() {
    return new Promise((resolve) => setTimeout(resolve, this.mockDelay));
  }

  // Contests API
  async getContests() {
    const response = await contestAdaptor.getContests();
    return response;
  }

  async getContest(id) {
    const response = await contestAdaptor.getContestById(id);
    if (response.success) {
      // Get contestants for this contest
      const contestantsResponse = await contestAdaptor.getContestants(id);
      return {
        success: true,
        data: {
          ...response.data,
          contestants: contestantsResponse.success
            ? contestantsResponse.data
            : [],
        },
      };
    }
    return response;
  }

  // Contestants API
  async getContestants(contestId) {
    await this.simulateDelay();
    return {
      success: true,
      data: mockContestants,
      total: mockContestants.length,
    };
  }

  async getRanking(contestId) {
    await this.simulateDelay();
    const sortedContestants = [...mockContestants].sort(
      (a, b) => b.voteCount - a.voteCount
    );

    return {
      success: true,
      data: {
        ranking: sortedContestants.map((c, index) => ({
          ...c,
          rank: index + 1,
        })),
        total: sortedContestants.length,
        lastUpdated: new Date().toISOString(),
      },
    };
  }

  // User API
  async getUserProfile() {
    await this.simulateDelay();
    return {
      success: true,
      data: mockUser,
    };
  }

  async submitVote(contestantId, contestId) {
    await this.simulateDelay();

    // Simulate vote submission
    return {
      success: true,
      data: {
        voteId: `vote-${Date.now()}`,
        message: "Vote submitted successfully",
        remainingVotes: mockUser.dailyVoteQuota - (mockUser.usedVotesToday + 1),
      },
    };
  }

  async submitKYC(kycData) {
    await this.simulateDelay();

    return {
      success: true,
      data: {
        kycId: `kyc-${Date.now()}`,
        status: "pending",
        message: "KYC submission received",
      },
    };
  }

  // Auth API
  async login(credentials) {
    await this.simulateDelay();

    if (
      credentials.email === "user@example.com" &&
      credentials.password === "password"
    ) {
      return {
        success: true,
        data: {
          token: "mock-jwt-token",
          refreshToken: "mock-refresh-token",
          user: mockUser,
        },
      };
    } else {
      throw new Error("Invalid credentials");
    }
  }

  async refreshToken() {
    await this.simulateDelay();
    return {
      success: true,
      data: {
        token: "new-mock-jwt-token",
        refreshToken: "new-mock-refresh-token",
      },
    };
  }

  async logout() {
    await this.simulateDelay();
    return {
      success: true,
      message: "Logged out successfully",
    };
  }
}

class ProductionApiClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
    this.token = localStorage.getItem("user_token");
    this.refreshToken = localStorage.getItem("user_refresh_token");
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    const config = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    if (this.token) {
      config.headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, config);

      if (response.status === 401 && this.refreshToken) {
        // Try to refresh token
        const refreshed = await this.refreshToken();
        if (refreshed) {
          config.headers.Authorization = `Bearer ${this.token}`;
          const retryResponse = await fetch(url, config);
          return this.handleResponse(retryResponse);
        }
      }

      return this.handleResponse(response);
    } catch (error) {
      throw new Error(`API request failed: ${error.message}`);
    }
  }

  async handleResponse(response) {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Contests API
  async getContests() {
    return this.request("/public/contests");
  }

  async getContest(id) {
    return this.request(`/public/contests/${id}`);
  }

  // Contestants API
  async getContestants(contestId) {
    return this.request(`/public/contests/${contestId}/contestants`);
  }

  async getRanking(contestId) {
    return this.request(`/public/contests/${contestId}/ranking`);
  }

  // User API
  async getUserProfile() {
    return this.request("/user/profile");
  }

  async submitVote(contestantId, contestId) {
    return this.request("/user/vote", {
      method: "POST",
      body: JSON.stringify({ contestantId, contestId }),
    });
  }

  async submitKYC(kycData) {
    return this.request("/user/kyc/submit", {
      method: "POST",
      body: JSON.stringify(kycData),
    });
  }

  // Auth API
  async login(credentials) {
    const response = await this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });

    if (response.success) {
      this.token = response.data.token;
      this.refreshToken = response.data.refreshToken;
      localStorage.setItem("user_token", this.token);
      localStorage.setItem("user_refresh_token", this.refreshToken);
    }

    return response;
  }

  async refreshToken() {
    try {
      const response = await this.request("/auth/refresh", {
        method: "POST",
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      if (response.success) {
        this.token = response.data.token;
        this.refreshToken = response.data.refreshToken;
        localStorage.setItem("user_token", this.token);
        localStorage.setItem("user_refresh_token", this.refreshToken);
        return true;
      }
    } catch (error) {
      // Clear invalid tokens
      this.token = null;
      this.refreshToken = null;
      localStorage.removeItem("user_token");
      localStorage.removeItem("user_refresh_token");
    }

    return false;
  }

  async logout() {
    try {
      await this.request("/auth/logout", { method: "POST" });
    } finally {
      this.token = null;
      this.refreshToken = null;
      localStorage.removeItem("user_token");
      localStorage.removeItem("user_refresh_token");
    }

    return { success: true, message: "Logged out successfully" };
  }
}

// Factory function to create appropriate API client
export function createApiClient() {
  const useMock = import.meta.env.VITE_USE_MOCK === "1";
  const baseURL = "http://localhost:3000/api";

  if (useMock) {
    return new MockApiClient();
  } else {
    return new ProductionApiClient(baseURL);
  }
}

export default createApiClient();
