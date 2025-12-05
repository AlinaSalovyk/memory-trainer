
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import Card from '../components/ui/Card';
import { useProfile } from '../contexts/ProfileContext';
import { useTheme } from '../contexts/ThemeContext';
import {
    FaRegClone,
    FaBolt,
    FaListOl,
    FaPalette,
    FaTableCells,
    FaRegFileLines,
    FaBullseye,
    FaScaleBalanced,
    FaGamepad,
    FaBrain,
    FaFire,
    FaRegHand
} from 'react-icons/fa6';
import { HiChartBar, HiTrophy, HiUser } from 'react-icons/hi2';

const GAMES = [
    {
        id: 'memory-cards',
        name: 'Memory Cards',
        description: 'Знайди всі парочки карт',
        icon: <FaRegClone />,
        color: 'from-blue-400 to-blue-600',
        difficulty: 'Легко-Важко'
    },
    {
        id: 'focus-clicker',
        name: 'Focus Clicker',
        description: 'Перевір швидкість реакції',
        icon: <FaBolt />,
        color: 'from-yellow-400 to-orange-600',
        difficulty: 'Середньо'
    },
    {
        id: 'number-sequence',
        name: 'Number Sequence',
        description: 'Запам\'ятай послідовність цифр',
        icon: <FaListOl />,
        color: 'from-green-400 to-green-600',
        difficulty: 'Середньо'
    },
    {
        id: 'simon-says',
        name: 'Simon Says',
        description: 'Повтори кольорову послідовність',
        icon: <FaPalette />,
        color: 'from-purple-400 to-purple-600',
        difficulty: 'Середньо'
    },
    {
        id: 'pattern-grid',
        name: 'Pattern Memory',
        description: 'Запам\'ятай патерн на сітці',
        icon: <FaTableCells />,
        color: 'from-cyan-400 to-cyan-600',
        difficulty: 'Важко'
    },
    {
        id: 'word-recall',
        name: 'Word Recall',
        description: 'Згадай пропущені літери',
        icon: <FaRegFileLines />,
        color: 'from-pink-400 to-pink-600',
        difficulty: 'Середньо'
    },
    {
        id: 'focus-avoider',
        name: 'Focus Avoider',
        description: 'Збирай правильні, уникай небезпечних',
        icon: <FaBullseye />,
        color: 'from-red-400 to-red-600',
        difficulty: 'Важко'
    },
    {
        id: 'dual-task',
        name: 'Dual Task',
        description: 'Виконуй дві задачі одночасно',
        icon: <FaScaleBalanced />,
        color: 'from-indigo-400 to-indigo-600',
        difficulty: 'Дуже важко'
    }
];

function Home() {
    const navigate = useNavigate();
    const { profile, stats } = useProfile();
    const { accessibility } = useTheme();

    const handleGameClick = (gameId) => {
        navigate(`/game/${gameId}`);
    };

    return (
        <Layout>
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-4xl md:text-5xl font-bold text-theme-primary mb-3 flex items-center gap-3">
                        Вітаємо, {profile.name}! <FaRegHand className="text-yellow-400" />
                    </h1>
                    <p className="text-lg text-theme-secondary">
                        Оберіть гру для тренування пам'яті та концентрації
                    </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <Card padding="md" className="text-center">
                        <FaGamepad className="text-3xl mb-2 mx-auto text-theme-primary opacity-70" />
                        <div className="text-2xl font-bold text-theme-primary">
                            {stats.totalGamesPlayed}
                        </div>
                        <div className="text-sm text-theme-secondary">
                            Ігор зіграно
                        </div>
                    </Card>

                    <Card padding="md" className="text-center">
                        <FaBrain className="text-3xl mb-2 mx-auto text-theme-primary opacity-70" />
                        <div className="text-2xl font-bold text-theme-primary">
                            {stats.memoryLevel}
                        </div>
                        <div className="text-sm text-theme-secondary">
                            Рівень пам'яті
                        </div>
                    </Card>

                    <Card padding="md" className="text-center">
                        <HiTrophy className="text-3xl mb-2 mx-auto text-theme-primary opacity-70" />
                        <div className="text-2xl font-bold text-theme-primary">
                            {stats.totalBadges}
                        </div>
                        <div className="text-sm text-theme-secondary">
                            Бейджів
                        </div>
                    </Card>

                    <Card padding="md" className="text-center">
                        <FaFire className="text-3xl mb-2 mx-auto text-theme-primary opacity-70" />
                        <div className="text-2xl font-bold text-theme-primary">
                            {stats.streak}
                        </div>
                        <div className="text-sm text-theme-secondary">
                            Днів підряд
                        </div>
                    </Card>
                </div>

                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-theme-primary mb-4">
                        Міні-ігри
                    </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {GAMES.map((game, index) => (
                        <Card
                            key={game.id}
                            padding="none"
                            hoverable
                            onClick={() => handleGameClick(game.id)}
                            className={`
                overflow-hidden cursor-pointer
                ${accessibility.animationsEnabled ? 'hover:scale-105' : ''}
              `}
                            style={{
                                animationDelay: accessibility.animationsEnabled ? `${index * 50}ms` : '0ms'
                            }}
                        >
                            {/* Game Icon Background */}
                            <div className={`h-32 bg-gradient-to-br ${game.color} flex items-center justify-center`}>
                                <div className="text-6xl text-white opacity-80">{game.icon}</div>
                            </div>

                            {/* Game Info */}
                            <div className="p-5">
                                <h3 className="text-lg font-bold text-theme-primary mb-2">
                                    {game.name}
                                </h3>
                                <p className="text-sm text-theme-secondary mb-3">
                                    {game.description}
                                </p>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs px-3 py-1 rounded-full bg-theme-tertiary text-theme-tertiary">
                                        {game.difficulty}
                                    </span>
                                    <span
                                        className="font-medium text-sm"
                                        style={{ color: 'var(--accent-primary)' }}
                                    >
                                        Грати →
                                    </span>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>

                {/* Quick Actions */}
                <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card
                        padding="md"
                        hoverable
                        onClick={() => navigate('/dashboard')}
                        className="cursor-pointer"
                    >
                        <div className="flex items-center space-x-4">
                            <div className="text-4xl text-theme-primary opacity-70"><HiChartBar /></div>
                            <div>
                                <h3 className="font-bold text-theme-primary">
                                    Переглянути статистику
                                </h3>
                                <p className="text-sm text-theme-secondary">
                                    Аналіз прогресу
                                </p>
                            </div>
                        </div>
                    </Card>

                    <Card
                        padding="md"
                        hoverable
                        onClick={() => navigate('/leaderboard')}
                        className="cursor-pointer"
                    >
                        <div className="flex items-center space-x-4">
                            <div className="text-4xl text-theme-primary opacity-70"><HiTrophy /></div>
                            <div>
                                <h3 className="font-bold text-theme-primary">
                                    Таблиця рекордів
                                </h3>
                                <p className="text-sm text-theme-secondary">
                                    Ваші досягнення
                                </p>
                            </div>
                        </div>
                    </Card>

                    <Card
                        padding="md"
                        hoverable
                        onClick={() => navigate('/profile')}
                        className="cursor-pointer"
                    >
                        <div className="flex items-center space-x-4">
                            <div className="text-4xl text-theme-primary opacity-70"><HiUser /></div>
                            <div>
                                <h3 className="font-bold text-theme-primary">
                                    Профіль
                                </h3>
                                <p className="text-sm text-theme-secondary">
                                    Налаштування та бейджі
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </Layout>
    );
}

export default Home;

