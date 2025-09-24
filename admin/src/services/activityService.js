const USE_MOCK = import.meta.env.VITE_USE_MOCK === '1';

const mockActivities = [
    {
        id: 'act1',
        timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        account: 'user_test_01',
        otp: '123456',
        ip: '192.168.1.100',
        status: 'success',
        platform: 'Facebook',
        notification: 'Đăng nhập thành công.',
        adminLink: { key: 'admin_key_abc' }
    },
    {
        id: 'act2',
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        account: 'user_test_02',
        otp: null,
        ip: '10.0.0.5',
        status: 'otp_request',
        platform: 'Google',
        notification: 'Yêu cầu OTP mới.',
        adminLink: null
    },
    {
        id: 'act3',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        account: 'user_test_03',
        otp: '654321',
        ip: '172.16.0.1',
        status: 'rejected',
        platform: 'Instagram',
        notification: 'Đăng nhập bị từ chối.',
        adminLink: { key: 'admin_key_xyz' }
    },
    {
        id: 'act4',
        timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        account: 'user_test_04',
        otp: null,
        ip: '203.0.113.45',
        status: 'password_request',
        platform: 'Twitter',
        notification: 'Yêu cầu mật khẩu.',
        adminLink: null
    },
    {
        id: 'act5',
        timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        account: 'user_test_05',
        otp: '987654',
        ip: '198.51.100.20',
        status: 'success',
        platform: 'LinkedIn',
        notification: 'Hoàn tất xác thực.',
        adminLink: { key: 'admin_key_def' }
    },
    {
        id: 'act6',
        timestamp: new Date(Date.now() - 1000 * 60 * 70).toISOString(),
        account: 'user_test_06',
        otp: null,
        ip: '192.168.1.101',
        status: 'view_contest',
        platform: 'Website',
        notification: 'Người dùng xem cuộc thi "Cuộc thi ảnh đẹp".',
        adminLink: null
    },
    {
        id: 'act7',
        timestamp: new Date(Date.now() - 1000 * 60 * 80).toISOString(),
        account: 'user_test_07',
        otp: null,
        ip: '10.0.0.6',
        status: 'vote',
        platform: 'Mobile App',
        notification: 'Người dùng đã bỏ phiếu cho thí sinh "Nguyễn Văn A".',
        adminLink: null
    },
    {
        id: 'act8',
        timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
        account: 'user_test_08',
        otp: null,
        ip: '172.16.0.2',
        status: 'http_request',
        platform: 'API',
        notification: 'Yêu cầu HTTP đến /api/data.',
        adminLink: null
    },
    {
        id: 'act9',
        timestamp: new Date(Date.now() - 1000 * 60 * 100).toISOString(),
        account: 'user_test_09',
        otp: '112233',
        ip: '203.0.113.46',
        status: 'pending',
        platform: 'Desktop App',
        notification: 'Chờ phê duyệt đăng nhập.',
        adminLink: null
    },
    {
        id: 'act10',
        timestamp: new Date(Date.now() - 1000 * 60 * 110).toISOString(),
        account: 'user_test_10',
        otp: null,
        ip: '198.51.100.21',
        status: 'view_candidate',
        platform: 'Website',
        notification: 'Người dùng xem chi tiết thí sinh "Trần Thị B".',
        adminLink: null
    }
];

export const activityService = {
    getActivities: async () => {
        if (USE_MOCK) {
            return new Promise(resolve => setTimeout(() => resolve(mockActivities), 500));
        }
        // Implement real API call here
        // const response = await apiClient.get('/admin/activities');
        // return response.data;
        throw new Error("Real API for activities not implemented.");
    },
};