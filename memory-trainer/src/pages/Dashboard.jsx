import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout.jsx';
import Card from '../components/ui/Card.jsx';
import analyticsService from '../services/analyticsService.js';
import storageService from '../services/storageService.js';
import {
    FaGamepad,
    FaRegClock,
    FaFire,
    FaMedal,
    FaRegClone,
    FaBolt,
    FaListOl,
    FaPalette,
    FaTableCells,
    FaRegFileLines,
    FaBullseye,
    FaScaleBalanced
} from 'react-icons/fa6';
import { HiChartBar, HiTrophy } from 'react-icons/hi2';

function Dashboard() {
    const [overallStats, setOverallStats] = useState(null);
    const [recentSessions, setRecentSessions] = useState([]);
    const [selectedGame, setSelectedGame] = useState('all');

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = () => {
        setOverallStats(analyticsService.getOverallStats());
        setRecentSessions(storageService.getSessions(null, 10));
    };

    const GAME_NAMES = {
        'memory-cards': 'Memory Cards',
        'focus-clicker': 'Focus Clicker',
        'number-sequence': 'Number Sequence',
        'simon-says': 'Simon Says',
        'pattern-grid': 'Pattern Memory',
        'word-recall': 'Word Recall',
        'focus-avoider': 'Focus Avoid',
        'dual-task': 'Dual Task'
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

        if (diffInDays === 0) return 'Сьогодні';
        if (diffInDays === 1) return 'Вчора';
        if (diffInDays < 7) return `${diffInDays} днів тому`;

        return date.toLocaleDateString('uk-UA', {
            day: 'numeric',
            month: 'short'
        });
    };

    const formatTime = (seconds) => {
        if (!seconds) return '—';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return mins > 0 ? `${mins}хв ${secs}с` : `${secs}с`;
    };

    if (!overallStats) {
        return (
            <Layout>
                <div className="text-center py-20">
                    <HiChartBar className="text-6xl mb-4 mx-auto text-theme-secondary opacity-50" />
                    <p className="text-theme-secondary">Завантаження статистики...</p>
                </div>
            </Layout>
        );
    }

    const filteredSessions = selectedGame === 'all'
        ? recentSessions
        : recentSessions.filter(s => s.gameId === selectedGame);

    return (
        <Layout>
            <div className="max-w-7xl mx-auto">
                <h1 className="text-4xl font-bold text-theme-primary mb-2">
                    Статистика та Аналітика
                </h1>
                <p className="text-theme-secondary mb-8">
                    Відстежуйте свій прогрес та досягнення
                </p>

                <Card
                    className="mb-8 text-white"
                    style={{ background: 'var(--gradient-primary)' }}
                >
                    <div className="flex flex-col md:flex-row items-center justify-between">
                        <div>
                            <h2 className="text-3xl font-bold mb-2">Рівень Пам'яті</h2>
                            <p className="text-white text-opacity-90">
                                Комплексний показник ваших когнітивних навичок
                            </p>
                        </div>
                        <div className="mt-4 md:mt-0">
                            <div className="w-32 h-32 rounded-full border-8 border-white border-opacity-30 flex items-center justify-center">
                                <div className="text-5xl font-bold">{overallStats.memoryLevel}</div>
                            </div>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-6 w-full h-4 bg-white bg-opacity-20 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-white transition-all duration-500"
                            style={{ width: `${overallStats.memoryLevel}%` }}
                        />
                    </div>
                </Card>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
                    <Card className="text-center">
                        <FaGamepad className="text-4xl mb-2 mx-auto text-theme-primary opacity-70" />
                        <div className="text-3xl font-bold mb-1" style={{ color: 'var(--accent-primary)' }}>
                            {overallStats.totalGamesPlayed}
                        </div>
                        <div className="text-sm text-theme-secondary">
                            Всього ігор
                        </div>
                    </Card>

                    <Card className="text-center">
                        <FaRegClock className="text-4xl mb-2 mx-auto text-theme-primary opacity-70" />
                        <div className="text-3xl font-bold mb-1" style={{ color: 'var(--accent-primary)' }}>
                            {Math.floor(overallStats.totalPlayTime / 3600)}г
                        </div>
                        <div className="text-sm text-theme-secondary">
                            Загальний час
                        </div>
                    </Card>

                    <Card className="text-center">
                        <FaFire className="text-4xl mb-2 mx-auto text-theme-primary opacity-70" />
                        <div className="text-3xl font-bold mb-1" style={{ color: 'var(--accent-primary)' }}>
                            {overallStats.streak}
                        </div>
                        <div className="text-sm text-theme-secondary">
                            Днів підряд
                        </div>
                    </Card>

                    <Card className="text-center">
                        <HiTrophy className="text-4xl mb-2 mx-auto text-theme-primary opacity-70" />
                        <div className="text-3xl font-bold mb-1" style={{ color: 'var(--accent-primary)' }}>
                            {overallStats.totalBadges}
                        </div>
                        <div className="text-sm text-theme-secondary">
                            Бейджів
                        </div>
                    </Card>
                </div>

                {overallStats.favoriteGame && (
                    <Card className="mb-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-theme-primary mb-1">
                                    🎯 Улюблена гра
                                </h3>
                                <p className="text-2xl font-bold" style={{ color: 'var(--accent-primary)' }}>
                                    {GAME_NAMES[overallStats.favoriteGame] || overallStats.favoriteGame}
                                </p>
                            </div>
                            <FaMedal className="text-6xl text-theme-primary opacity-30" />
                        </div>
                    </Card>
                )}

                {/* Recent Sessions */}
                <Card>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-theme-primary">
                            Остання активність
                        </h2>

                        {/* Filter */}
                        <select
                            value={selectedGame}
                            onChange={(e) => setSelectedGame(e.target.value)}
                            className="px-4 py-2 rounded-lg border-2 border-theme bg-theme-card text-theme-primary"
                        >
                            <option value="all">Всі ігри</option>
                            {Object.entries(GAME_NAMES).map(([id, name]) => (
                                <option key={id} value={id}>{name}</option>
                            ))}
                        </select>
                    </div>

                    {filteredSessions.length === 0 ? (
                        <div className="text-center py-12">
                            <FaGamepad className="text-6xl mb-4 mx-auto text-theme-secondary opacity-50" />
                            <p className="text-theme-secondary">
                                {selectedGame === 'all'
                                    ? 'Ще немає зіграних сесій. Почніть тренування!'
                                    : 'Немає сесій для цієї гри'
                                }
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredSessions.map((session) => (
                                <div
                                    key={session.id}
                                    className="flex items-center justify-between p-4 rounded-xl bg-theme-secondary hover:bg-theme-tertiary transition-colors"
                                >
                                    <div className="flex items-center space-x-4">
                                        <div
                                            className="w-12 h-12 rounded-xl bg-opacity-10 flex items-center justify-center text-2xl"
                                            style={{
                                                backgroundColor: 'var(--accent-primary-alpha)',
                                                color: 'var(--accent-primary)'
                                            }}
                                        >
                                            {session.gameId === 'memory-cards' && <FaRegClone />}
                                            {session.gameId === 'focus-clicker' && <FaBolt />}
                                            {session.gameId === 'number-sequence' && <FaListOl />}
                                            {session.gameId === 'simon-says' && <FaPalette />}
                                            {session.gameId === 'pattern-grid' && <FaTableCells />}
                                            {session.gameId === 'word-recall' && <FaRegFileLines />}
                                            {session.gameId === 'focus-avoider' && <FaBullseye />}
                                            {session.gameId === 'dual-task' && <FaScaleBalanced />}
                                        </div>
                                        <div>
                                            <div className="font-bold text-theme-primary">
                                                {GAME_NAMES[session.gameId] || session.gameId}
                                            </div>
                                            <div className="text-sm text-theme-secondary">
                                                {formatDate(session.date)}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <div className="font-bold text-theme-primary">
                                            {session.score !== undefined && `${session.score} очок`}
                                            {session.moves !== undefined && `${session.moves} ходів`}
                                            {session.avgReaction !== undefined && `${session.avgReaction}мс`}
                                        </div>
                                        <div className="text-sm text-theme-secondary">
                                            {formatTime(session.duration)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </div>
        </Layout>
    );
}

export default Dashboard;

