import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '@/context/AuthContext'; 
import toast from 'react-hot-toast';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const { isAuthenticated } = useAuth();

    useEffect(() => {
        const useMock = import.meta.env.VITE_USE_MOCK === '1';

        if (useMock) {
            setIsConnected(true);
            return;
        }

        if (isAuthenticated) {
            const token = localStorage.getItem('jwt_token');
            if (!token) return;

            const newSocket = io(import.meta.env.VITE_SOCKET_URL, {
                query: { token }
            });

            setSocket(newSocket);

            newSocket.on('connect', () => setIsConnected(true));
            newSocket.on('disconnect', () => setIsConnected(false));
            
            return () => {
                newSocket.disconnect();
            };
        } else if (!isAuthenticated && socket) {
            socket.disconnect();
            setSocket(null);
            setIsConnected(false);
        }
    }, [isAuthenticated]);

    const value = { socket, isConnected };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};