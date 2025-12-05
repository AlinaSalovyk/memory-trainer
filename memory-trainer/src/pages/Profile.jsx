import React, { useState } from 'react';
import {
    FaPenToSquare,
    FaRegClock,
    FaArrowTrendUp,
    FaPuzzlePiece,
    FaFire,
    FaRegClone,
    FaBolt,
    FaListOl,
    FaPalette,
    FaTableCells,
    FaRegFileLines,
    FaBullseye,
    FaScaleBalanced
} from 'react-icons/fa6';
import Layout from '../components/layout/Layout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import BadgeComponent from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import { useProfile } from '../contexts/ProfileContext';
import badgeService, { BADGES } from '../services/badgeService';

const GAMES_MAP = {
    memoryCards: { name: 'Memory Cards', icon: <FaRegClone /> },
    focusClicker: { name: 'Focus Clicker', icon: <FaBolt /> },
    numberSequence: { name: 'Number Sequence', icon: <FaListOl /> },
    simonSays: { name: 'Simon Says', icon: <FaPalette /> },
    patternGrid: { name: 'Pattern Memory', icon: <FaTableCells /> },
    wordRecall: { name: 'Word Recall', icon: <FaRegFileLines /> },
    focusAvoider: { name: 'Focus Avoider', icon: <FaBullseye /> },
    dualTask: { name: 'Dual Task', icon: <FaScaleBalanced /> }
};

function Profile() {
    const { profile, stats, badges, updateName } = useProfile();
    const [isEditingName, setIsEditingName] = useState(false);
    const [newName, setNewName] = useState(profile.name);
    const [selectedBadge, setSelectedBadge] = useState(null);

    const handleSaveName = () => {
        if (newName.trim()) {
            updateName(newName.trim());
            setIsEditingName(false);
        }
    };

    const earnedBadges = badgeService.getUserBadges();
    const missingBadges = badgeService.getMissingBadges();
    const badgeProgress = badgeService.getBadgeProgress();

    const formatPlayTime = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours}г ${minutes}хв`;
    };

    const favoriteGameInfo = stats.favoriteGame
        ? Object.values(GAMES_MAP).find(game => game.name === stats.favoriteGame)
        : null;

    return (
        <Layout>
            <div className="max-w-5xl mx-auto">
                {/* Profile Header */}
                <Card className="mb-8">
                    <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
                        {/* Avatar */}
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white text-5xl font-bold shadow-xl">
                            {profile.name.charAt(0).toUpperCase()}
                        </div>

                        {/* Profile Info */}
                        <div className="flex-1 text-center md:text-left">
                            {isEditingName ? (
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="text"
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        className="px-4 py-2 border-2 border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-theme-card text-theme-primary"
                                        placeholder="Ваше ім'я"
                                        autoFocus
                                    />
                                    <Button size="sm" onClick={handleSaveName}>
                                        Зберегти
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => {
                                            setNewName(profile.name);
                                            setIsEditingName(false);
                                        }}
                                    >
                                        Скасувати
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center md:justify-start space-x-2">
                                    <h1 className="text-3xl font-bold text-theme-primary">
                                        {profile.name}
                                    </h1>
                                    <button
                                        onClick={() => setIsEditingName(true)}
                                        className="text-theme-secondary hover:text-primary transition-colors p-1"
                                        aria-label="Редагувати ім'я"
                                    >
                                        <FaPenToSquare className="w-5 h-5" />
                                    </button>
                                </div>
                            )}

                            <p className="text-theme-secondary mt-2">
                                Член спільноти з {new Date(profile.createdAt).toLocaleDateString('uk-UA', {
                                month: 'long',
                                year: 'numeric'
                            })}
                            </p>

                            {/* Quick Stats */}
                            <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-4">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-primary">{stats.totalGamesPlayed}</div>
                                    <div className="text-xs text-theme-secondary">Ігор</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-primary">{stats.memoryLevel}</div>
                                    <div className="text-xs text-theme-secondary">Рівень</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-primary">{earnedBadges.length}</div>
                                    <div className="text-xs text-theme-secondary">Бейджів</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-primary">{stats.streak}</div>
                                    <div className="text-xs text-theme-secondary">Днів підряд</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Statistics */}
                <Card className="mb-8">
                    <h2 className="text-2xl font-bold text-theme-primary mb-4">
                        Загальна статистика
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 rounded-xl bg-theme-tertiary">
                            <div className="text-3xl mb-2 text-primary">
                                <FaRegClock className="inline-block" />
                            </div>
                            <div className="text-lg font-bold text-theme-primary">
                                {formatPlayTime(stats.totalPlayTime)}
                            </div>
                            <div className="text-sm text-theme-secondary">
                                Загальний час
                            </div>
                        </div>

                        <div className="text-center p-4 rounded-xl bg-theme-tertiary">
                            <div className="text-3xl mb-2 text-primary">
                                <FaArrowTrendUp className="inline-block" />
                            </div>
                            <div className="text-lg font-bold text-theme-primary">
                                {stats.avgSessionTime}с
                            </div>
                            <div className="text-sm text-theme-secondary">
                                Середня сесія
                            </div>
                        </div>

                        <div className="text-center p-4 rounded-xl bg-theme-tertiary">
                            <div className="text-3xl mb-2 text-primary">
                                <span className="inline-block">
                                    {favoriteGameInfo ? favoriteGameInfo.icon : <FaPuzzlePiece />}
                                </span>
                            </div>
                            <div className="text-lg font-bold text-theme-primary">
                                {stats.favoriteGame || 'Немає'}
                            </div>
                            <div className="text-sm text-theme-secondary">
                                Улюблена гра
                            </div>
                        </div>

                        <div className="text-center p-4 rounded-xl bg-theme-tertiary">
                            <div className="text-3xl mb-2 text-primary">
                                <FaFire className="inline-block" />
                            </div>
                            <div className="text-lg font-bold text-theme-primary">
                                {stats.streak} днів
                            </div>
                            <div className="text-sm text-theme-secondary">
                                Поточна серія
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Badges Section */}
                <Card>
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-theme-primary">
                                Бейджі
                            </h2>
                            <p className="text-theme-secondary mt-1">
                                Зібрано {earnedBadges.length} з {Object.keys(BADGES).length}
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-bold text-primary">
                                {badgeProgress.percentage}%
                            </div>
                            <div className="text-sm text-theme-secondary">
                                Прогрес
                            </div>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-3 bg-theme-tertiary rounded-full mb-8 overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-primary to-purple-600 transition-all duration-500"
                            style={{ width: `${badgeProgress.percentage}%` }}
                        />
                    </div>

                    {/* Earned Badges */}
                    {earnedBadges.length > 0 && (
                        <>
                            <h3 className="text-xl font-bold text-theme-primary mb-4">
                                Отримані бейджі
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
                                {earnedBadges.map((badge) => (
                                    <BadgeComponent
                                        key={badge.id}
                                        {...badge}
                                        earned={true}
                                        size="md"
                                        onClick={() => setSelectedBadge(badge)}
                                    />
                                ))}
                            </div>
                        </>
                    )}

                    {/* Missing Badges */}
                    {missingBadges.length > 0 && (
                        <>
                            <h3 className="text-xl font-bold text-theme-primary mb-4">
                                Ще не отримані
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                {missingBadges.map((badge) => (
                                    <BadgeComponent
                                        key={badge.id}
                                        {...badge}
                                        earned={false}
                                        size="md"
                                        onClick={() => setSelectedBadge(badge)}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </Card>

                {/* Badge Details Modal */}
                <Modal
                    isOpen={selectedBadge !== null}
                    onClose={() => setSelectedBadge(null)}
                    title={selectedBadge?.name || ''}
                    size="sm"
                >
                    {selectedBadge && (
                        <div className="text-center">
                            <div className="text-7xl mb-4">{selectedBadge.icon}</div>
                            <p className="text-theme-secondary mb-4">
                                {selectedBadge.description}
                            </p>
                            {selectedBadge.earnedAt && (
                                <p className="text-sm text-theme-secondary">
                                    Отримано: {new Date(selectedBadge.earnedAt).toLocaleDateString('uk-UA', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric'
                                })}
                                </p>
                            )}
                        </div>
                    )}
                </Modal>
            </div>
        </Layout>
    );
}

export default Profile;