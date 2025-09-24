// Mock Data for UserBvote
export const mockContests = [
  {
    id: 'contest-1',
    title: 'Talent Show 2025',
    description: 'Cuộc thi tài năng hàng đầu',
    status: 'active',
    banner: 'https://picsum.photos/800/400?random=1',
    contestantCount: 15,
    totalVotes: 1250
  },
  {
    id: 'contest-2',
    title: 'Beauty Pageant',
    description: 'Hoa hậu tài năng',
    status: 'voting',
    banner: 'https://picsum.photos/800/400?random=2',
    contestantCount: 20,
    totalVotes: 2100
  }
];

export const mockContestants = [
  {
    id: 'contestant-1',
    name: 'Nguyễn Văn A',
    bio: 'Tài năng âm nhạc',
    avatar: 'https://picsum.photos/200/200?random=10',
    voteCount: 150,
    rank: 1
  },
  {
    id: 'contestant-2',
    name: 'Trần Thị B',
    bio: 'Nghệ sĩ múa',
    avatar: 'https://picsum.photos/200/200?random=11',
    voteCount: 120,
    rank: 2
  }
];

export const mockUser = {
  id: 'user-1',
  name: 'Nguyễn Văn User',
  email: 'user@example.com',
  dailyVoteQuota: 10,
  usedVotesToday: 3,
  kycStatus: 'verified'
};
