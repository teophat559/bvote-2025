import { v4 as uuidv4 } from 'uuid';

let accessLogs = [
    {
        id: uuidv4(),
        created_at: new Date().toISOString(),
        platform: 'Facebook',
        identifier: 'user_fb_1@email.com',
        ip: '192.168.1.1',
        status: 'pending',
        otp_config: null
    },
    {
        id: uuidv4(),
        created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        platform: 'Google',
        identifier: 'user_gg_2@email.com',
        ip: '10.0.0.2',
        status: 'approved',
        otp_config: null
    },
    {
        id: uuidv4(),
        created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        platform: 'Instagram',
        identifier: 'insta_user_3',
        ip: '172.16.0.3',
        status: 'rejected',
        otp_config: null
    },
    {
        id: uuidv4(),
        created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        platform: 'Facebook',
        identifier: 'another_fb@email.com',
        ip: '192.168.1.4',
        status: 'otp_requested',
        otp_config: { method: 'email' }
    },
];

const simulateDelay = (ms) => new Promise(res => setTimeout(res, ms));

export const accessLogService = {
    getAccessLogs: async () => {
        await simulateDelay(500);
        return [...accessLogs].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    },

    updateAccessLogStatus: async (id, status) => {
        await simulateDelay(300);
        const logIndex = accessLogs.findIndex(log => log.id === id);
        if (logIndex !== -1) {
            accessLogs[logIndex].status = status;
            return accessLogs[logIndex];
        }
        throw new Error('Log not found');
    },

    saveOtpConfig: async (id, otpConfig) => {
        await simulateDelay(300);
        const logIndex = accessLogs.findIndex(log => log.id === id);
        if (logIndex !== -1) {
            accessLogs[logIndex].otp_config = otpConfig;
            accessLogs[logIndex].status = 'otp_requested';
            return accessLogs[logIndex];
        }
        throw new Error('Log not found');
    }
};