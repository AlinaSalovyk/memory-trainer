import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import useGameState from '../../hooks/useGameState';
import useTimer from '../../hooks/useTimer';
import { useTheme } from '../../contexts/ThemeContext';
import { useProfile } from '../../contexts/ProfileContext';
import storageService from '../../services/storageService';

const GAME_DURATION = 60;
const COLORS = ['червоний', 'синій', 'зелений', 'жовтий'];
const COLOR_MAP = {
    'червоний': '#ef4444',
    'синій': '#3b82f6',
    'зелений': '#10b981',
    'жовтий': '#f59e0b'
};

const SOUNDS = {
    WRONG: 150,
    CORRECT_COLOR: 600,
    BASE_NUMBER: 300
};

function DualTask() {
    const navigate = useNavigate();
    const { accessibility } = useTheme();
    const gameState = useGameState('dualTask');
    const { refreshAll } = useProfile();

    const [gameStarted, setGameStarted] = useState(false);
    const [currentNumber, setCurrentNumber] = useState(1);
    const [colorTask, setColorTask] = useState({ text: '', color: '' });
    const [scores, setScores] = useState({ task1: 0, task2: 0 });
    const [feedback, setFeedback] = useState(null);
    const [showResults, setShowResults] = useState(false);

    const { time, start: startTimer, stop: stopTimer, reset: resetTimer, pause: pauseTimer, resume: resumeTimer } = useTimer(GAME_DURATION, true);

    const colorTimerRef = useRef(null);
    const audioContextRef = useRef(null);

    const startColorTimer = () => {
        if (colorTimerRef.current) clearInterval(colorTimerRef.current);
        colorTimerRef.current = setInterval(() => {
            generateColorTask();
        }, 4000);
    };

    useEffect(() => {
        if (gameState.isPaused) {
            pauseTimer();
            if (colorTimerRef.current) {
                clearInterval(colorTimerRef.current);
                colorTimerRef.current = null;
            }
        } else if (gameState.isPlaying && gameStarted) {
            resumeTimer();
            if (!colorTimerRef.current) {
                startColorTimer();
            }
        }
    }, [gameState.isPaused, gameState.isPlaying, gameStarted, pauseTimer, resumeTimer]);


    useEffect(() => {
        if (accessibility.soundEnabled) {
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }
        return () => {
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, [accessibility.soundEnabled]);

    const playSound = (frequency, type = 'sine', duration = 0.1) => {
        if (!accessibility.soundEnabled || !audioContextRef.current) return;

        try {
            const oscillator = audioContextRef.current.createOscillator();
            const gainNode = audioContextRef.current.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContextRef.current.destination);

            oscillator.frequency.value = frequency;
            oscillator.type = type;

            gainNode.gain.setValueAtTime(0.1, audioContextRef.current.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioContextRef.current.currentTime + duration);

            oscillator.start(audioContextRef.current.currentTime);
            oscillator.stop(audioContextRef.current.currentTime + duration);
        } catch (e) {
            console.error("Audio playback error:", e);
        }
    };

    const generateColorTask = () => {
        const text = COLORS[Math.floor(Math.random() * COLORS.length)];
        const color = COLORS[Math.floor(Math.random() * COLORS.length)];
        setColorTask({ text, color });
    };

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
        playSound(440, 'sine', 0.3);
    };

    const togglePause = () => {
        if (gameState.isPaused) {
            gameState.resumeGame();
        } else {
            gameState.pauseGame();
        }
    };

    const handleNumberClick = (number) => {
        if (gameState.isPaused) return;
        if (number === currentNumber) {
            playSound(SOUNDS.BASE_NUMBER + (number * 20), 'sine');
            setCurrentNumber(currentNumber + 1);
            setScores(prev => ({ ...prev, task1: prev.task1 + 10 }));
            showFeedback('task1', true);
        } else {
            playSound(SOUNDS.WRONG, 'sawtooth', 0.3);
            showFeedback('task1', false);
        }
    };

    const handleColorResponse = (isMatch) => {
        if (gameState.isPaused) return;

        const actualMatch = colorTask.text === colorTask.color;
        if (isMatch === actualMatch) {
            playSound(SOUNDS.CORRECT_COLOR, 'triangle');

            setScores(prev => ({ ...prev, task2: prev.task2 + 10 }));
            showFeedback('task2', true);
        } else {
            playSound(SOUNDS.WRONG, 'sawtooth', 0.3);
            showFeedback('task2', false);
        }
        generateColorTask();
        if (!gameState.isPaused) {
            startColorTimer();
        }
    };

    const showFeedback = (task, correct) => {
        setFeedback({ task, correct });
        setTimeout(() => setFeedback(null), 500);
    };

    useEffect(() => {
        if (time === 0 && gameState.isPlaying) {
            endGame();
        }
    }, [time]);


    const endGame = () => {
        stopTimer();
        gameState.pauseGame();

        playSound(300, 'sine', 0.5);

        if (colorTimerRef.current) {
            clearInterval(colorTimerRef.current);
        }

        const totalScore = scores.task1 + scores.task2;
        const balanceScore = Math.round(100 - Math.abs(scores.task1 - scores.task2) / Math.max(scores.task1, scores.task2, 1) * 100);

        const currentRecords = storageService.getRecords();
        let isNewRecord = false;

        if (!currentRecords.dualTask.bestBalance ||
            balanceScore > currentRecords.dualTask.bestBalance) {
            storageService.updateRecord('dualTask', null, {
                bestBalance: balanceScore
            });
            isNewRecord = true;
        }

        gameState.finishGame({
            totalScore,
            task1Score: scores.task1,
            task2Score: scores.task2,
            balanceScore,
            currentNumber: currentNumber - 1,
            bestBalance: isNewRecord ? balanceScore : (currentRecords.dualTask.bestBalance || 0)
        });

        refreshAll();

        setShowResults(true);
    };

    useEffect(() => {
        return () => {
            if (colorTimerRef.current) {
                clearInterval(colorTimerRef.current);
            }
        };
    }, []);

    const getFeedbackStyle = (taskId) => {
        if (feedback?.task !== taskId) return {};

        return {
            boxShadow: feedback.correct
                ? '0 0 0 4px var(--accent-success)'
                : '0 0 0 4px var(--accent-danger)',
            borderColor: feedback.correct
                ? 'var(--accent-success)'
                : 'var(--accent-danger)'
        };
    };

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

    const renderTotalScore = scores.task1 + scores.task2;
    const renderBalanceScore = Math.round(100 - Math.abs(scores.task1 - scores.task2) / Math.max(scores.task1, scores.task2, 1) * 100);

    return (
        <Layout>
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-3xl font-bold text-theme-primary">
                        ⚖️ Dual Task Challenge
                    </h1>
                    <div className="flex items-center space-x-4">
                        <Button variant="ghost" onClick={() => navigate('/')}>
                            Вихід
                        </Button>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={togglePause}
                            disabled={showResults}
                        >
                            {gameState.isPaused ? '▶️ Продовжити' : '⏸ Пауза'}
                        </Button>
                    </div>
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
                        <div className="text-2xl font-bold" style={{ color: 'var(--accent-primary)' }}>{renderTotalScore}</div>
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

                <div className="relative">
                    {/* Game Area Wrapper for Overlay */}
                    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 transition-opacity duration-300 ${gameState.isPaused ? 'opacity-20 blur-sm pointer-events-none' : ''}`}>
                        <Card style={{ transition: 'box-shadow 0.2s', ...getFeedbackStyle('task1') }}>
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
                                            ? 'cursor-not-allowed opacity-50'
                                            : 'hover:scale-105 shadow-md'}
                                        `}
                                        style={{
                                            backgroundColor: num >= currentNumber
                                                ? 'var(--accent-primary)'
                                                : 'var(--bg-tertiary)',
                                            color: num >= currentNumber
                                                ? 'var(--text-inverse)'
                                                : 'var(--text-tertiary)',
                                            border: num >= currentNumber
                                                ? 'none'
                                                : '1px solid var(--border-color)'
                                        }}
                                        disabled={num < currentNumber || gameState.isPaused}
                                    >
                                        {num}
                                    </button>
                                ))}
                            </div>
                        </Card>

                        {/* Task 2: Colors */}
                        <Card style={{ transition: 'box-shadow 0.2s', ...getFeedbackStyle('task2') }}>
                            <h2 className="text-2xl font-bold text-theme-primary mb-4">
                                Завдання 2: Кольори
                            </h2>
                            <p className="text-theme-secondary mb-4">
                                Чи співпадає текст з кольором?
                            </p>

                            <div className="mb-6 p-8 rounded-xl text-center" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                                <div
                                    className="text-6xl font-bold transition-colors duration-200"
                                    style={{
                                        color: COLOR_MAP[colorTask.color],
                                        textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                    }}
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
                                    style={{ backgroundColor: 'var(--accent-success)', borderColor: 'var(--accent-success)' }}
                                    disabled={gameState.isPaused}
                                >
                                    ✓ Так
                                </Button>
                                <Button
                                    size="lg"
                                    variant="danger"
                                    onClick={() => handleColorResponse(false)}
                                    fullWidth
                                    style={{ backgroundColor: 'var(--accent-danger)', borderColor: 'var(--accent-danger)' }}
                                    disabled={gameState.isPaused}
                                >
                                    ✗ Ні
                                </Button>
                            </div>
                        </Card>
                    </div>

                    {/* Pause Overlay */}
                    {gameState.isPaused && (
                        <div className="absolute inset-0 flex items-center justify-center z-10">
                            <div className="text-center p-6 rounded-2xl shadow-2xl border-2" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                                <h2 className="text-2xl font-bold text-theme-primary mb-4">Гра на паузі</h2>
                                <Button size="md" onClick={togglePause}>
                                    Продовжити
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Balance Indicator */}
                <Card>
                    <h3 className="text-xl font-bold text-theme-primary mb-4">
                        ⚖️ Баланс завдань: {renderBalanceScore}%
                    </h3>
                    <div className="flex items-center space-x-4">
                        <span className="text-sm font-medium text-theme-secondary">
                            Завдання 1
                        </span>
                        <div className="flex-1 h-6 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                            <div className="h-full flex">
                                <div
                                    className="transition-all duration-300"
                                    style={{
                                        backgroundColor: 'var(--accent-primary)',
                                        width: `${(scores.task1 / (scores.task1 + scores.task2 || 1)) * 100}%`
                                    }}
                                />
                                <div
                                    className="transition-all duration-300"

                                    style={{
                                        backgroundColor: 'var(--text-secondary)',
                                        width: `${(scores.task2 / (scores.task1 + scores.task2 || 1)) * 100}%`
                                    }}
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
                            {renderBalanceScore >= 90 ? '🏆' : renderBalanceScore >= 70 ? '🎉' : '👍'}
                        </div>
                        <h3 className="text-2xl font-bold text-theme-primary mb-6">
                            Час вийшов!
                        </h3>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                                <div className="text-3xl font-bold" style={{ color: 'var(--accent-primary)' }}>{renderTotalScore}</div>
                                <div className="text-sm text-theme-secondary">Загальний рахунок</div>
                            </div>
                            <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                                <div className="text-3xl font-bold" style={{ color: 'var(--accent-primary)' }}>{renderBalanceScore}%</div>
                                <div className="text-sm text-theme-secondary">Баланс</div>
                            </div>
                            <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                                <div className="text-3xl font-bold" style={{ color: 'var(--accent-primary)' }}>{scores.task1}</div>
                                <div className="text-sm text-theme-secondary">Завдання 1</div>
                            </div>
                            <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                                <div className="text-3xl font-bold" style={{ color: 'var(--accent-primary)' }}>{scores.task2}</div>
                                <div className="text-sm text-theme-secondary">Завдання 2</div>
                            </div>
                        </div>

                        {renderBalanceScore >= 90 && (
                            <div className="mb-6 p-4 rounded-xl border" style={{
                                backgroundColor: 'var(--bg-tertiary)',
                                borderColor: 'var(--accent-warning)'
                            }}>
                                <div className="text-4xl mb-2">🎖️</div>
                                <p className="font-bold" style={{ color: 'var(--accent-warning)' }}>
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