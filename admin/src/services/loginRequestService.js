const USE_MOCK = import.meta.env.VITE_USE_MOCK === '1';

const mockRequests = [
    {
        id: 'req_1',
        platform: 'Facebook',
        account: 'user_fb_01@test.com',
        password: 'password123',
        status: 'success',
        log: 'Đăng nhập thành công, đã lưu cookies.',
        last_updated: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    },
    {
        id: 'req_2',
        platform: 'Google',
        account: 'user_gg_02@test.com',
        password: 'securepassword',
        status: 'need_otp',
        log: 'Yêu cầu mã xác thực 2 yếu tố (OTP).',
        last_updated: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    },
    {
        id: 'req_3',
        platform: 'Instagram',
        account: 'insta_user_03',
        password: 'instapassword',
        status: 'failed',
        log: 'Sai mật khẩu. Vui lòng thử lại.',
        last_updated: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    },
    {
        id: 'req_4',
        platform: 'Facebook',
        account: 'user_fb_04@test.com',
        password: 'newpassword',
        status: 'pending',
        log: null,
        last_updated: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    },
    {
        id: 'req_5',
        platform: 'Google',
        account: 'user_gg_05@test.com',
        password: 'googlepass',
        status: 'processing',
        log: 'Đang mở profile Chrome...',
        last_updated: new Date(Date.now() - 1000 * 20).toISOString(),
    },
    {
        id: 'req_6',
        platform: 'Facebook',
        account: 'checkpoint_user@test.com',
        password: 'checkpoint_pass',
        status: 'checkpoint',
        log: 'Tài khoản bị checkpoint. Yêu cầu xác minh danh tính.',
        last_updated: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    }
];

export const loginRequestService = {
    getRequests: async () => {
        if (USE_MOCK) {
            return new Promise(resolve => setTimeout(() => resolve(mockRequests), 500));
        }
        throw new Error("Real API for login requests not implemented.");
    },

    createRequest: async (data) => {
        if (USE_MOCK) {
            return new Promise(resolve => {
                const newRequest = {
                    id: `req_${Date.now()}`,
                    ...data,
                    password: data.password || 'default_mock_pass',
                    status: 'pending',
                    log: 'Yêu cầu đã được tạo.',
                    last_updated: new Date().toISOString(),
                };
                mockRequests.unshift(newRequest);
                setTimeout(() => resolve(newRequest), 500);
            });
        }
        throw new Error("Real API for creating login request not implemented.");
    },
};