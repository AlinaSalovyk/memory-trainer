import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import useGameState from '../../hooks/useGameState';
import useTimer from '../../hooks/useTimer';
import { useTheme } from '../../contexts/ThemeContext';
import storageService from '../../services/storageService';

const GAME_DURATION = 60;
const COLORS = ['червоний', 'синій', 'зелений', 'жовтий'];
const COLOR_MAP = {
    'червоний': '#ef4444',
    'синій': '#3b82f6',
    'зелений': '#10b981',
    'жовтий': '#f59e0b'
};

function DualTask() {
    const navigate = useNavigate();
    const { accessibility } = useTheme();
    const gameState = useGameState('dual-task');

    const [gameStarted, setGameStarted] = useState(false);
    const [currentNumber, setCurrentNumber] = useState(1);
    const [colorTask, setColorTask] = useState({ text: '', color: '' });
    const [scores, setScores] = useState({ task1: 0, task2: 0 });
    const [feedback, setFeedback] = useState(null);
    const [showResults, setShowResults] = useState(false);

    const { time, start: startTimer, stop: stopTimer, reset: resetTimer } = useTimer(GAME_DURATION, true);
    const colorTimerRef = useRef(null);

    // Генерація нового кольорового завдання
    const generateColorTask = () => {
        const text = COLORS[Math.floor(Math.random() * COLORS.length)];
        const color = COLORS[Math.floor(Math.random() * COLORS.length)];
        setColorTask({ text, color });
    };

    // Початок гри
    const handleStartGame = () => {
        setGameStarted(true);
        gameState.startGame();
        setCurrentNumber(1);
        setScores({ task1: 0, task2: 0 });
        setFeedback(null);
        resetTimer();
        startTimer();
        generateColorTask();
        startColorTimer();
    };

    // Таймер зміни кольору
    const startColorTimer = () => {
        colorTimerRef.current = setInterval(() => {
            generateColorTask();
        }, 4000);
    };

    // Завдання 1: Натискання цифр по порядку
    const handleNumberClick = (number) => {
        if (number === currentNumber) {
            setCurrentNumber(currentNumber + 1);
            setScores(prev => ({ ...prev, task1: prev.task1 + 10 }));
            showFeedback('task1', true);
        } else {
            showFeedback('task1', false);
        }
    };

    // Завдання 2: Відповідь на колір
    const handleColorResponse = (isMatch) => {
        const actualMatch = colorTask.text === colorTask.color;
        if (isMatch === actualMatch) {
            setScores(prev => ({ ...prev, task2: prev.task2 + 10 }));
            showFeedback('task2', true);
        } else {
            showFeedback('task2', false);
        }
        generateColorTask();
    };

    // Показати зворотній зв'язок
    const showFeedback = (task, correct) => {
        setFeedback({ task, correct });
        setTimeout(() => setFeedback(null), 500);
    };

    // Таймер закінчення
    useEffect(() => {
        if (time === 0 && gameState.isPlaying) {
            endGame();
        }
    }, [time]);

    // Завершення гри
    const endGame = () => {
        stopTimer();
        gameState.pauseGame();

        if (colorTimerRef.current) {
            clearInterval(colorTimerRef.current);
        }

        const totalScore = scores.task1 + scores.task2;
        const balanceScore = Math.round(100 - Math.abs(scores.task1 - scores.task2) / Math.max(scores.task1, scores.task2, 1) * 100);

        const results = gameState.finishGame({
            totalScore,
            task1Score: scores.task1,
            task2Score: scores.task2,
            balanceScore,
            currentNumber: currentNumber - 1
        });

        // Оновлення рекордів
        const currentRecords = storageService.getRecords();
        if (!currentRecords.dualTask.bestBalance ||
            balanceScore > currentRecords.dualTask.bestBalance) {
            storageService.updateRecord('dualTask', null, {
                bestBalance: balanceScore
            });
        }

        setShowResults(true);
    };

    // Очищення таймерів
    useEffect(() => {
        return () => {
            if (colorTimerRef.current) {
                clearInterval(colorTimerRef.current);
            }
        };
    }, []);

    if (!gameStarted) {
        return (
            <Layout>
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-8">
                        <h1 className="text-5xl font-bold text-theme-primary mb-4">
                            ⚖️ Dual Task Challenge
                        </h1>
                        <p className="text-xl text-theme-secondary">
                            Виконуйте дві задачі одночасно
                        </p>
                    </div>

                    <Card className="mb-8 text-center">
                        <div className="text-8xl mb-6">🧠</div>
                        <h2 className="text-3xl font-bold text-theme-primary mb-4">
                            Тренуйте багатозадачність
                        </h2>
                        <p className="text-lg text-theme-secondary mb-8">
                            Завдання 1: Натискайте цифри по порядку<br />
                            Завдання 2: Визначайте, чи співпадає текст з кольором
                        </p>
                        <Button size="lg" onClick={handleStartGame}>
                            Почати гру
                        </Button>
                    </Card>

                    <Card>
                        <h3 className="text-xl font-bold text-theme-primary mb-4">
                            📖 Правила гри
                        </h3>
                        <ul className="space-y-2 text-theme-secondary">
                            <li>• <strong>Завдання 1:</strong> Натискайте цифри від 1 до 25 по порядку</li>
                            <li>• <strong>Завдання 2:</strong> Визначте, чи співпадає назва кольору з його відображенням</li>
                            <li>• Намагайтеся виконувати обидва завдання рівномірно</li>
                            <li>• Гра триває 60 секунд</li>
                            <li>• Мета: максимальний баланс між завданнями</li>
                        </ul>
                    </Card>
                </div>
            </Layout>
        );
    }

    const totalScore = scores.task1 + scores.task2;
    const balanceScore = Math.round(100 - Math.abs(scores.task1 - scores.task2) / Math.max(scores.task1, scores.task2, 1) * 100);

    return (
        <Layout>
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-3xl font-bold text-theme-primary">
                        ⚖️ Dual Task Challenge
                    </h1>
                    <Button variant="ghost" onClick={() => navigate('/')}>
                        Вихід
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                    <Card padding="md" className="text-center">
                        <div className="text-2xl mb-1">⏱️</div>
                        <div className="text-2xl font-bold" style={{ color: 'var(--accent-primary)' }}>{time}с</div>
                        <div className="text-sm text-theme-secondary">Час</div>
                    </Card>

                    <Card padding="md" className="text-center">
                        <div className="text-2xl mb-1">🎯</div>
                        <div className="text-2xl font-bold" style={{ color: 'var(--accent-primary)' }}>{totalScore}</div>
                        <div className="text-sm text-theme-secondary">Всього</div>
                    </Card>

                    <Card padding="md" className="text-center">
                        <div className="text-2xl mb-1">1️⃣</div>
                        <div className="text-2xl font-bold" style={{ color: 'var(--accent-primary)' }}>{scores.task1}</div>
                        <div className="text-sm text-theme-secondary">Цифри</div>
                    </Card>

                    <Card padding="md" className="text-center">
                        <div className="text-2xl mb-1">2️⃣</div>
                        <div className="text-2xl font-bold" style={{ color: 'var(--accent-primary)' }}>{scores.task2}</div>
                        <div className="text-sm text-theme-secondary">Кольори</div>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Task 1: Numbers */}
                    <Card className={feedback?.task === 'task1' ? (feedback.correct ? 'ring-4 ring-green-500' : 'ring-4 ring-red-500') : ''}>
                        <h2 className="text-2xl font-bold text-theme-primary mb-4">
                            Завдання 1: Цифри
                        </h2>
                        <p className="text-theme-secondary mb-4">
                            Натисніть на: <span className="text-3xl font-bold" style={{ color: 'var(--accent-primary)' }}>{currentNumber}</span>
                        </p>
                        <div className="grid grid-cols-5 gap-2">
                            {Array.from({ length: 25 }, (_, i) => i + 1).map(num => (
                                <button
                                    key={num}
                                    onClick={() => handleNumberClick(num)}
                                    className={`
                    aspect-square rounded-lg font-bold text-xl
                    transition-all duration-200
                    ${num < currentNumber
                                        ? 'bg-theme-tertiary text-theme-tertiary cursor-not-allowed'
                                        : 'hover:scale-105 shadow-md'}
                  `}
                                    style={num >= currentNumber ? {
                                        backgroundColor: 'var(--accent-primary)',
                                        color: 'var(--text-inverse)'
                                    } : {}}
                                    disabled={num < currentNumber}
                                >
                                    {num}
                                </button>
                            ))}
                        </div>
                    </Card>

                    {/* Task 2: Colors */}
                    <Card className={feedback?.task === 'task2' ? (feedback.correct ? 'ring-4 ring-green-500' : 'ring-4 ring-red-500') : ''}>
                        <h2 className="text-2xl font-bold text-theme-primary mb-4">
                            Завдання 2: Кольори
                        </h2>
                        <p className="text-theme-secondary mb-4">
                            Чи співпадає текст з кольором?
                        </p>

                        <div className="mb-6 p-8 bg-theme-tertiary rounded-xl text-center">
                            <div
                                className="text-6xl font-bold"
                                style={{ color: COLOR_MAP[colorTask.color] }}
                            >
                                {colorTask.text}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Button
                                size="lg"
                                variant="success"
                                onClick={() => handleColorResponse(true)}
                                fullWidth
                            >
                                ✓ Так
                            </Button>
                            <Button
                                size="lg"
                                variant="danger"
                                onClick={() => handleColorResponse(false)}
                                fullWidth
                            >
                                ✗ Ні
                            </Button>
                        </div>
                    </Card>
                </div>

                {/* Balance Indicator */}
                <Card>
                    <h3 className="text-xl font-bold text-theme-primary mb-4">
                        ⚖️ Баланс завдань: {balanceScore}%
                    </h3>
                    <div className="flex items-center space-x-4">
                        <span className="text-sm font-medium text-theme-secondary">
                            Завдання 1
                        </span>
                        <div className="flex-1 h-6 bg-theme-tertiary rounded-full overflow-hidden">
                            <div className="h-full flex">
                                <div
                                    className="transition-all duration-300"
                                    style={{
                                        backgroundColor: 'var(--accent-primary)',
                                        width: `${(scores.task1 / (scores.task1 + scores.task2 || 1)) * 100}%`
                                    }}
                                />
                                <div
                                    className="bg-purple-600 transition-all duration-300"
                                    style={{ width: `${(scores.task2 / (scores.task1 + scores.task2 || 1)) * 100}%` }}
                                />
                            </div>
                        </div>
                        <span className="text-sm font-medium text-theme-secondary">
                            Завдання 2
                        </span>
                    </div>
                </Card>

                {/* Results Modal */}
                <Modal
                    isOpen={showResults}
                    onClose={() => {}}
                    title="⚖️ Результати"
                    showCloseButton={false}
                >
                    <div className="text-center">
                        <div className="text-6xl mb-6">
                            {balanceScore >= 90 ? '🏆' : balanceScore >= 70 ? '🎉' : '👍'}
                        </div>
                        <h3 className="text-2xl font-bold text-theme-primary mb-6">
                            Час вийшов!
                        </h3>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="p-4 bg-theme-tertiary rounded-xl">
                                <div className="text-3xl font-bold" style={{ color: 'var(--accent-primary)' }}>{totalScore}</div>
                                <div className="text-sm text-theme-secondary">Загальний рахунок</div>
                            </div>
                            <div className="p-4 bg-theme-tertiary rounded-xl">
                                <div className="text-3xl font-bold" style={{ color: 'var(--accent-primary)' }}>{balanceScore}%</div>
                                <div className="text-sm text-theme-secondary">Баланс</div>
                            </div>
                            <div className="p-4 bg-theme-tertiary rounded-xl">
                                <div className="text-3xl font-bold" style={{ color: 'var(--accent-primary)' }}>{scores.task1}</div>
                                <div className="text-sm text-theme-secondary">Завдання 1</div>
                            </div>
                            <div className="p-4 bg-theme-tertiary rounded-xl">
                                <div className="text-3xl font-bold" style={{ color: 'var(--accent-primary)' }}>{scores.task2}</div>
                                <div className="text-sm text-theme-secondary">Завдання 2</div>
                            </div>
                        </div>

                        {/* Семантичні кольори (жовтий) залишаємо як є */}
                        {balanceScore >= 90 && (
                            <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900 dark:bg-opacity-20 rounded-xl">
                                <div className="text-4xl mb-2">🎖️</div>
                                <p className="font-bold text-yellow-700 dark:text-yellow-300">
                                    Майстер багатозадачності! Ідеальний баланс!
                                </p>
                            </div>
                        )}

                        <div className="flex space-x-4">
                            <Button variant="secondary" onClick={() => navigate('/')} fullWidth>
                                В меню
                            </Button>
                            <Button
                                onClick={() => {
                                    setShowResults(false);
                                    setGameStarted(false);
                                }}
                                fullWidth
                            >
                                Ще раз
                            </Button>
                        </div>
                    </div>
                </Modal>
            </div>
        </Layout>
    );
}

export default DualTask;