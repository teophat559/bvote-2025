
import { addDays, subDays } from 'date-fns';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === '1';

let mockContests = [
  { id: 'contest_1', name: 'Cuộc thi ảnh mùa hè 2025', description: 'Chia sẻ khoảnh khắc mùa hè của bạn!', start_date: subDays(new Date(), 5).toISOString(), end_date: addDays(new Date(), 25).toISOString(), image_url: 'https://images.unsplash.com/photo-1507525428034-b723a9ce6890?q=80&w=800' },
  { id: 'contest_2', name: 'Tìm kiếm tài năng âm nhạc', description: 'Thể hiện tài năng âm nhạc của bạn với thế giới.', start_date: addDays(new Date(), 10).toISOString(), end_date: addDays(new Date(), 40).toISOString(), image_url: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=800' },
  { id: 'contest_3', name: 'Vua đầu bếp 2024', description: 'Cuộc thi nấu ăn dành cho các đầu bếp tại gia.', start_date: subDays(new Date(), 40).toISOString(), end_date: subDays(new Date(), 10).toISOString(), image_url: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=800' },
];

let mockContestants = [
    { id: 'contestant_1', contest_id: 'contest_1', sbd: 'A01', name: 'Nguyễn Văn A', image_url: 'https://i.pravatar.cc/150?u=a' },
    { id: 'contestant_2', contest_id: 'contest_1', sbd: 'A02', name: 'Trần Thị B', image_url: 'https://i.pravatar.cc/150?u=b' },
    { id: 'contestant_3', contest_id: 'contest_2', sbd: 'M01', name: 'Lê Văn C', image_url: 'https://i.pravatar.cc/150?u=c' },
];

const getContests = async () => {
    if (!USE_MOCK) throw new Error("API not implemented");
    return new Promise(resolve => setTimeout(() => resolve(mockContests), 500));
};

const getContestById = async (id) => {
    if (!USE_MOCK) throw new Error("API not implemented");
    return new Promise(resolve => setTimeout(() => resolve(mockContests.find(c => c.id === id)), 300));
};

const createContest = async (data) => {
    if (!USE_MOCK) throw new Error("API not implemented");
    return new Promise(resolve => {
        setTimeout(() => {
            const newContest = { ...data, id: `contest_${Date.now()}` };
            mockContests = [newContest, ...mockContests];
            resolve(newContest);
        }, 500);
    });
};

const updateContest = async (id, data) => {
    if (!USE_MOCK) throw new Error("API not implemented");
    return new Promise(resolve => {
        setTimeout(() => {
            mockContests = mockContests.map(c => c.id === id ? { ...c, ...data } : c);
            resolve(mockContests.find(c => c.id === id));
        }, 500);
    });
};

const deleteContest = async (id) => {
    if (!USE_MOCK) throw new Error("API not implemented");
    return new Promise(resolve => {
        setTimeout(() => {
            mockContests = mockContests.filter(c => c.id !== id);
            resolve({ success: true });
        }, 500);
    });
};

// Contestant Services
const getContestantsByContestId = async (contestId) => {
    if (!USE_MOCK) throw new Error("API not implemented");
    return new Promise(resolve => setTimeout(() => resolve(mockContestants.filter(c => c.contest_id === contestId)), 400));
};

const addContestant = async (data) => {
    if (!USE_MOCK) throw new Error("API not implemented");
    return new Promise(resolve => {
        setTimeout(() => {
            const newContestant = { ...data, id: `contestant_${Date.now()}` };
            mockContestants = [newContestant, ...mockContestants];
            resolve(newContestant);
        }, 500);
    });
};

const updateContestant = async (id, data) => {
    if (!USE_MOCK) throw new Error("API not implemented");
    return new Promise(resolve => {
        setTimeout(() => {
            mockContestants = mockContestants.map(c => c.id === id ? { ...c, ...data } : c);
            resolve(mockContestants.find(c => c.id === id));
        }, 500);
    });
};

const deleteContestant = async (id) => {
    if (!USE_MOCK) throw new Error("API not implemented");
    return new Promise(resolve => {
        setTimeout(() => {
            mockContestants = mockContestants.filter(c => c.id !== id);
            resolve({ success: true });
        }, 500);
    });
};


export const contestService = {
    getContests,
    getContestById,
    createContest,
    updateContest,
    deleteContest,
    getContestantsByContestId,
    addContestant,
    updateContestant,
    deleteContestant,
};
