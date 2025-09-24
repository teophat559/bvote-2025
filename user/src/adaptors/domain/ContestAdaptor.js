/**
 * Contest Adaptor for UserBvote
 * Quản lý dữ liệu cuộc thi cho user interface
 */
import config from "../config.js";

// Mock contest data for UserBvote
const mockContests = [
  {
    id: "contest_1",
    title: "Cuộc thi Sáng tạo 2024",
    description: "Cuộc thi sáng tạo dành cho sinh viên với giải thưởng hấp dẫn",
    image:
      "https://via.placeholder.com/400x300/1e293b/64748b?text=Contest+2024",
    status: "active",
    start_date: "2024-01-01T00:00:00Z",
    end_date: "2024-12-31T23:59:59Z",
    participants: 150,
    total_votes: 2500,
    max_votes_per_user: 10,
    voting_enabled: true,
    featured: true,
    category: "creativity",
    prize: "10,000,000 VNĐ",
    created_at: "2023-12-01T00:00:00Z",
    updated_at: new Date().toISOString(),
  },
  {
    id: "contest_2",
    title: "Cuộc thi Thiết kế Logo",
    description: "Thiết kế logo sáng tạo cho thương hiệu mới",
    image:
      "https://via.placeholder.com/400x300/0f172a/94a3b8?text=Logo+Contest",
    status: "active",
    start_date: "2024-02-01T00:00:00Z",
    end_date: "2024-03-31T23:59:59Z",
    participants: 45,
    total_votes: 680,
    max_votes_per_user: 5,
    voting_enabled: true,
    featured: false,
    category: "design",
    prize: "5,000,000 VNĐ",
    created_at: "2024-01-15T00:00:00Z",
    updated_at: new Date().toISOString(),
  },
  {
    id: "contest_3",
    title: "Cuộc thi Ảnh đẹp",
    description: "Chụp ảnh phong cảnh đẹp nhất Việt Nam",
    image:
      "https://via.placeholder.com/400x300/059669/d1fae5?text=Photo+Contest",
    status: "coming_soon",
    start_date: "2024-03-01T00:00:00Z",
    end_date: "2024-04-30T23:59:59Z",
    participants: 0,
    total_votes: 0,
    max_votes_per_user: 3,
    voting_enabled: false,
    featured: true,
    category: "photography",
    prize: "15,000,000 VNĐ",
    created_at: "2024-02-01T00:00:00Z",
    updated_at: new Date().toISOString(),
  },
];

const mockContestants = [
  {
    id: "contestant_1",
    contest_id: "contest_1",
    name: "Nguyễn Văn A",
    avatar: "https://via.placeholder.com/100x100/3b82f6/ffffff?text=A",
    entry_title: "Dự án Xanh - Tương lai Bền vững",
    entry_image:
      "https://via.placeholder.com/300x200/10b981/ffffff?text=Green+Project",
    description: "Dự án phát triển công nghệ xanh cho môi trường",
    votes: 125,
    rank: 1,
    status: "approved",
    submitted_at: "2024-01-15T10:30:00Z",
  },
  {
    id: "contestant_2",
    contest_id: "contest_1",
    name: "Trần Thị B",
    avatar: "https://via.placeholder.com/100x100/ec4899/ffffff?text=B",
    entry_title: "Ý tưởng Sáng tạo AI",
    entry_image:
      "https://via.placeholder.com/300x200/8b5cf6/ffffff?text=AI+Innovation",
    description: "Ứng dụng AI trong giáo dục và y tế",
    votes: 98,
    rank: 2,
    status: "approved",
    submitted_at: "2024-01-20T14:15:00Z",
  },
  {
    id: "contestant_3",
    contest_id: "contest_1",
    name: "Lê Văn C",
    avatar: "https://via.placeholder.com/100x100/f59e0b/ffffff?text=C",
    entry_title: "Smart City Platform",
    entry_image:
      "https://via.placeholder.com/300x200/0ea5e9/ffffff?text=Smart+City",
    description: "Nền tảng thông minh cho thành phố hiện đại",
    votes: 87,
    rank: 3,
    status: "approved",
    submitted_at: "2024-01-25T09:45:00Z",
  },
];

export class ContestAdaptor {
  constructor() {
    this.mode = config.mode;
  }

  /**
   * Simulate network delay
   */
  async delay() {
    if (this.mode === "mock") {
      const { min, max } = config.mock.delay;
      const delayTime = Math.random() * (max - min) + min;
      await new Promise((resolve) => setTimeout(resolve, delayTime));
    }
  }

  /**
   * Get all contests
   */
  async getContests(filters = {}) {
    try {
      if (this.mode === "mock") {
        await this.delay();

        let contests = [...mockContests];

        // Apply filters
        if (filters.status) {
          contests = contests.filter(
            (contest) => contest.status === filters.status
          );
        }
        if (filters.featured !== undefined) {
          contests = contests.filter(
            (contest) => contest.featured === filters.featured
          );
        }
        if (filters.category) {
          contests = contests.filter(
            (contest) => contest.category === filters.category
          );
        }

        return {
          success: true,
          data: contests,
          meta: {
            total: contests.length,
            timestamp: new Date().toISOString(),
          },
        };
      } else {
        // Real API call would go here
        const response = await fetch(`${config.api.baseURL}/public/contests`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return {
          success: true,
          data: data,
        };
      }
    } catch (error) {
      console.error("Failed to get contests:", error);
      return {
        success: false,
        error: {
          message: error.message || "Failed to fetch contests",
          code: "GET_CONTESTS_FAILED",
        },
      };
    }
  }

  /**
   * Get contest by ID
   */
  async getContestById(id) {
    try {
      if (this.mode === "mock") {
        await this.delay();

        const contest = mockContests.find((c) => c.id === id);
        if (!contest) {
          throw new Error("Contest not found");
        }

        return {
          success: true,
          data: contest,
        };
      } else {
        // Real API call
        const response = await fetch(
          `${config.api.baseURL}/public/contests/${id}`
        );
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();
        return { success: true, data };
      }
    } catch (error) {
      return {
        success: false,
        error: {
          message: error.message || "Failed to fetch contest",
          code: "GET_CONTEST_FAILED",
        },
      };
    }
  }

  /**
   * Get contestants for a contest
   */
  async getContestants(contestId, filters = {}) {
    try {
      if (this.mode === "mock") {
        await this.delay();

        let contestants = mockContestants.filter(
          (c) => c.contest_id === contestId
        );

        // Apply filters
        if (filters.status) {
          contestants = contestants.filter((c) => c.status === filters.status);
        }

        // Sort by rank
        contestants.sort((a, b) => a.rank - b.rank);

        return {
          success: true,
          data: contestants,
        };
      } else {
        // Real API call
        const response = await fetch(
          `${config.api.baseURL}/public/contests/${contestId}/contestants`
        );
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();
        return { success: true, data };
      }
    } catch (error) {
      return {
        success: false,
        error: {
          message: error.message || "Failed to fetch contestants",
          code: "GET_CONTESTANTS_FAILED",
        },
      };
    }
  }

  /**
   * Vote for contestant
   */
  async voteForContestant(contestId, contestantId, userId) {
    try {
      if (this.mode === "mock") {
        await this.delay();

        // Find contestant and update vote count
        const contestant = mockContestants.find(
          (c) => c.contest_id === contestId && c.id === contestantId
        );

        if (!contestant) {
          throw new Error("Contestant not found");
        }

        contestant.votes += 1;

        // Update contest total votes
        const contest = mockContests.find((c) => c.id === contestId);
        if (contest) {
          contest.total_votes += 1;
        }

        return {
          success: true,
          data: {
            contestant_id: contestantId,
            new_vote_count: contestant.votes,
            total_contest_votes: contest?.total_votes || 0,
          },
          message: "Vote cast successfully",
        };
      } else {
        // Real API call
        const response = await fetch(
          `${config.api.baseURL}/public/contests/${contestId}/vote`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem(
                config.auth.tokenKey
              )}`,
            },
            body: JSON.stringify({
              contestant_id: contestantId,
              user_id: userId,
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        return { success: true, data };
      }
    } catch (error) {
      return {
        success: false,
        error: {
          message: error.message || "Failed to cast vote",
          code: "VOTE_FAILED",
        },
      };
    }
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(contestId, limit = 10) {
    try {
      if (this.mode === "mock") {
        await this.delay();

        const contestants = mockContestants
          .filter((c) => c.contest_id === contestId)
          .sort((a, b) => b.votes - a.votes)
          .slice(0, limit);

        return {
          success: true,
          data: contestants,
        };
      } else {
        // Real API call
        const response = await fetch(
          `${config.api.baseURL}/public/contests/${contestId}/leaderboard?limit=${limit}`
        );
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();
        return { success: true, data };
      }
    } catch (error) {
      return {
        success: false,
        error: {
          message: error.message || "Failed to fetch leaderboard",
          code: "GET_LEADERBOARD_FAILED",
        },
      };
    }
  }
}

// Singleton instance
export const contestAdaptor = new ContestAdaptor();
