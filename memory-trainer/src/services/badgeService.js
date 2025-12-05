import storageService from './storageService';

export const BADGES = {
    speedster: {
        id: 'speedster',
        name: 'Швидкісний',
        description: 'Середній час реакції < 450 мс',
        icon: '⚡',
        color: '#f59e0b'
    },
    perfect_memory: {
        id: 'perfect_memory',
        name: 'Ідеальна Пам\'ять',
        description: 'Пройдено Memory Cards 8x8 менше за 150 ходів',
        icon: '🧠',
        color: '#8b5cf6'
    },
    consistent: {
        id: 'consistent',
        name: 'Послідовний',
        description: '10 правильних послідовностей поспіль',
        icon: '🎯',
        color: '#10b981'
    },
    simon_master: {
        id: 'simon_master',
        name: 'Майстер Simon',
        description: 'Послідовність ≥ 10 кроків',
        icon: '🎨',
        color: '#06b6d4'
    },
    pattern_expert: {
        id: 'pattern_expert',
        name: 'Експерт Патернів',
        description: 'Досягнуто 10 рівень у Pattern Grid',
        icon: '🔷',
        color: '#3b82f6'
    },
    word_wizard: {
        id: 'word_wizard',
        name: 'Чарівник Слів',
        description: '15 слів правильно підряд',
        icon: '📝',
        color: '#ec4899'
    },
    survivor: {
        id: 'survivor',
        name: 'Виживальник',
        description: 'Протримався 60 секунд у Focus Avoider',
        icon: '🛡️',
        color: '#ef4444'
    },
    multitasker: {
        id: 'multitasker',
        name: 'Мультизадачник',
        description: '90% балансу у Dual Task',
        icon: '⚖️',
        color: '#14b8a6'
    },
    dedicated: {
        id: 'dedicated',
        name: 'Відданий',
        description: '50 ігор зіграно',
        icon: '🏆',
        color: '#f97316'
    },
    champion: {
        id: 'champion',
        name: 'Чемпіон',
        description: 'Зібрано всі бейджі',
        icon: '👑',
        color: '#facc15'
    }
};

class BadgeService {
    checkAndAwardBadges(gameId, sessionData) {
        const earnedBadges = [];
        const records = storageService.getRecords();

        switch (gameId) {
            case 'focusClicker':
                const bestAvgReaction = records.focusClicker?.bestAvgReaction || 9999;

                if ((sessionData.avgReaction && sessionData.avgReaction <= 450) ||
                    bestAvgReaction <= 450) {
                    if (this.awardBadge('speedster')) {
                        earnedBadges.push(BADGES.speedster);
                    }
                }
                break;

            case 'memoryCards':
                const bestHardMoves = records.memoryCards?.hard?.bestMoves;

                if ((sessionData.level === 'hard' && sessionData.moves <= 150) ||
                    (bestHardMoves && bestHardMoves <= 150)) {
                    if (this.awardBadge('perfect_memory')) {
                        earnedBadges.push(BADGES.perfect_memory);
                    }
                }
                break;

            case 'numberSequence':
                if (sessionData.correctStreak && sessionData.correctStreak >= 10) {
                    if (this.awardBadge('consistent')) {
                        earnedBadges.push(BADGES.consistent);
                    }
                }
                break;

            case 'simonSays':
                const bestLongestSequence = records.simonSays?.longestSequence || 0;

                if ((sessionData.longestSequence && sessionData.longestSequence >= 10) ||
                    bestLongestSequence >= 10) {
                    if (this.awardBadge('simon_master')) {
                        earnedBadges.push(BADGES.simon_master);
                    }
                }
                break;

            case 'patternGrid':
                const highestLevel = records.patternGrid?.highestLevel || 0;

                if ((sessionData.level && sessionData.level >= 10) || highestLevel >= 10) {
                    if (this.awardBadge('pattern_expert')) {
                        earnedBadges.push(BADGES.pattern_expert);
                    }
                }
                break;

            case 'wordRecall':
                const bestStreak = records.wordRecall?.bestStreak || 0;

                if ((sessionData.correctStreak && sessionData.correctStreak >= 15) ||
                    bestStreak >= 15) {
                    if (this.awardBadge('word_wizard')) {
                        earnedBadges.push(BADGES.word_wizard);
                    }
                }
                break;

            case 'focusAvoider':
                const longestSurvival = records.focusAvoider?.longestSurvival || 0;
                if ((sessionData.survivalTime && sessionData.survivalTime >= 60) ||
                    longestSurvival >= 60) {
                    if (this.awardBadge('survivor')) {
                        earnedBadges.push(BADGES.survivor);
                    }
                }
                break;

            case 'dualTask':
                const bestBalance = records.dualTask?.bestBalance || 0;

                if ((sessionData.balanceScore && sessionData.balanceScore >= 90) || bestBalance >= 90) {
                    if (this.awardBadge('multitasker')) {
                        earnedBadges.push(BADGES.multitasker);
                    }
                }
                break;
        }

        this.checkGeneralAchievements();

        return earnedBadges;
    }

    checkGeneralAchievements() {
        const stats = storageService.getStats();
        const badges = storageService.getBadges();

        if (stats.totalGamesPlayed >= 50) {
            this.awardBadge('dedicated');
        }

        const totalBadges = Object.keys(BADGES).length;
        if (badges.length === totalBadges - 1 && !storageService.hasBadge('champion')) {
            this.awardBadge('champion');
        }
    }

    awardBadge(badgeId) {
        if (!storageService.hasBadge(badgeId)) {
            storageService.addBadge(badgeId);
            return true;
        }
        return false;
    }

    getBadgeInfo(badgeId) {
        return BADGES[badgeId] || null;
    }

    getUserBadges() {
        const userBadges = storageService.getBadges();
        return userBadges.map(ub => ({
            ...BADGES[ub.id],
            earnedAt: ub.earnedAt
        }));
    }

    getBadgeProgress() {
        const userBadges = storageService.getBadges();
        const totalBadges = Object.keys(BADGES).length;
        const earnedCount = userBadges.length;

        return {
            earned: earnedCount,
            total: totalBadges,
            percentage: Math.round((earnedCount / totalBadges) * 100)
        };
    }

    getMissingBadges() {
        const userBadges = storageService.getBadges();
        const earnedIds = userBadges.map(b => b.id);

        return Object.values(BADGES).filter(badge => !earnedIds.includes(badge.id));
    }
}

const badgeService = new BadgeService();
export default badgeService;