const contests = [
    {
        id: 'giong-hat-vang-2025',
        title: 'Giọng Hát Vàng 2025',
        description: 'Cuộc thi tìm kiếm tài năng âm nhạc hàng đầu Việt Nam. Nơi những giọng ca xuất sắc nhất tranh tài để giành ngôi vị quán quân.',
        banner: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=1200&auto=format&fit=crop',
        startDate: '2025-09-01T00:00:00Z',
        endDate: '2025-11-30T23:59:59Z',
        status: 'active',
    },
    {
        id: 'vu-dieu-hoan-hao-2025',
        title: 'Vũ Điệu Hoàn Hảo 2025',
        description: 'Sân chơi dành cho những vũ công tài năng, nơi các bước nhảy điêu luyện và sự sáng tạo được tôn vinh.',
        banner: 'https://images.unsplash.com/photo-1504704064033-8832a81900a6?q=80&w=1200&auto=format&fit=crop',
        startDate: '2025-09-15T00:00:00Z',
        endDate: '2025-12-15T23:59:59Z',
        status: 'active',
    },
];

const contestants = [
    { id: 'ts001', contestId: 'giong-hat-vang-2025', name: 'Nguyễn An', bio: 'Giọng ca đầy nội lực đến từ Hà Nội, hứa hẹn mang đến những màn trình diễn bùng nổ.', votes: 125890, avatar: 'https://images.unsplash.com/photo-1548543898-c5041289d200?q=80&w=400&auto=format&fit=crop' },
    { id: 'ts002', contestId: 'giong-hat-vang-2025', name: 'Trần Cường', bio: 'Chàng trai có chất giọng ngọt ngào, chuyên trị những bản ballad sâu lắng.', votes: 98567, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop' },
    { id: 'ts003', contestId: 'vu-dieu-hoan-hao-2025', name: 'Lê Bình', bio: 'Nữ vũ công với những bước nhảy hiphop mạnh mẽ và đầy lôi cuốn.', votes: 110234, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400&auto=format&fit=crop' },
    { id: 'ts004', contestId: 'vu-dieu-hoan-hao-2025', name: 'Phạm Dung', bio: 'Bậc thầy popping với kỹ thuật đỉnh cao và khả năng biểu cảm tuyệt vời.', votes: 85432, avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=400&auto=format&fit=crop' },
    { id: 'ts005', contestId: 'giong-hat-vang-2025', name: 'Võ Hùng', bio: 'Chàng rocker với phong cách trình diễn máu lửa và giọng hát khàn đặc trưng.', votes: 75123, avatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?q=80&w=400&auto=format&fit=crop' },
    { id: 'ts006', contestId: 'giong-hat-vang-2025', name: 'Mai Lan', bio: 'Sở hữu giọng hát trong trẻo, Mai Lan là một ẩn số thú vị của cuộc thi.', votes: 68345, avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop' },
    { id: 'ts007', contestId: 'vu-dieu-hoan-hao-2025', name: 'Hoàng Quân', bio: 'Vũ công đương đại với những màn trình diễn đầy cảm xúc và kỹ thuật.', votes: 95123, avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=400&auto=format&fit=crop' },
    { id: 'ts008', contestId: 'giong-hat-vang-2025', name: 'Thanh Trúc', bio: 'Giọng ca Jazz đầy quyến rũ, mang đến một làn gió mới cho cuộc thi.', votes: 89765, avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=400&auto=format&fit=crop' },
    { id: 'ts009', contestId: 'vu-dieu-hoan-hao-2025', name: 'Minh Khang', bio: 'Chuyên gia breakdance với những động tác khó và đầy năng lượng.', votes: 78901, avatar: 'https://images.unsplash.com/photo-1521119989659-a83eee488004?q=80&w=400&auto=format&fit=crop' },
    { id: 'ts010', contestId: 'giong-hat-vang-2025', name: 'Bảo Anh', bio: 'Ca sĩ trẻ với phong cách R&B hiện đại và khả năng sáng tác tốt.', votes: 102345, avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=400&auto=format&fit=crop' },
];

const leaderboard = [
    { id: 'ts001', rank: 1, name: 'Nguyễn An', votes: 125890, avatar: 'https://images.unsplash.com/photo-1548543898-c5041289d200?q=80&w=400&auto=format&fit=crop', contestId: 'giong-hat-vang-2025' },
    { id: 'ts003', rank: 2, name: 'Lê Bình', votes: 110234, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400&auto=format&fit=crop', contestId: 'vu-dieu-hoan-hao-2025' },
    { id: 'ts010', rank: 3, name: 'Bảo Anh', votes: 102345, avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=400&auto=format&fit=crop', contestId: 'giong-hat-vang-2025' },
    { id: 'ts002', rank: 4, name: 'Trần Cường', votes: 98567, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop', contestId: 'giong-hat-vang-2025' },
    { id: 'ts007', rank: 5, name: 'Hoàng Quân', votes: 95123, avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=400&auto=format&fit=crop', contestId: 'vu-dieu-hoan-hao-2025' },
];

const userProfile = {
    id: 'user-123',
    email: 'user@bvote.com',
    name: 'Người dùng Mẫu',
    avatar: 'https://i.pravatar.cc/150?u=user-123',
    phone: '0987654321',
    kycStatus: 'unverified', // 'unverified', 'pending', 'verified', 'rejected'
    role: 'user',
    voteQuota: {
        daily: 10,
        used: 2,
        total: 100
    }
};

const voteHistory = [
    {
        id: 'vh001',
        contestantId: 'ts001',
        contestantName: 'Nguyễn An',
        contestName: 'Giọng Hát Vàng 2025',
        votes: 5,
        timestamp: '2025-08-26T10:00:00Z',
    },
    {
        id: 'vh002',
        contestantId: 'ts003',
        contestantName: 'Lê Bình',
        contestName: 'Vũ Điệu Hoàn Hảo 2025',
        votes: 3,
        timestamp: '2025-08-25T15:30:00Z',
    },
];

export const mockData = {
    contests,
    contestants,
    leaderboard,
    userProfile,
    voteHistory,
};