import { apiClient } from '@/services/apiClient';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === '1';

const mockLogs = [
  { id: 1, timestamp: new Date().toISOString(), level: 'info', service: 'API', message: 'User user1@example.com logged in successfully.' },
  { id: 2, timestamp: new Date(Date.now() - 10000).toISOString(), level: 'warn', service: 'Socket.IO', message: 'Client disconnected unexpectedly.' },
  { id: 3, timestamp: new Date(Date.now() - 25000).toISOString(), level: 'error', service: 'Database', message: 'Failed to execute query: SELECT * FROM users' },
  { id: 4, timestamp: new Date(Date.now() - 60000).toISOString(), level: 'info', service: 'Admin', message: 'Admin admin@bvote.com blocked user user2@example.com.' },
  { id: 5, timestamp: new Date(Date.now() - 120000).toISOString(), level: 'debug', service: 'API', message: 'Request received: GET /api/users' },
  { id: 6, timestamp: new Date(Date.now() - 300000).toISOString(), level: 'info', service: 'Realtime', message: 'Command `request.verify` sent to user_xyz.' },
];

const mockGetLogs = async () => {
    console.log('--- MOCK GET LOGS ---');
    return new Promise(resolve => setTimeout(() => resolve(mockLogs), 500));
};

const realGetLogs = async () => {
    return apiClient.get('/admin/logs');
};

export const logService = {
    getLogs: USE_MOCK ? mockGetLogs : realGetLogs,
};