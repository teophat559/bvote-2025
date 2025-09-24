/**
 * Contest Service for UserBvote
 * Sử dụng adaptor system để quản lý dữ liệu contest
 */
import { contestAdaptor } from '../adaptors';

class ContestService {
  constructor() {
    this.adaptor = contestAdaptor;
  }
  
  /**
   * Get all contests with filters
   */
  async getContests(filters = {}) {
    try {
      const response = await this.adaptor.getContests(filters);
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.error?.message || 'Failed to fetch contests');
      }
    } catch (error) {
      console.error('ContestService.getContests failed:', error);
      throw error;
    }
  }
  
  /**
   * Get contest by ID
   */
  async getContestById(id) {
    try {
      const response = await this.adaptor.getContestById(id);
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.error?.message || 'Failed to fetch contest');
      }
    } catch (error) {
      console.error(`ContestService.getContestById(${id}) failed:`, error);
      throw error;
    }
  }
  
  /**
   * Get contestants for a contest
   */
  async getContestants(contestId, filters = {}) {
    try {
      const response = await this.adaptor.getContestants(contestId, filters);
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.error?.message || 'Failed to fetch contestants');
      }
    } catch (error) {
      console.error(`ContestService.getContestants(${contestId}) failed:`, error);
      throw error;
    }
  }
  
  /**
   * Vote for a contestant
   */
  async voteForContestant(contestId, contestantId, userId) {
    try {
      const response = await this.adaptor.voteForContestant(contestId, contestantId, userId);
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.error?.message || 'Failed to cast vote');
      }
    } catch (error) {
      console.error(`ContestService.voteForContestant failed:`, error);
      throw error;
    }
  }
  
  /**
   * Get leaderboard
   */
  async getLeaderboard(contestId, limit = 10) {
    try {
      const response = await this.adaptor.getLeaderboard(contestId, limit);
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.error?.message || 'Failed to fetch leaderboard');
      }
    } catch (error) {
      console.error(`ContestService.getLeaderboard(${contestId}) failed:`, error);
      throw error;
    }
  }
  
  /**
   * Get featured contests
   */
  async getFeaturedContests() {
    try {
      const response = await this.adaptor.getContests({ featured: true });
      if (response.success) {
        return response.data.filter(contest => contest.featured);
      } else {
        throw new Error(response.error?.message || 'Failed to fetch featured contests');
      }
    } catch (error) {
      console.error('ContestService.getFeaturedContests failed:', error);
      throw error;
    }
  }
  
  /**
   * Get active contests
   */
  async getActiveContests() {
    try {
      const response = await this.adaptor.getContests({ status: 'active' });
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.error?.message || 'Failed to fetch active contests');
      }
    } catch (error) {
      console.error('ContestService.getActiveContests failed:', error);
      throw error;
    }
  }
  
  /**
   * Get contest with full details (contest + contestants)
   */
  async getContestWithDetails(contestId) {
    try {
      const [contestResponse, contestantsResponse] = await Promise.all([
        this.adaptor.getContestById(contestId),
        this.adaptor.getContestants(contestId, { status: 'approved' })
      ]);
      
      if (!contestResponse.success) {
        throw new Error(contestResponse.error?.message || 'Failed to fetch contest');
      }
      
      if (!contestantsResponse.success) {
        throw new Error(contestantsResponse.error?.message || 'Failed to fetch contestants');
      }
      
      return {
        contest: contestResponse.data,
        contestants: contestantsResponse.data,
        totalVotes: contestResponse.data.total_votes || 0,
        userVoteQuota: contestResponse.data.max_votes_per_user || 10,
        userVotesUsed: 0, // This would come from user session
      };
    } catch (error) {
      console.error(`ContestService.getContestWithDetails(${contestId}) failed:`, error);
      throw error;
    }
  }
}

// Export singleton instance
export const contestService = new ContestService();
export default contestService;
