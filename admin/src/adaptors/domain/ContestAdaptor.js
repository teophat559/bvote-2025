/**
 * Contest Domain Adaptor
 * Quản lý dữ liệu cuộc thi với chuyển đổi mock/real
 */
import { BaseAdaptor } from '../base/BaseAdaptor.js';
import { restAdaptor } from '../rest/RestAdaptor.js';
import { socketAdaptor } from '../socket/SocketAdaptor.js';
import config from '../config.js';

// Mock contest data
const mockContests = [
  {
    id: 'contest_1',
    title: 'Cuộc thi Sáng tạo 2024',
    description: 'Cuộc thi sáng tạo dành cho sinh viên',
    status: 'active',
    start_date: '2024-01-01T00:00:00Z',
    end_date: '2024-12-31T23:59:59Z',
    participants: 150,
    total_votes: 2500,
    created_at: '2023-12-01T00:00:00Z',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'contest_2',
    title: 'Cuộc thi Thiết kế Logo',
    description: 'Thiết kế logo cho công ty',
    status: 'draft',
    start_date: '2024-02-01T00:00:00Z',
    end_date: '2024-03-31T23:59:59Z',
    participants: 45,
    total_votes: 680,
    created_at: '2024-01-15T00:00:00Z',
    updated_at: new Date().toISOString(),
  },
];

const mockContestants = [
  {
    id: 'contestant_1',
    contest_id: 'contest_1',
    name: 'Nguyễn Văn A',
    email: 'nguyenvana@example.com',
    entry_title: 'Dự án Xanh',
    votes: 125,
    rank: 1,
    status: 'approved',
    submitted_at: '2024-01-15T10:30:00Z',
  },
  {
    id: 'contestant_2',
    contest_id: 'contest_1',
    name: 'Trần Thị B',
    email: 'tranthib@example.com',
    entry_title: 'Ý tưởng Sáng tạo',
    votes: 98,
    rank: 2,
    status: 'approved',
    submitted_at: '2024-01-20T14:15:00Z',
  },
];

export class ContestAdaptor extends BaseAdaptor {
  constructor() {
    super('ContestAdaptor');

    // Setup real-time subscriptions
    this.setupRealtimeSubscriptions();
  }

  /**
   * Setup real-time event subscriptions
   */
  setupRealtimeSubscriptions() {
    if (config.features.realtime) {
      socketAdaptor.subscribe('contest:updated', (data) => {
        this.log('info', 'Contest updated via socket', data);
        this.emit('contest:updated', data);
      });

      socketAdaptor.subscribe('contestant:new', (data) => {
        this.log('info', 'New contestant via socket', data);
        this.emit('contestant:new', data);
      });

      socketAdaptor.subscribe('vote:cast', (data) => {
        this.log('info', 'Vote cast via socket', data);
        this.emit('vote:cast', data);
      });
    }
  }

  /**
   * Get all contests
   */
  async getContests(filters = {}) {
    const tracker = this.startPerformanceTracking('getContests');

    try {
      if (this.mode === 'mock') {
        await this.delay();

        let contests = [...mockContests];

        // Apply filters
        if (filters.status) {
          contests = contests.filter(contest => contest.status === filters.status);
        }
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          contests = contests.filter(contest =>
            contest.title.toLowerCase().includes(searchLower) ||
            contest.description.toLowerCase().includes(searchLower)
          );
        }

        // Apply pagination
        const page = filters.page || 1;
        const limit = filters.limit || 20;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedContests = contests.slice(startIndex, endIndex);

        const result = this.standardizeResponse(paginatedContests, true, null, {
          total: contests.length,
          page,
          limit,
          totalPages: Math.ceil(contests.length / limit),
        });

        this.endPerformanceTracking(tracker);
        return result;
      } else {
        // Real API call
        const response = await restAdaptor.get('/contests', filters);
        this.endPerformanceTracking(tracker);
        return response;
      }
    } catch (error) {
      this.endPerformanceTracking(tracker);
      return this.standardizeError(error, 'GET_CONTESTS_FAILED', { filters });
    }
  }

  /**
   * Get contest by ID
   */
  async getContestById(id) {
    const tracker = this.startPerformanceTracking('getContestById');

    try {
      if (this.mode === 'mock') {
        await this.delay();

        const contest = mockContests.find(c => c.id === id);
        if (!contest) {
          throw new Error('Contest not found');
        }

        const result = this.standardizeResponse(contest);
        this.endPerformanceTracking(tracker);
        return result;
      } else {
        // Real API call
        const response = await restAdaptor.get(`/contests/${id}`);
        this.endPerformanceTracking(tracker);
        return response;
      }
    } catch (error) {
      this.endPerformanceTracking(tracker);
      return this.standardizeError(error, 'GET_CONTEST_FAILED', { id });
    }
  }

  /**
   * Get contestants for a contest
   */
  async getContestants(contestId, filters = {}) {
    const tracker = this.startPerformanceTracking('getContestants');

    try {
      if (this.mode === 'mock') {
        await this.delay();

        let contestants = mockContestants.filter(c => c.contest_id === contestId);

        // Apply filters
        if (filters.status) {
          contestants = contestants.filter(c => c.status === filters.status);
        }
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          contestants = contestants.filter(c =>
            c.name.toLowerCase().includes(searchLower) ||
            c.entry_title.toLowerCase().includes(searchLower)
          );
        }

        // Sort by rank
        contestants.sort((a, b) => a.rank - b.rank);

        const result = this.standardizeResponse(contestants);
        this.endPerformanceTracking(tracker);
        return result;
      } else {
        // Real API call
        const response = await restAdaptor.get(`/contests/${contestId}/contestants`, filters);
        this.endPerformanceTracking(tracker);
        return response;
      }
    } catch (error) {
      this.endPerformanceTracking(tracker);
      return this.standardizeError(error, 'GET_CONTESTANTS_FAILED', { contestId, filters });
    }
  }

  /**
   * Create new contest
   */
  async createContest(contestData) {
    const tracker = this.startPerformanceTracking('createContest');

    try {
      if (this.mode === 'mock') {
        await this.delay();

        const newContest = {
          id: 'contest_' + Date.now(),
          ...contestData,
          participants: 0,
          total_votes: 0,
          status: 'draft',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        mockContests.push(newContest);

        // Emit real-time event
        if (config.features.realtime) {
          this.emit('contest:created', newContest);
        }

        const result = this.standardizeResponse(newContest, true, 'Contest created successfully');
        this.endPerformanceTracking(tracker);
        return result;
      } else {
        // Real API call
        const response = await restAdaptor.post('/contests', contestData);
        this.endPerformanceTracking(tracker);
        return response;
      }
    } catch (error) {
      this.endPerformanceTracking(tracker);
      return this.standardizeError(error, 'CREATE_CONTEST_FAILED', { contestData });
    }
  }

  /**
   * Update contest
   */
  async updateContest(id, updates) {
    const tracker = this.startPerformanceTracking('updateContest');

    try {
      if (this.mode === 'mock') {
        await this.delay();

        const contestIndex = mockContests.findIndex(c => c.id === id);
        if (contestIndex === -1) {
          throw new Error('Contest not found');
        }

        mockContests[contestIndex] = {
          ...mockContests[contestIndex],
          ...updates,
          updated_at: new Date().toISOString(),
        };

        const updatedContest = mockContests[contestIndex];

        // Emit real-time event
        if (config.features.realtime) {
          this.emit('contest:updated', updatedContest);
        }

        const result = this.standardizeResponse(updatedContest, true, 'Contest updated successfully');
        this.endPerformanceTracking(tracker);
        return result;
      } else {
        // Real API call
        const response = await restAdaptor.put(`/contests/${id}`, updates);
        this.endPerformanceTracking(tracker);
        return response;
      }
    } catch (error) {
      this.endPerformanceTracking(tracker);
      return this.standardizeError(error, 'UPDATE_CONTEST_FAILED', { id, updates });
    }
  }

  /**
   * Delete contest
   */
  async deleteContest(id) {
    const tracker = this.startPerformanceTracking('deleteContest');

    try {
      if (this.mode === 'mock') {
        await this.delay();

        const contestIndex = mockContests.findIndex(c => c.id === id);
        if (contestIndex === -1) {
          throw new Error('Contest not found');
        }

        const deletedContest = mockContests.splice(contestIndex, 1)[0];

        // Also remove contestants
        const contestantIndices = [];
        mockContestants.forEach((contestant, index) => {
          if (contestant.contest_id === id) {
            contestantIndices.push(index);
          }
        });

        // Remove in reverse order to maintain indices
        contestantIndices.reverse().forEach(index => {
          mockContestants.splice(index, 1);
        });

        // Emit real-time event
        if (config.features.realtime) {
          this.emit('contest:deleted', { id, contest: deletedContest });
        }

        const result = this.standardizeResponse(null, true, 'Contest deleted successfully');
        this.endPerformanceTracking(tracker);
        return result;
      } else {
        // Real API call
        const response = await restAdaptor.delete(`/contests/${id}`);
        this.endPerformanceTracking(tracker);
        return response;
      }
    } catch (error) {
      this.endPerformanceTracking(tracker);
      return this.standardizeError(error, 'DELETE_CONTEST_FAILED', { id });
    }
  }

  /**
   * Get contest statistics
   */
  async getContestStats() {
    const tracker = this.startPerformanceTracking('getContestStats');

    try {
      if (this.mode === 'mock') {
        await this.delay();

        const stats = {
          total: mockContests.length,
          active: mockContests.filter(c => c.status === 'active').length,
          draft: mockContests.filter(c => c.status === 'draft').length,
          completed: mockContests.filter(c => c.status === 'completed').length,
          totalParticipants: mockContests.reduce((sum, c) => sum + c.participants, 0),
          totalVotes: mockContests.reduce((sum, c) => sum + c.total_votes, 0),
        };

        const result = this.standardizeResponse(stats);
        this.endPerformanceTracking(tracker);
        return result;
      } else {
        // Real API call
        const response = await restAdaptor.get('/contests/stats');
        this.endPerformanceTracking(tracker);
        return response;
      }
    } catch (error) {
      this.endPerformanceTracking(tracker);
      return this.standardizeError(error, 'GET_CONTEST_STATS_FAILED');
    }
  }
}

// Singleton instance
export const contestAdaptor = new ContestAdaptor();
