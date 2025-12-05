import React, { createContext, useContext, useState, useCallback } from 'react';
import storageService from '../services/storageService';
import analyticsService from '../services/analyticsService';

const ProfileContext = createContext();

export function ProfileProvider({ children }) {
    const [profile, setProfile] = useState(() => storageService.getProfile());
    const [stats, setStats] = useState(() => analyticsService.getOverallStats());
    const [badges, setBadges] = useState(() => storageService.getBadges());

    const updateName = useCallback((name) => {
        const updated = storageService.updateProfile({ name });
        setProfile(updated);
    }, []);

    const updateProfile = useCallback((updates) => {
        const updated = storageService.updateProfile(updates);
        setProfile(updated);
    }, []);

    const refreshStats = useCallback(() => {
        const newStats = analyticsService.getOverallStats();
        setStats(newStats);
    }, []);

    const refreshBadges = useCallback(() => {
        const newBadges = storageService.getBadges();
        setBadges(newBadges);
    }, []);

    const refreshAll = useCallback(() => {
        setProfile(storageService.getProfile());
        refreshStats();
        refreshBadges();
    }, [refreshStats, refreshBadges]);

    const clearAllData = useCallback(() => {
        if (window.confirm('Ви впевнені? Всі дані будуть видалені без можливості відновлення.')) {
            storageService.clearAllData();
            refreshAll();
            return true;
        }
        return false;
    }, [refreshAll]);

    const value = {
        profile,
        stats,
        badges,
        updateName,
        updateProfile,
        refreshStats,
        refreshBadges,
        refreshAll,
        clearAllData
    };

    return (
        <ProfileContext.Provider value={value}>
            {children}
        </ProfileContext.Provider>
    );
}

export function useProfile() {
    const context = useContext(ProfileContext);
    if (!context) {
        throw new Error('useProfile must be used within ProfileProvider');
    }
    return context;
}

export default ProfileContext;