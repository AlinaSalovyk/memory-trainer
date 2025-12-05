const STORAGE_KEY = 'memoryTrainerData';

const defaultData = {
    profile: {
        name: 'Гравець',
        theme: 'light',
        createdAt: new Date().toISOString(),
        accessibility: {
            highContrast: false,
            animationsEnabled: true,
            soundEnabled: true,
            fontSize: 'normal',
        }
    },
    records: {
        memoryCards: {
            easy: { bestTime: null, bestMoves: null },
            medium: { bestTime: null, bestMoves: null },
            hard: { bestTime: null, bestMoves: null }
        },
        focusClicker: {
            bestAvgReaction: null,
            bestScore: null
        },
        numberSequence: {
            longestSequence: null,
            bestAccuracy: null
        },
        simonSays: {
            longestSequence: null
        },
        patternGrid: {
            highestLevel: null
        },
        wordRecall: {
            bestStreak: null
        },
        focusAvoider: {
            longestSurvival: null,
            bestAccuracy: null
        },
        dualTask: {
            bestBalance: null
        }
    },
    badges: [],
    sessions: [],
    stats: {
        totalGamesPlayed: 0,
        totalPlayTime: 0,
        favoriteGame: null
    }
};

class StorageService {
    constructor() {
        this.initializeStorage();
    }

    // Ініціалізація сховища
    initializeStorage() {
        const existingData = this.loadData();
        if (!existingData) {
            this.saveData(defaultData);
        }
    }

    loadData() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Помилка завантаження даних:', error);
            return null;
        }
    }

    saveData(data) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Помилка збереження даних:', error);
            return false;
        }
    }

    getProfile() {
        const data = this.loadData();
        return data?.profile || defaultData.profile;
    }

    updateProfile(updates) {
        const data = this.loadData();
        data.profile = { ...data.profile, ...updates };
        this.saveData(data);
        return data.profile;
    }

    getRecords() {
        const data = this.loadData();
        return data?.records || defaultData.records;
    }

    updateRecord(gameId, level, newRecord) {
        const data = this.loadData();

        if (level) {
            if (!data.records[gameId][level]) {
                data.records[gameId][level] = {};
            }
            data.records[gameId][level] = {
                ...data.records[gameId][level],
                ...newRecord
            };
        } else {
            data.records[gameId] = {
                ...data.records[gameId],
                ...newRecord
            };
        }

        this.saveData(data);
        return data.records[gameId];
    }

    addSession(session) {
        const data = this.loadData();
        const sessionWithDate = {
            ...session,
            date: new Date().toISOString(),
            id: Date.now()
        };

        data.sessions.unshift(sessionWithDate);

        if (data.sessions.length > 100) {
            data.sessions = data.sessions.slice(0, 100);
        }

        data.stats.totalGamesPlayed += 1;
        if (session.duration) {
            data.stats.totalPlayTime += session.duration;
        }

        this.saveData(data);
        return sessionWithDate;
    }

    getSessions(gameId = null, limit = 50) {
        const data = this.loadData();
        let sessions = data?.sessions || [];

        if (gameId) {
            sessions = sessions.filter(s => s.gameId === gameId);
        }

        return sessions.slice(0, limit);
    }

    addBadge(badgeId) {
        const data = this.loadData();
        const existingBadge = data.badges.find(b => b.id === badgeId);

        if (!existingBadge) {
            data.badges.push({
                id: badgeId,
                earnedAt: new Date().toISOString()
            });
            this.saveData(data);
            return true;
        }

        return false;
    }

    getBadges() {
        const data = this.loadData();
        return data?.badges || [];
    }

    hasBadge(badgeId) {
        const badges = this.getBadges();
        return badges.some(b => b.id === badgeId);
    }

    getStats() {
        const data = this.loadData();
        return data?.stats || defaultData.stats;
    }

    clearAllData() {
        try {
            localStorage.removeItem(STORAGE_KEY);
            this.initializeStorage();
            return true;
        } catch (error) {
            console.error('Помилка очищення даних:', error);
            return false;
        }
    }

    exportData() {
        const data = this.loadData();
        return JSON.stringify(data, null, 2);
    }

    importData(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            this.saveData(data);
            return true;
        } catch (error) {
            console.error('Помилка імпорту даних:', error);
            return false;
        }
    }
}

const storageService = new StorageService();
export default storageService;