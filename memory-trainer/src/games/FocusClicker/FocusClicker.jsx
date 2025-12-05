// E:\final\memory-trainer\src\games\FocusClicker\FocusClicker.jsx
// FocusClicker.jsx - Гра на швидкість реакції

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import useGameState from '../../hooks/useGameState';
import { useTheme } from '../../contexts/ThemeContext';
import storageService from '../../services/storageService';

const TOTAL_ROUNDS = 10;
const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

function FocusClicker() {
    const navigate = useNavigate();
    const { accessibility } = useTheme();
    const gameState = useGameState('focus-clicker');

    const [gameStarted, setGameStarted] = useState(false);
    const [currentRound, setCurrentRound] = useState(0);
    const [target, setTarget] = useState(null);
    const [reactionTimes, setReactionTimes] = useState([]);
    const [showResults, setShowResults] = useState(false);
    const [countdown, setCountdown] = useState(3);

    const startTimeRef = useRef(null);
    const timeoutRef = useRef(null);

    // Початок гри
    const handleStartGame = () => {
        setCountdown(3);
        const countdownInterval = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(countdownInterval);
                    startRound();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        gameState.startGame();
        setGameStarted(true);
        setCurrentRound(1);
        setReactionTimes([]);
    };

    // Початок раунду
    const startRound = () => {
        const delay = Math.random() * 2000 + 1000; // 1-3 секунди

        timeoutRef.current = setTimeout(() => {
            const newTarget = {
                x: Math.random() * 80 + 10, // 10-90%
                y: Math.random() * 80 + 10,
                color: COLORS[Math.floor(Math.random() * COLORS.length)],
                size: Math.random() * 30 + 50 // 50-80px
            };

            setTarget(newTarget);
            startTimeRef.current = Date.now();
        }, delay);
    };

    // Клік по цілі
    const handleTargetClick = () => {
        if (!startTimeRef.current) return;

        const reactionTime = Date.now() - startTimeRef.current;
        setReactionTimes([...reactionTimes, reactionTime]);
        setTarget(null);
        startTimeRef.current = null;

        if (currentRound < TOTAL_ROUNDS) {
            setCurrentRound(currentRound + 1);
            startRound();
        } else {
            finishGame([...reactionTimes, reactionTime]);
        }
    };

    // Завершення гри
    const finishGame = (times) => {
        const avgReaction = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
        const bestReaction = Math.min(...times);
        const score = Math.round(1000 - avgReaction); // Чим менше час, тим більше очок

        const results = gameState.finishGame({
            avgReaction,
            bestReaction,
            totalRounds: TOTAL_ROUNDS,
            allTimes: times,
            score
        });

        // Оновлення рекордів
        const currentRecords = storageService.getRecords();
        if (!currentRecords.focusClicker.bestAvgReaction || avgReaction < currentRecords.focusClicker.bestAvgReaction) {
            storageService.updateRecord('focusClicker', null, {
                bestAvgReaction: avgReaction,
                bestScore: score
            });
        }

        setShowResults(true);
    };

    // Очищення таймерів
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    if (!gameStarted) {
        return (
            <Layout>
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-8">
                        <h1 className="text-5xl font-bold text-theme-primary mb-4">
                            ⚡ Focus Clicker
                        </h1>
                        <p className="text-xl text-theme-secondary">
                            Перевірте свою швидкість реакції
                        </p>
                    </div>

                    <Card className="mb-8 text-center">
                        <div className="text-8xl mb-6">🎯</div>
                        <h2 className="text-3xl font-bold text-theme-primary mb-4">
                            Готові почати?
                        </h2>
                        <p className="text-lg text-theme-secondary mb-8">
                            Натискайте на цілі якомога швидше!<br />
                            Всього {TOTAL_ROUNDS} раундів
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
                            <li>• Чекайте появи кольорового кола на екрані</li>
                            <li>• Натискайте на нього якомога швидше</li>
                            <li>• Вимірюється час вашої реакції в мілісекундах</li>
                            <li>• Всього {TOTAL_ROUNDS} спроб</li>
                            <li>• Мета: досягти найменшого середнього часу реакції</li>
                        </ul>
                    </Card>
                </div>
            </Layout>
        );
    }

    const avgReaction = reactionTimes.length > 0
        ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)
        : 0;

    return (
        <Layout>
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-3xl font-bold text-theme-primary">
                        ⚡ Focus Clicker
                    </h1>
                    <Button variant="ghost" onClick={() => navigate('/')}>
                        Вихід
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <Card padding="md" className="text-center">
                        <div className="text-2xl mb-1">🎯</div>
                        <div className="text-2xl font-bold" style={{ color: 'var(--accent-primary)' }}>
                            {currentRound}/{TOTAL_ROUNDS}
                        </div>
                        <div className="text-sm text-theme-secondary">Раунд</div>
                    </Card>

                    <Card padding="md" className="text-center">
                        <div className="text-2xl mb-1">⚡</div>
                        <div className="text-2xl font-bold" style={{ color: 'var(--accent-primary)' }}>
                            {avgReaction}мс
                        </div>
                        <div className="text-sm text-theme-secondary">Середня</div>
                    </Card>

                    <Card padding="md" className="text-center">
                        <div className="text-2xl mb-1">🏆</div>
                        <div className="text-2xl font-bold" style={{ color: 'var(--accent-primary)' }}>
                            {reactionTimes.length > 0 ? Math.min(...reactionTimes) : 0}мс
                        </div>
                        <div className="text-sm text-theme-secondary">Найкраща</div>
                    </Card>
                </div>

                {/* Game Area */}
                <Card padding="none" className="relative overflow-hidden" style={{ height: '500px' }}>
                    {countdown > 0 ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-theme-tertiary">
                            <div className="text-center">
                                <div
                                    className={`text-9xl font-bold mb-4 ${accessibility.animationsEnabled ? 'animate-bounce' : ''}`}
                                    style={{ color: 'var(--accent-primary)' }}
                                >
                                    {countdown}
                                </div>
                                <p className="text-xl text-theme-secondary">
                                    Приготуйтесь...
                                </p>
                            </div>
                        </div>
                    ) : !target ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-theme-tertiary">
                            <div className="text-center">
                                <div className={`text-6xl mb-4 ${accessibility.animationsEnabled ? 'animate-pulse' : ''}`}>
                                    👀
                                </div>
                                <p className="text-2xl font-bold text-theme-primary">
                                    Чекайте...
                                </p>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={handleTargetClick}
                            className={`
                absolute rounded-full cursor-pointer
                ${accessibility.animationsEnabled ? 'transition-all duration-200 hover:scale-110' : ''}
                shadow-2xl
              `}
                            style={{
                                left: `${target.x}%`,
                                top: `${target.y}%`,
                                width: `${target.size}px`,
                                height: `${target.size}px`,
                                backgroundColor: target.color,
                                transform: 'translate(-50%, -50%)'
                            }}
                            aria-label="Клікніть по цілі"
                        />
                    )}
                </Card>

                {/* Reaction History */}
                {reactionTimes.length > 0 && (
                    <Card className="mt-6">
                        <h3 className="text-xl font-bold text-theme-primary mb-4">
                            📊 Історія реакцій
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {reactionTimes.map((time, index) => (
                                <div
                                    key={index}
                                    className={`
                    px-4 py-2 rounded-lg font-bold
                    ${time < 250 ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' :
                                        time < 400 ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300' :
                                            'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'}
                  `}
                                >
                                    #{index + 1}: {time}мс
                                </div>
                            ))}
                        </div>
                    </Card>
                )}

                {/* Results Modal */}
                <Modal
                    isOpen={showResults}
                    onClose={() => {}}
                    title="⚡ Результати"
                    showCloseButton={false}
                >
                    <div className="text-center">
                        <div className="text-6xl mb-6">🏆</div>
                        <h3 className="text-2xl font-bold text-theme-primary mb-6">
                            Гру завершено!
                        </h3>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="p-4 bg-theme-tertiary rounded-xl">
                                <div className="text-3xl font-bold" style={{ color: 'var(--accent-primary)' }}>{avgReaction}мс</div>
                                <div className="text-sm text-theme-secondary">Середня реакція</div>
                            </div>
                            <div className="p-4 bg-theme-tertiary rounded-xl">
                                <div className="text-3xl font-bold" style={{ color: 'var(--accent-primary)' }}>
                                    {Math.min(...reactionTimes)}мс
                                </div>
                                <div className="text-sm text-theme-secondary">Найкраща</div>
                            </div>
                        </div>

                        {avgReaction < 250 && (
                            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900 dark:bg-opacity-20 rounded-xl">
                                <div className="text-4xl mb-2">⚡</div>
                                <p className="font-bold text-green-700 dark:text-green-300">
                                    Блискавична реакція! Чудова робота!
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
                                    setCurrentRound(0);
                                    setTarget(null);
                                    setReactionTimes([]);
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

export default FocusClicker;