import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import useGameState from '../../hooks/useGameState';
import { useTheme } from '../../contexts/ThemeContext';
import { useProfile } from '../../contexts/ProfileContext';
import storageService from '../../services/storageService';

const TOTAL_ROUNDS = 10;
const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

const SOUNDS = {
    COUNTDOWN: 440,
    GO: 880,
    GAME_OVER: 600
};

function FocusClicker() {
    const navigate = useNavigate();
    const { accessibility } = useTheme();
    const gameState = useGameState('focusClicker');
    const { refreshAll } = useProfile();
    const [gameStarted, setGameStarted] = useState(false);
    const [currentRound, setCurrentRound] = useState(0);
    const [target, setTarget] = useState(null);
    const [reactionTimes, setReactionTimes] = useState([]);
    const [showResults, setShowResults] = useState(false);
    const [countdown, setCountdown] = useState(3);

    const startTimeRef = useRef(null);
    const timeoutRef = useRef(null);
    const countdownIntervalRef = useRef(null); // Реф для інтервалу
    const audioContextRef = useRef(null);

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

    const startCountdown = () => {
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

        countdownIntervalRef.current = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(countdownIntervalRef.current);
                    playSound(SOUNDS.GO, 'sine', 0.3);
                    startRound();
                    return 0;
                }
                playSound(SOUNDS.COUNTDOWN, 'triangle', 0.1);
                return prev - 1;
            });
        }, 1000);
    };

    const handleStartGame = () => {
        setCountdown(3);
        playSound(SOUNDS.COUNTDOWN, 'triangle', 0.1);
        startCountdown();

        gameState.startGame();
        setGameStarted(true);
        setCurrentRound(1);
        setReactionTimes([]);
    };

    const togglePause = () => {
        if (gameState.isPaused) {
            gameState.resumeGame();
        } else {
            gameState.pauseGame();
        }
    };

    useEffect(() => {
        if (gameState.isPaused) {
            if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            setTarget(null);
        } else if (gameState.isPlaying && gameStarted) {
            if (countdown > 0) {
                startCountdown();
            } else {
                startRound();
            }
        }

        return () => {
            if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [gameState.isPaused, gameState.isPlaying, gameStarted]);


    const startRound = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        const delay = Math.random() * 1500 + 500;

        timeoutRef.current = setTimeout(() => {
            const newTarget = {
                x: Math.random() * 80 + 10,
                y: Math.random() * 80 + 10,
                color: COLORS[Math.floor(Math.random() * COLORS.length)],
                size: Math.random() * 40 + 80
            };

            setTarget(newTarget);
            startTimeRef.current = Date.now();
        }, delay);
    };

    const handleTargetClick = (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        if (gameState.isPaused) return;
        if (!startTimeRef.current) return;

        const reactionTime = Date.now() - startTimeRef.current;
        const pitch = Math.max(200, 1200 - reactionTime);
        playSound(pitch, 'sine', 0.15);

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

    const finishGame = (times) => {
        const avgReaction = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
        const bestReaction = Math.min(...times);
        const score = Math.round(1000 - avgReaction);
        setTimeout(() => {
            playSound(SOUNDS.GAME_OVER, 'triangle', 0.4);
        }, 300);

        const currentRecords = storageService.getRecords();
        let isNewRecord = false;

        if (!currentRecords.focusClicker.bestAvgReaction || avgReaction < currentRecords.focusClicker.bestAvgReaction) {
            storageService.updateRecord('focusClicker', null, {
                bestAvgReaction: avgReaction,
                bestScore: score
            });
            isNewRecord = true;
        }

        gameState.finishGame({
            avgReaction,
            bestReaction,
            totalRounds: TOTAL_ROUNDS,
            allTimes: times,
            score,
            bestAvgReaction: isNewRecord ? avgReaction : (currentRecords.focusClicker.bestAvgReaction || avgReaction)
        });

        refreshAll();
        setShowResults(true);
    };

    const getResultColor = (time) => {
        if (time < 450) return 'var(--accent-success)';
        if (time < 600) return 'var(--accent-warning)';
        return 'var(--accent-danger)';
    };

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
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-3xl font-bold text-theme-primary">
                        ⚡ Focus Clicker
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

                <Card
                    padding="none"
                    className="relative overflow-hidden select-none"
                    style={{
                        height: '500px',
                        touchAction: 'none',
                        backgroundColor: 'var(--bg-tertiary)'
                    }}
                >
                    {countdown > 0 ? (
                        <div className="absolute inset-0 flex items-center justify-center">
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
                        <div className="absolute inset-0 flex items-center justify-center">
                            {!gameState.isPaused && (
                                <div className="text-center">
                                    <div className={`text-6xl mb-4 ${accessibility.animationsEnabled ? 'animate-pulse' : ''}`}>
                                        👀
                                    </div>
                                    <p className="text-2xl font-bold text-theme-primary">
                                        Чекайте...
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <button
                            onPointerDown={handleTargetClick}
                            className={`
                                absolute rounded-full cursor-pointer
                                ${accessibility.animationsEnabled ? 'transition-all duration-200 hover:scale-110' : ''}
                                shadow-2xl active:scale-95
                            `}
                            style={{
                                left: `${target.x}%`,
                                top: `${target.y}%`,
                                width: `${target.size}px`,
                                height: `${target.size}px`,
                                backgroundColor: target.color,
                                transform: 'translate(-50%, -50%)',
                                border: 'none',
                                outline: 'none',
                                touchAction: 'none'
                            }}
                            aria-label="Клікніть по цілі"
                        />
                    )}

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
                </Card>

                {reactionTimes.length > 0 && (
                    <Card className="mt-6">
                        <h3 className="text-xl font-bold text-theme-primary mb-4">
                            📊 Історія реакцій
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {reactionTimes.map((time, index) => (
                                <div
                                    key={index}
                                    className="px-4 py-2 rounded-lg font-bold border"
                                    style={{
                                        backgroundColor: 'var(--bg-tertiary)',
                                        borderColor: getResultColor(time),
                                        color: getResultColor(time)
                                    }}
                                >
                                    #{index + 1}: {time}мс
                                </div>
                            ))}
                        </div>
                    </Card>
                )}

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
                            <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                                <div className="text-3xl font-bold" style={{ color: 'var(--accent-primary)' }}>{avgReaction}мс</div>
                                <div className="text-sm text-theme-secondary">Середня реакція</div>
                            </div>
                            <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                                <div className="text-3xl font-bold" style={{ color: 'var(--accent-primary)' }}>
                                    {Math.min(...reactionTimes)}мс
                                </div>
                                <div className="text-sm text-theme-secondary">Найкраща</div>
                            </div>
                        </div>

                        {avgReaction < 450 && (
                            <div
                                className="mb-6 p-4 rounded-xl border"
                                style={{
                                    backgroundColor: 'var(--bg-tertiary)',
                                    borderColor: 'var(--accent-success)'
                                }}
                            >
                                <div className="text-4xl mb-2">⚡</div>
                                <p className="font-bold" style={{ color: 'var(--accent-success)' }}>
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