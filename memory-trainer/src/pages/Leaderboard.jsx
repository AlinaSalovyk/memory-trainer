import React, { useState } from 'react';
import Layout from '../components/layout/Layout.jsx';
import Card from '../components/ui/Card.jsx';
import storageService from '../services/storageService.js';
import {
    FaGamepad,
    FaRegClone,
    FaBolt,
    FaListOl,
    FaPalette,
    FaTableCells,
    FaRegFileLines,
    FaBullseye,
    FaScaleBalanced,
    FaCircle
} from 'react-icons/fa6';
import { HiTrophy } from 'react-icons/hi2';

function Leaderboard() {
    const [selectedGame, setSelectedGame] = useState('all');
    const records = storageService.getRecords();

    const GAMES = {
        all: { name: 'Всі ігри', icon: <FaGamepad /> },
        memoryCards: { name: 'Memory Cards', icon: <FaRegClone /> },
        focusClicker: { name: 'Focus Clicker', icon: <FaBolt /> },
        numberSequence: { name: 'Number Sequence', icon: <FaListOl /> },
        simonSays: { name: 'Simon Says', icon: <FaPalette /> },
        patternGrid: { name: 'Pattern Memory', icon: <FaTableCells /> },
        wordRecall: { name: 'Word Recall', icon: <FaRegFileLines /> },
        focusAvoider: { name: 'Focus Avoider', icon: <FaBullseye /> },
        dualTask: { name: 'Dual Task', icon: <FaScaleBalanced /> }
    };

    const RecordCard = ({
                            title,
                            value,
                            unit,
                            icon,
                            description,
                            iconColorClass = "text-theme-primary opacity-90",
                            iconBgClass = "bg-theme-secondary"
                        }) => (
        <Card className="flex items-center space-x-4 p-5">
            <div className={`text-3xl p-4 rounded-lg ${iconColorClass} ${iconBgClass}`}>
                {icon}
            </div>
            <div>
                <p className="text-sm text-theme-secondary">{description}</p>
                <h3 className="text-lg font-bold text-theme-primary mb-0">
                    {title}
                </h3>
                <div
                    className="text-2xl font-bold"
                    style={{ color: 'var(--accent-primary)' }}
                >
                    {value !== null ? value : '—'}
                    {value !== null && unit && <span className="text-lg ml-1">{unit}</span>}
                </div>
            </div>
        </Card>
    );

    const renderRecords = () => {
        if (selectedGame === 'all') {
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <RecordCard
                        title="Найкраща реакція"
                        value={records.focusClicker.bestAvgReaction}
                        unit="мс"
                        icon={<FaBolt />}
                        description="Focus Clicker"
                    />
                    <RecordCard
                        title="Найменше ходів"
                        value={records.memoryCards.hard.bestMoves}
                        unit="ходів"
                        icon={<FaRegClone />}
                        description="Memory Cards (8x8)"
                    />
                    <RecordCard
                        title="Найдовша послідовність"
                        value={records.numberSequence.longestSequence}
                        unit="цифр"
                        icon={<FaListOl />}
                        description="Number Sequence"
                    />
                    <RecordCard
                        title="Simon рекорд"
                        value={records.simonSays.longestSequence}
                        unit="кроків"
                        icon={<FaPalette />}
                        description="Simon Says"
                    />
                    <RecordCard
                        title="Найвищий рівень"
                        value={records.patternGrid.highestLevel}
                        unit="рівень"
                        icon={<FaTableCells />}
                        description="Pattern Memory"
                    />
                    <RecordCard
                        title="Найдовша серія"
                        value={records.wordRecall.bestStreak}
                        unit="слів"
                        icon={<FaRegFileLines />}
                        description="Word Recall"
                    />
                </div>
            );
        }

        if (selectedGame === 'memoryCards') {
            return (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <RecordCard
                        title="Легкий (4x4)"
                        value={records.memoryCards.easy.bestMoves}
                        unit="ходів"
                        icon={<FaCircle />}
                        iconColorClass="text-green-700"
                        iconBgClass="bg-green-100"
                        description="Найменше ходів"
                    />
                    <RecordCard
                        title="Середній (6x6)"
                        value={records.memoryCards.medium.bestMoves}
                        unit="ходів"
                        icon={<FaCircle />}
                        iconColorClass="text-yellow-700"
                        iconBgClass="bg-yellow-100"
                        description="Найменше ходів"
                    />
                    <RecordCard
                        title="Важкий (8x8)"
                        value={records.memoryCards.hard.bestMoves}
                        unit="ходів"
                        icon={<FaCircle />}
                        iconColorClass="text-red-700"
                        iconBgClass="bg-red-100"
                        description="Найменше ходів"
                    />
                </div>
            );
        }

        const gameRecords = records[selectedGame];
        if (!gameRecords) return null;

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(gameRecords).map(([key, value]) => (
                    <RecordCard
                        key={key}
                        title={key.replace(/([A-Z])/g, ' $1').trim()} // Розділяє camelCase
                        value={value}
                        icon={GAMES[selectedGame].icon}
                        description="Особистий рекорд"
                    />
                ))}
            </div>
        );
    };

    return (
        <Layout>
            <div className="max-w-7xl mx-auto">
                <h1 className="text-4xl font-bold text-theme-primary mb-2">
                    Таблиця Рекордів
                </h1>
                <p className="text-theme-secondary mb-10">
                    Ваші найкращі досягнення в кожній грі
                </p>

                <Card className="mb-10">
                    <div className="flex flex-wrap gap-2">
                        {Object.entries(GAMES).map(([id, game]) => (
                            <button
                                key={id}
                                onClick={() => setSelectedGame(id)}
                                className={`
                                    px-4 py-2 rounded-lg font-medium transition-all duration-200
                                    flex items-center gap-2
                                    ${selectedGame === id
                                    ? 'shadow-lg scale-105'
                                    : 'bg-theme-secondary text-theme-secondary hover:bg-theme-tertiary'
                                }
                                `}
                                style={selectedGame === id ? {
                                    backgroundColor: 'var(--accent-primary)',
                                    color: 'var(--text-inverse)'
                                } : {}}
                            >
                                <span className="text-lg">{game.icon}</span>
                                {game.name}
                            </button>
                        ))}
                    </div>
                </Card>

                {renderRecords()}

                <Card
                    className="mt-10 text-white text-center p-8"
                    style={{ background: 'var(--gradient-primary)' }}
                >
                    <HiTrophy className="text-5xl mb-4 mx-auto" />
                    <h2 className="text-2xl font-bold mb-2">Продовжуйте тренуватися!</h2>
                    <p className="text-white text-opacity-90 max-w-lg mx-auto">
                        Кожна гра - це можливість побити свій рекорд та покращити когнітивні навички
                    </p>
                </Card>
            </div>
        </Layout>
    );
}

export default Leaderboard;


