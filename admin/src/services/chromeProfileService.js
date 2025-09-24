const USE_MOCK = import.meta.env.VITE_USE_MOCK === '1';

let mockProfiles = [
    { id: 'profile1', name: 'Profile A', status: 'running', last_activity: new Date(Date.now() - 1000 * 60 * 10).toISOString(), user_id: 'admin1', cookie: 'session_id=123abcde; user_id=profile1; path=/;' },
    { id: 'profile2', name: 'Profile B', status: 'stopped', last_activity: new Date(Date.now() - 1000 * 60 * 60).toISOString(), user_id: 'admin1', cookie: null },
    { id: 'profile3', name: 'Profile C', status: 'error', last_activity: new Date(Date.now() - 1000 * 60 * 120).toISOString(), user_id: 'admin1', cookie: null },
];

export const chromeProfileService = {
    getProfiles: async (userId) => {
        if (USE_MOCK) {
            return new Promise(resolve => setTimeout(() => resolve(mockProfiles.filter(p => p.user_id === userId)), 500));
        }
        // Implement real API call here
        // const response = await apiClient.get(`/admin/chrome-profiles?userId=${userId}`);
        // return response.data;
        throw new Error("Real API for chrome profiles not implemented.");
    },

    createProfile: async (profileData) => {
        if (USE_MOCK) {
            return new Promise(resolve => {
                const newProfile = {
                    id: `profile${mockProfiles.length + 1}`,
                    name: profileData.name,
                    status: 'stopped',
                    last_activity: new Date().toISOString(),
                    user_id: profileData.user_id,
                    cookie: null,
                };
                mockProfiles.push(newProfile);
                setTimeout(() => resolve({data: newProfile, error: null}), 500);
            });
        }
        // Implement real API call here
        // const response = await apiClient.post('/admin/chrome-profiles', profileData);
        // return response.data;
        throw new Error("Real API for creating chrome profile not implemented.");
    },

    updateProfile: async (profileId, updateData) => {
        if (USE_MOCK) {
            return new Promise((resolve, reject) => {
                const index = mockProfiles.findIndex(p => p.id === profileId);
                if (index > -1) {
                    mockProfiles[index] = { ...mockProfiles[index], ...updateData };
                    setTimeout(() => resolve(mockProfiles[index]), 500);
                } else {
                    setTimeout(() => reject(new Error('Profile not found')), 500);
                }
            });
        }
        // Implement real API call here
        // const response = await apiClient.patch(`/admin/chrome-profiles/${profileId}`, updateData);
        // return response.data;
        throw new Error("Real API for updating chrome profile not implemented.");
    },

    deleteProfile: async (profileId) => {
        if (USE_MOCK) {
            return new Promise((resolve, reject) => {
                const initialLength = mockProfiles.length;
                mockProfiles = mockProfiles.filter(p => p.id !== profileId);
                if (mockProfiles.length < initialLength) {
                    setTimeout(() => resolve(), 500);
                } else {
                    setTimeout(() => reject(new Error('Profile not found')), 500);
                }
            });
        }
        // Implement real API call here
        // const response = await apiClient.delete(`/admin/chrome-profiles/${profileId}`);
        // return response.data;
        throw new Error("Real API for deleting chrome profile not implemented.");
    },
};