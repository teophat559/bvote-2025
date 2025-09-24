import { subHours, subMinutes } from 'date-fns';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === '1';

const mockNotifications = [
    { id: 'notif_1', recipient: 'user1@example.com', message: 'Yêu cầu của bạn đã được phê duyệt.', timestamp: subMinutes(new Date(), 15).toISOString(), status: 'sent', type: 'approval' },
    { id: 'notif_2', recipient: 'user2@example.com', message: 'Mật khẩu của bạn đã được thay đổi.', timestamp: subHours(new Date(), 1).toISOString(), status: 'sent', type: 'security' },
    { id: 'notif_3', recipient: 'user3@example.com', message: 'Chào mừng đến với hệ thống!', timestamp: subHours(new Date(), 3).toISOString(), status: 'read', type: 'welcome' },
    { id: 'notif_4', recipient: 'user4@example.com', message: 'Có một bản cập nhật mới.', timestamp: subHours(new Date(), 8).toISOString(), status: 'failed', type: 'update' },
    { id: 'notif_5', recipient: 'user5@example.com', message: 'Cuộc thi ảnh sắp kết thúc.', timestamp: subHours(new Date(), 24).toISOString(), status: 'read', type: 'reminder' },
];

const getNotifications = async () => {
    if (!USE_MOCK) throw new Error("API not implemented");
    return new Promise(resolve => setTimeout(() => resolve(mockNotifications), 500));
};

export const notificationService = {
    getNotifications,
};