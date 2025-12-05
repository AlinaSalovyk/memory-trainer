import storageService from './storageService';

class AnalyticsService {
    calculateMemoryLevel() {
        const records = storageService.getRecords();
        const sessions = storageService.getSessions(null, 20);

        if (sessions.length === 0) return 0;

        let totalScore = 0;
        let factors = 0;

        if (records.memoryCards.hard.bestMoves) {
            const cardScore = Math.max(0, 100 - (records.memoryCards.hard.bestMoves - 32) * 2);
            totalScore += cardScore;
            factors++;
        }

        if (records.focusClicker.bestAvgReaction) {
            const reactionScore = Math.max(0, 100 - (records.focusClicker.bestAvgReaction - 200) / 3);
            totalScore += reactionScore;
            factors++;
        }

        if (records.numberSequence.longestSequence) {
            const sequenceScore = Math.min(100, records.numberSequence.longestSequence * 10);
            totalScore += sequenceScore;
            factors++;
        }

        if (records.simonSays.longestSequence) {
            const simonScore = Math.min(100, records.simonSays.longestSequence * 5);
            totalScore += simonScore;
            factors++;
        }

        const averageScore = factors > 0 ? totalScore / factors : 0;
        return Math.round(Math.min(100, Math.max(0, averageScore)));
    }

    getGameStats(gameId) {
        const sessions = storageService.getSessions(gameId);

        if (sessions.length === 0) {
            return {
                gamesPlayed: 0,
                averageScore: 0,
                totalPlayTime: 0,
                trend: 'neutral'
            };
        }

        const gamesPlayed = sessions.length;
        const totalPlayTime = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);

        let averageScore = 0;
        switch (gameId) {
            case 'focusClicker':
                averageScore = this.calculateAverage(sessions.map(s => s.avgReaction));
                break;
            case 'memoryCards':
                averageScore = this.calculateAverage(sessions.map(s => s.moves));
                break;
            case 'numberSequence':
                averageScore = this.calculateAverage(sessions.map(s => s.longestSequence));
                break;
            case 'simonSays':
                averageScore = this.calculateAverage(sessions.map(s => s.longestSequence));
                break;
            default:
                averageScore = 0;
        }

        const trend = this.calculateTrend(sessions, gameId);

        return {
            gamesPlayed,
            averageScore: Math.round(averageScore),
            totalPlayTime,
            trend
        };
    }

    getProgressChartData(gameId, metric, days = 30) {
        const sessions = storageService.getSessions(gameId);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        const recentSessions = sessions.filter(s =>
            new Date(s.date) >= cutoffDate
        );

        const dailyData = {};

        recentSessions.forEach(session => {
            const date = new Date(session.date).toISOString().split('T')[0];

            if (!dailyData[date]) {
                dailyData[date] = {
                    date,
                    values: []
                };
            }

            if (session[metric] !== undefined) {
                dailyData[date].values.push(session[metric]);
            }
        });

        return Object.values(dailyData).map(day => ({
            date: day.date,
            value: this.calculateAverage(day.values)
        })).sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    getOverallStats() {
        const stats = storageService.getStats();
        const badges = storageService.getBadges();
        const sessions = storageService.getSessions();
        const memoryLevel = this.calculateMemoryLevel();

        const gameCounts = {};
        sessions.forEach(s => {
            gameCounts[s.gameId] = (gameCounts[s.gameId] || 0) + 1;
        });

        const favoriteGame = Object.entries(gameCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

        const avgSessionTime = sessions.length > 0
            ? Math.round(stats.totalPlayTime / sessions.length)
            : 0;

        return {
            totalGamesPlayed: stats.totalGamesPlayed,
            totalPlayTime: stats.totalPlayTime,
            totalBadges: badges.length,
            memoryLevel,
            favoriteGame,
            avgSessionTime,
            streak: this.calculateStreak(sessions)
        };
    }


    calculateStreak(sessions) {
        if (sessions.length === 0) return 0;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const dates = sessions.map(s => {
            const d = new Date(s.date);
            d.setHours(0, 0, 0, 0);
            return d.getTime();
        });

        const uniqueDates = [...new Set(dates)].sort((a, b) => b - a);

        let streak = 0;
        let expectedDate = today.getTime();

        for (const date of uniqueDates) {
            if (date === expectedDate) {
                streak++;
                expectedDate -= 86400000;
            } else if (date < expectedDate) {
                break;
            }
        }

        return streak;
    }

    calculateAverage(values) {
        const validValues = values.filter(v => v !== null && v !== undefined);
        if (validValues.length === 0) return 0;
        return validValues.reduce((sum, v) => sum + v, 0) / validValues.length;
    }

    calculateTrend(sessions, gameId) {
        if (sessions.length < 6) return 'neutral';

        const recent = sessions.slice(0, 5);
        const previous = sessions.slice(5, 10);

        let metricKey;
        switch (gameId) {
            case 'focusClicker':
                metricKey = 'avgReaction';
                break;
            case 'memoryCards':
                metricKey = 'moves';
                break;
            default:
                metricKey = 'longestSequence';
        }

        const recentAvg = this.calculateAverage(recent.map(s => s[metricKey]));
        const previousAvg = this.calculateAverage(previous.map(s => s[metricKey]));

        const lowerIsBetter = ['avgReaction', 'moves'].includes(metricKey);

        const improvement = lowerIsBetter
            ? previousAvg - recentAvg
            : recentAvg - previousAvg;

        if (improvement > 5) return 'up';
        if (improvement < -5) return 'down';
        return 'neutral';
    }

    getMemoryLevelHistory(days = 30) {
        const sessions = storageService.getSessions();
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        const recentSessions = sessions.filter(s =>
            new Date(s.date) >= cutoffDate
        );

        const weeklyData = {};

        recentSessions.forEach(session => {
            const date = new Date(session.date);
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            const weekKey = weekStart.toISOString().split('T')[0];

            if (!weeklyData[weekKey]) {
                weeklyData[weekKey] = [];
            }
            weeklyData[weekKey].push(session);
        });

        return Object.entries(weeklyData).map(([date, sessions]) => ({
            date,
            level: this.calculateMemoryLevel() // Спрощено - в реальності потрібно рахувати для кожної точки
        })).sort((a, b) => new Date(a.date) - new Date(b.date));
    }
}

const analyticsService = new AnalyticsService();
export default analyticsService;