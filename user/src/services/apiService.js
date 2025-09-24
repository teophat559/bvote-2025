import { mockData } from "@/data/mockData";

const API_BASE_URL = import.meta.env.VITE_API_URL;
const USE_MOCK_DATA =
  import.meta.env.VITE_USE_MOCK === "1" || import.meta.env.PROD;

const fetchWithAuth = async (url, options = {}) => {
  const token = localStorage.getItem("jwt_token");
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ message: `Lỗi máy chủ với mã ${response.status}` }));
    throw new Error(errorData.message || "Đã có lỗi xảy ra.");
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
};

const ADMIN_ACCESS_KEY = "ADMIN_BVOTE_2025_KEY";

export const apiService = {
  login: async (credentials) => {
    if (USE_MOCK_DATA) {
      return new Promise((resolve, reject) =>
        setTimeout(() => {
          // Check for admin key login
          if (credentials.adminKey) {
            if (credentials.adminKey === ADMIN_ACCESS_KEY) {
              const adminUser = {
                id: "admin-123",
                email: "admin@system",
                name: "Quản trị viên Hệ thống",
                avatar: `https://i.pravatar.cc/150?u=admin-123`,
                phone: "0987654321",
                kycStatus: "verified",
                role: "admin",
                voteQuota: { daily: 999, used: 0, total: 9999 },
              };
              resolve({
                user: adminUser,
                token: `mock-jwt-for-${adminUser.id}`,
              });
            } else {
              reject(new Error("Mã key admin không hợp lệ."));
            }
            return;
          }

          // Regular user login (no admin access via email/password anymore)
          const isUser = credentials.email === "user@bvote.com";
          if (isUser && credentials.password === "password123") {
            const mockUser = {
              id: "user-123",
              email: credentials.email,
              name: "Người dùng Mẫu",
              avatar: `https://i.pravatar.cc/150?u=user-123`,
              phone: "0987654321",
              kycStatus: "unverified",
              role: "user",
              voteQuota: { daily: 10, used: 2, total: 100 },
            };
            resolve({ user: mockUser, token: `mock-jwt-for-${mockUser.id}` });
          } else {
            reject(new Error("Sai thông tin đăng nhập."));
          }
        }, 500)
      );
    }
    return fetchWithAuth(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  },

  adminLogin: async (adminKey) => {
    if (USE_MOCK_DATA) {
      return new Promise((resolve, reject) =>
        setTimeout(() => {
          if (adminKey === ADMIN_ACCESS_KEY) {
            const adminUser = {
              id: "admin-123",
              email: "admin@system",
              name: "Quản trị viên Hệ thống",
              avatar: `https://i.pravatar.cc/150?u=admin-123`,
              phone: "0987654321",
              kycStatus: "verified",
              role: "admin",
              voteQuota: { daily: 999, used: 0, total: 9999 },
            };
            resolve({ user: adminUser, token: `mock-jwt-for-${adminUser.id}` });
          } else {
            reject(new Error("Mã key admin không hợp lệ."));
          }
        }, 500)
      );
    }
    return fetchWithAuth(`${API_BASE_URL}/auth/admin-login`, {
      method: "POST",
      body: JSON.stringify({ adminKey }),
    });
  },
  logout: async () => {
    if (USE_MOCK_DATA) {
      return new Promise((resolve) => setTimeout(() => resolve(), 200));
    }
    return fetchWithAuth(`${API_BASE_URL}/auth/logout`, { method: "POST" });
  },

  getContests: async () => {
    if (USE_MOCK_DATA) {
      return new Promise((resolve) =>
        setTimeout(() => resolve(mockData.contests), 500)
      );
    }
    try {
      const response = await fetch(`${API_BASE_URL}/public/contests`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      // Fallback to mock data on error
      return mockData.contests;
    }
  },
  getContestDetails: async (contestId) => {
    if (USE_MOCK_DATA) {
      return new Promise((resolve, reject) =>
        setTimeout(() => {
          const contest = mockData.contests.find((c) => c.id === contestId);
          if (contest) {
            resolve({
              ...contest,
              contestants: mockData.contestants.filter(
                (c) => c.contestId === contestId
              ),
            });
          } else {
            reject(new Error("Không tìm thấy cuộc thi"));
          }
        }, 500)
      );
    }
    try {
      const response = await fetch(
        `${API_BASE_URL}/public/contests/${contestId}`
      );
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      // Fallback to mock data on error
      const contest = mockData.contests.find((c) => c.id === contestId);
      if (contest) {
        return {
          ...contest,
          contestants: mockData.contestants.filter(
            (c) => c.contestId === contestId
          ),
        };
      } else {
        throw new Error("Không tìm thấy cuộc thi");
      }
    }
  },
  getLeaderboard: async (contestId) => {
    if (USE_MOCK_DATA) {
      return new Promise((resolve) =>
        setTimeout(() => resolve(mockData.leaderboard), 500)
      );
    }
    try {
      const url = contestId
        ? `${API_BASE_URL}/public/contests/${contestId}/ranking`
        : `${API_BASE_URL}/public/ranking`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      // Fallback to mock data on error
      return mockData.leaderboard;
    }
  },
  getUserProfile: async () => {
    if (USE_MOCK_DATA) {
      const token = localStorage.getItem("jwt_token");
      if (!token) {
        return new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Unauthorized")), 300)
        );
      }
      const userId = token.includes("admin") ? "admin-123" : "user-123";
      const mockUser =
        userId === "admin-123"
          ? {
              id: "admin-123",
              email: "admin@bvote.com",
              name: "Quản trị viên",
              avatar: `https://i.pravatar.cc/150?u=admin-123`,
              phone: "0987654321",
              kycStatus: "verified",
              role: "admin",
              voteQuota: { daily: 999, used: 0, total: 9999 },
            }
          : mockData.userProfile;
      return new Promise((resolve) => setTimeout(() => resolve(mockUser), 300));
    }
    return fetchWithAuth(`${API_BASE_URL}/user/profile`);
  },
  getUserVoteHistory: async () => {
    if (USE_MOCK_DATA) {
      return new Promise((resolve) =>
        setTimeout(() => resolve(mockData.voteHistory), 500)
      );
    }
    return fetchWithAuth(`${API_BASE_URL}/user/votes`);
  },
  submitVote: async (contestantId, votes) => {
    if (USE_MOCK_DATA) {
      return new Promise((resolve) =>
        setTimeout(() => {
          resolve({ success: true, message: "Bình chọn thành công (mock)" });
        }, 500)
      );
    }
    return fetchWithAuth(`${API_BASE_URL}/user/vote`, {
      method: "POST",
      body: JSON.stringify({ contestantId, votes }),
    });
  },
  submitUnvote: async (voteId) => {
    if (USE_MOCK_DATA) {
      return new Promise((resolve) =>
        setTimeout(() => {
          resolve({
            success: true,
            message: "Hủy bình chọn thành công (mock)",
          });
        }, 500)
      );
    }
    return fetchWithAuth(`${API_BASE_URL}/user/unvote`, {
      method: "POST",
      body: JSON.stringify({ voteId }),
    });
  },
  submitKYC: async (formData) => {
    if (USE_MOCK_DATA) {
      return new Promise((resolve) =>
        setTimeout(() => {
          resolve({ success: true, message: "Hồ sơ KYC đã được gửi (mock)" });
        }, 1000)
      );
    }
    const token = localStorage.getItem("jwt_token");
    const response = await fetch(`${API_BASE_URL}/user/kyc/submit`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: "Lỗi gửi KYC" }));
      throw new Error(errorData.message);
    }
    return response.json();
  },
  getKycStatus: async () => {
    if (USE_MOCK_DATA) {
      return new Promise((resolve) =>
        setTimeout(
          () => resolve({ status: mockData.userProfile.kycStatus }),
          200
        )
      );
    }
    return fetchWithAuth(`${API_BASE_URL}/user/kyc/status`);
  },
};
