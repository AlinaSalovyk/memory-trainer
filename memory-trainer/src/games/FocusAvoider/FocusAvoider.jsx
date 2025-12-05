// E:\final\memory-trainer\src\games\FocusAvoider\FocusAvoider.jsx
// FocusAvoider.jsx - Гра на реакцію та уникнення

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

const GAME_DURATION = 60; // секунд
const SPAWN_INTERVAL = 1000; // мс
const TARGET_SPEED = 2; // пікселів за фрейм

function FocusAvoider() {
    const navigate = useNavigate();
    const { accessibility } = useTheme();
    const gameState = useGameState('focus-avoider');

    const [gameStarted, setGameStarted] = useState(false);
    const [objects, setObjects] = useState([]);
    const [score, setScore] = useState(0);
    const [clicks, setClicks] = useState({ good: 0, bad: 0 });
    const [showResults, setShowResults] = useState(false);
    const [gameArea, setGameArea] = useState({ width: 600, height: 400 });

    const { time, start: startTimer, stop: stopTimer, reset: resetTimer } = useTimer(GAME_DURATION, true);
    const animationRef = useRef(null);
    const spawnTimerRef = useRef(null);
    const objectIdRef = useRef(0);
    const gameAreaRef = useRef(null);

    const OBJECT_TYPES = {
        GOOD: { emoji: '🟢', points: 10, color: '#10b981' },
        BAD: { emoji: '🔴', points: -5, color: '#ef4444' }
    };

    // Оновлення розміру ігрової зони
    useEffect(() => {
        const updateSize = () => {
            if (gameAreaRef.current) {
                const rect = gameAreaRef.current.getBoundingClientRect();
                setGameArea({ width: rect.width, height: rect.height });
            }
        };

        updateSize();
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, [gameStarted]);

    // Початок гри
    const handleStartGame = () => {
        setGameStarted(true);
        gameState.startGame();
        setObjects([]);
        setScore(0);
        setClicks({ good: 0, bad: 0 });
        resetTimer();
        startTimer();
        startSpawning();
    };

    // Генерація об'єктів
    const startSpawning = () => {
        spawnTimerRef.current = setInterval(() => {
            spawnObject();
        }, SPAWN_INTERVAL);
    };

    const spawnObject = () => {
        const isGood = Math.random() > 0.3; // 70% добрих, 30% поганих
        const type = isGood ? 'GOOD' : 'BAD';

        const newObject = {
            id: objectIdRef.current++,
            type,
            x: Math.random() * (gameArea.width - 60),
            y: -60,
            vx: (Math.random() - 0.5) * 2,
            vy: TARGET_SPEED + Math.random() * 2,
            size: 40 + Math.random() * 20,
            rotation: Math.random() * 360
        };

        setObjects(prev => [...prev, newObject]);
    };

    // Анімаційний цикл
    useEffect(() => {
        if (!gameState.isPlaying) return;

        const animate = () => {
            setObjects(prev => {
                return prev
                    .map(obj => ({
                        ...obj,
                        x: obj.x + obj.vx,
                        y: obj.y + obj.vy,
                        rotation: obj.rotation + 2
                    }))
                    .filter(obj => obj.y < gameArea.height + 100); // Видалити об'єкти за межами
            });

            animationRef.current = requestAnimationFrame(animate);
        };

        animationRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [gameState.isPlaying, gameArea.height]);

    // Таймер закінчення
    useEffect(() => {
        if (time === 0 && gameState.isPlaying) {
            endGame();
        }
    }, [time]);

    // Клік по об'єкту
    const handleObjectClick = (objectId, type) => {
        const points = OBJECT_TYPES[type].points;
        setScore(prev => prev + points);

        setClicks(prev => ({
            ...prev,
            good: type === 'GOOD' ? prev.good + 1 : prev.good,
            bad: type === 'BAD' ? prev.bad + 1 : prev.bad
        }));

        // Видалити об'єкт
        setObjects(prev => prev.filter(obj => obj.id !== objectId));
    };

    // Завершення гри
    const endGame = () => {
        stopTimer();
        gameState.pauseGame();

        if (spawnTimerRef.current) {
            clearInterval(spawnTimerRef.current);
        }
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
        }

        const totalClicks = clicks.good + clicks.bad;
        const accuracy = totalClicks > 0
            ? Math.round((clicks.good / totalClicks) * 100)
            : 0;

        const results = gameState.finishGame({
            score,
            survivalTime: GAME_DURATION - time,
            accuracy,
            goodClicks: clicks.good,
            badClicks: clicks.bad
        });

        // Оновлення рекордів
        const currentRecords = storageService.getRecords();
        if (!currentRecords.focusAvoider.longestSurvival ||
            GAME_DURATION - time > currentRecords.focusAvoider.longestSurvival) {
            storageService.updateRecord('focusAvoider', null, {
                longestSurvival: GAME_DURATION - time,
                bestAccuracy: accuracy
            });
        }

        setShowResults(true);
    };

    if (!gameStarted) {
        return (
            <Layout>
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-8">
                        <h1 className="text-5xl font-bold text-theme-primary mb-4">
                            🎯 Focus Avoider
                        </h1>
                        <p className="text-xl text-theme-secondary">
                            Збирайте правильні об'єкти та уникайте небезпечних
                        </p>
                    </div>

                    <Card className="mb-8 text-center">
                        <div className="text-8xl mb-6">🎮</div>
                        <h2 className="text-3xl font-bold text-theme-primary mb-4">
                            Тренуйте швидкість реакції
                        </h2>
                        <p className="text-lg text-theme-secondary mb-8">
                            Натискайте на зелені об'єкти (+10 очок)<br />
                            Уникайте червоних об'єктів (-5 очок)<br />
                            У вас є 60 секунд!
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
                            <li>• 🟢 Зелені об'єкти - натискайте на них (+10 очок)</li>
                            <li>• 🔴 Червоні об'єкти - уникайте їх (-5 очок)</li>
                            <li>• Об'єкти падають зверху вниз</li>
                            <li>• Гра триває 60 секунд</li>
                            <li>• Мета: набрати максимум очок з високою точністю</li>
                        </ul>
                    </Card>
                </div>
            </Layout>
        );
    }

    const accuracy = (clicks.good + clicks.bad) > 0
        ? Math.round((clicks.good / (clicks.good + clicks.bad)) * 100)
        : 0;

    return (
        <Layout>
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-3xl font-bold text-theme-primary">
                        🎯 Focus Avoider
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
                        <div className="text-2xl font-bold" style={{ color: 'var(--accent-primary)' }}>{score}</div>
                        <div className="text-sm text-theme-secondary">Очки</div>
                    </Card>

                    <Card padding="md" className="text-center">
                        <div className="text-2xl mb-1">✅</div>
                        <div className="text-2xl font-bold text-success">{clicks.good}</div>
                        <div className="text-sm text-theme-secondary">Добрих</div>
                    </Card>

                    <Card padding="md" className="text-center">
                        <div className="text-2xl mb-1">📊</div>
                        <div className="text-2xl font-bold" style={{ color: 'var(--accent-primary)' }}>{accuracy}%</div>
                        <div className="text-sm text-theme-secondary">Точність</div>
                    </Card>
                </div>

                {/* Game Area */}
                <Card padding="none">
                    <div
                        ref={gameAreaRef}
                        className="relative bg-theme-tertiary overflow-hidden"
                        style={{ height: '500px' }}
                    >
                        {objects.map(obj => (
                            <button
                                key={obj.id}
                                onClick={() => handleObjectClick(obj.id, obj.type)}
                                className={`
                  absolute cursor-pointer transition-transform
                  ${accessibility.animationsEnabled ? 'hover:scale-110' : ''}
                `}
                                style={{
                                    left: `${obj.x}px`,
                                    top: `${obj.y}px`,
                                    width: `${obj.size}px`,
                                    height: `${obj.size}px`,
                                    transform: `rotate(${obj.rotation}deg)`,
                                    fontSize: `${obj.size}px`,
                                    lineHeight: 1
                                }}
                                aria-label={obj.type === 'GOOD' ? 'Добрий об\'єкт' : 'Поганий об\'єкт'}
                            >
                                {OBJECT_TYPES[obj.type].emoji}
                            </button>
                        ))}

                        {/* Guide lines */}
                        <div className="absolute inset-0 pointer-events-none opacity-20">
                            <div
                                className="absolute top-0 left-1/2 w-px h-full"
                                style={{ backgroundColor: 'var(--border-color)' }}
                            />
                            <div
                                className="absolute left-0 top-1/2 w-full h-px"
                                style={{ backgroundColor: 'var(--border-color)' }}
                            />
                        </div>
                    </div>
                </Card>

                {/* Results Modal */}
                <Modal
                    isOpen={showResults}
                    onClose={() => {}}
                    title="🎯 Результати"
                    showCloseButton={false}
                >
                    <div className="text-center">
                        <div className="text-6xl mb-6">
                            {accuracy >= 90 ? '🏆' : accuracy >= 70 ? '🎉' : '👍'}
                        </div>
                        <h3 className="text-2xl font-bold text-theme-primary mb-6">
                            Час вийшов!
                        </h3>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="p-4 bg-theme-tertiary rounded-xl">
                                <div className="text-3xl font-bold" style={{ color: 'var(--accent-primary)' }}>{score}</div>
                                <div className="text-sm text-theme-secondary">Загальний рахунок</div>
                            </div>
                            <div className="p-4 bg-theme-tertiary rounded-xl">
                                <div className="text-3xl font-bold" style={{ color: 'var(--accent-primary)' }}>{accuracy}%</div>
                                <div className="text-sm text-theme-secondary">Точність</div>
                            </div>
                            <div className="p-4 bg-theme-tertiary rounded-xl">
                                <div className="text-3xl font-bold text-success">{clicks.good}</div>
                                <div className="text-sm text-theme-secondary">Добрих кліків</div>
                            </div>
                            <div className="p-4 bg-theme-tertiary rounded-xl">
                                <div className="text-3xl font-bold text-danger">{clicks.bad}</div>
                                <div className="text-sm text-theme-secondary">Поганих кліків</div>
                            </div>
                        </div>

                        {accuracy >= 90 && (
                            <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900 dark:bg-opacity-20 rounded-xl">
                                <div className="text-4xl mb-2">🎖️</div>
                                <p className="font-bold text-yellow-700 dark:text-yellow-300">
                                    Майстер фокусування! Чудова точність!
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

export default FocusAvoider;