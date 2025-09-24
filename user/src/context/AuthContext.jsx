import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiService } from '@/services/apiService';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(() => localStorage.getItem('jwt_token'));
    const [loading, setLoading] = useState(true);
    
    const signOut = useCallback(async () => {
        setLoading(true);
        const currentToken = localStorage.getItem('jwt_token');
        if (currentToken) {
           await apiService.logout().catch(err => console.error("Logout failed", err));
        }
        localStorage.removeItem('jwt_token');
        setToken(null);
        setUser(null);
        setLoading(false);
    }, []);

    useEffect(() => {
        const verifyTokenAndFetchUser = async () => {
            if (token) {
                try {
                    const fetchedUser = await apiService.getUserProfile();
                    setUser(fetchedUser);
                } catch (error) {
                    console.error("Token verification failed, signing out", error);
                    signOut();
                }
            }
            setLoading(false);
        };

        verifyTokenAndFetchUser();
    }, [token, signOut]);

    const updateUser = useCallback((updatedData) => {
        setUser(currentUser => {
            if (!currentUser) return null;
            const newUser = { ...currentUser, ...updatedData };
            return newUser;
        });
    }, []);

    const signIn = useCallback(async (credentials) => {
        setLoading(true);
        try {
            const response = await apiService.login(credentials);
            const { user: loggedInUser, token: newToken } = response;
            
            if (!loggedInUser || !newToken) {
                throw new Error("Thông tin đăng nhập không hợp lệ.");
            }
            localStorage.setItem('jwt_token', newToken);
            setToken(newToken);
            setUser(loggedInUser);
            return { user: loggedInUser, error: null };
        } catch (err) {
            toast.error(err.message || "Đăng nhập thất bại.");
            return { user: null, error: err.message };
        } finally {
            setLoading(false);
        }
    }, []);

    const value = {
        user,
        isAuthenticated: !!user,
        loading,
        signIn,
        signOut,
        updateUser
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};