// D:\react\final\memory-trainer\src\games\FocusAvoider\FocusAvoider.jsx
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
const SPAWN_INTERVAL = 1000;
const BASE_SPEED = 2;

function FocusAvoider() {
    const navigate = useNavigate();
    const { accessibility } = useTheme();
    const gameState = useGameState('focusAvoider');
    const { refreshAll } = useProfile();

    const [gameStarted, setGameStarted] = useState(false);
    const [objects, setObjects] = useState([]);
    const [score, setScore] = useState(0);
    const [clicks, setClicks] = useState({ good: 0, bad: 0 });
    const [showResults, setShowResults] = useState(false);
    const [gameArea, setGameArea] = useState({ width: 600, height: 400 });
    const [gameOverReason, setGameOverReason] = useState('time');

    const { time, start: startTimer, stop: stopTimer, reset: resetTimer } = useTimer(GAME_DURATION, true);

    const startTimeRef = useRef(null);
    const animationRef = useRef(null);
    const spawnTimerRef = useRef(null);
    const objectIdRef = useRef(0);
    const gameAreaRef = useRef(null);

    const OBJECT_TYPES = {
        GOOD: { emoji: '🟢', points: 10, color: '#10b981' },
        BAD: { emoji: '🔴', points: -5, color: '#ef4444' }
    };

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

    const handleStartGame = () => {
        setGameStarted(true);
        gameState.startGame();
        setObjects([]);
        setScore(0);
        setClicks({ good: 0, bad: 0 });
        setGameOverReason('time');

        startTimeRef.current = Date.now();

        resetTimer();
        startTimer();
        startSpawning();
    };

    const startSpawning = () => {
        spawnTimerRef.current = setInterval(() => {
            spawnObject();
        }, SPAWN_INTERVAL);
    };

    const spawnObject = () => {
        const isGood = Math.random() > 0.3;
        const type = isGood ? 'GOOD' : 'BAD';

        const elapsedTime = (Date.now() - startTimeRef.current) / 1000;
        const difficultyMultiplier = 1 + (elapsedTime / 20);

        const newObject = {
            id: objectIdRef.current++,
            type,
            x: Math.random() * (gameArea.width - 60),
            y: -60,
            vx: (Math.random() - 0.5) * 2,
            vy: (BASE_SPEED * difficultyMultiplier) + Math.random() * 2,
            size: 40 + Math.random() * 20,
            rotation: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.5) * 2 * difficultyMultiplier
        };

        setObjects(prev => [...prev, newObject]);
    };

    useEffect(() => {
        if (!gameState.isPlaying) return;

        const animate = () => {
            setObjects(prev => {
                const movedObjects = prev.map(obj => ({
                    ...obj,
                    x: obj.x + obj.vx,
                    y: obj.y + obj.vy,
                    rotation: obj.rotation + obj.rotationSpeed
                }));

                const missedGreenObjects = movedObjects.filter(
                    obj => obj.y >= gameArea.height + 100 && obj.type === 'GOOD'
                );

                if (missedGreenObjects.length > 0) {
                    setScore(currentScore => currentScore - (missedGreenObjects.length * 5));
                }

                return movedObjects.filter(obj => obj.y < gameArea.height + 100);
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

    useEffect(() => {
        if (gameState.isPlaying && score < 0) {
            endGame('score');
        }
    }, [score, gameState.isPlaying]);


    useEffect(() => {
        if (time === 0 && gameState.isPlaying) {
            endGame('time');
        }
    }, [time]);


    const handleObjectClick = (e, objectId, type) => {
        e.preventDefault();
        e.stopPropagation();

        const points = OBJECT_TYPES[type].points;
        setScore(prev => prev + points);

        setClicks(prev => ({
            ...prev,
            good: type === 'GOOD' ? prev.good + 1 : prev.good,
            bad: type === 'BAD' ? prev.bad + 1 : prev.bad
        }));

        setObjects(prev => prev.filter(obj => obj.id !== objectId));
    };

    const endGame = (reason = 'time') => {
        stopTimer();
        gameState.pauseGame();
        setGameOverReason(reason);

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

        const survivalTime = GAME_DURATION - time;

        const currentRecords = storageService.getRecords();
        let isNewRecord = false;

        if (reason === 'time' && (!currentRecords.focusAvoider.longestSurvival ||
            survivalTime > currentRecords.focusAvoider.longestSurvival)) {
            storageService.updateRecord('focusAvoider', null, {
                longestSurvival: survivalTime,
                bestAccuracy: accuracy
            });
            isNewRecord = true;
        }

        gameState.finishGame({
            score: score < 0 ? 0 : score,
            survivalTime,
            accuracy,
            goodClicks: clicks.good,
            badClicks: clicks.bad,
            longestSurvival: isNewRecord ? survivalTime : (currentRecords.focusAvoider.longestSurvival || 0)
        });

        refreshAll();
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
                            Пропуск зеленого об'єкта (-10 очок)<br />
                            <span className="text-red-500 font-bold">Якщо рахунок стане менше 0 — ГРУ ЗАКІНЧЕНО!</span><br />
                            Швидкість зростає з часом!
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
                            <li>• ⏬ Пропуск зеленого - (-10 очок)</li>
                            <li>• 💀 Рахунок менше нуля - миттєва поразка</li>
                            <li>• 🚀 Швидкість падіння зростає кожну секунду</li>
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
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-3xl font-bold text-theme-primary">
                        🎯 Focus Avoider
                    </h1>
                    <Button variant="ghost" onClick={() => navigate('/')}>
                        Вихід
                    </Button>
                </div>

                <div className="grid grid-cols-4 gap-4 mb-6">
                    <Card padding="md" className="text-center">
                        <div className="text-2xl mb-1">⏱️</div>
                        <div className="text-2xl font-bold" style={{ color: 'var(--accent-primary)' }}>{time}с</div>
                        <div className="text-sm text-theme-secondary">Час</div>
                    </Card>

                    <Card padding="md" className="text-center">
                        <div className="text-2xl mb-1">🎯</div>
                        {/* Підсвічуємо рахунок червоним, якщо він наближається до 0 */}
                        <div className={`text-2xl font-bold ${score <= 10 ? 'text-red-500 animate-pulse' : ''}`} style={{ color: score > 10 ? 'var(--accent-primary)' : undefined }}>
                            {score}
                        </div>
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

                <Card padding="none">
                    <div
                        ref={gameAreaRef}
                        className="relative bg-theme-tertiary overflow-hidden select-none"
                        style={{ height: '500px', touchAction: 'none' }}
                    >
                        {objects.map(obj => (
                            <button
                                key={obj.id}
                                onPointerDown={(e) => handleObjectClick(e, obj.id, obj.type)}
                                className={`
                                    absolute cursor-pointer transition-transform active:scale-95
                                    ${accessibility.animationsEnabled ? 'hover:scale-110' : ''}
                                `}
                                style={{
                                    left: `${obj.x}px`,
                                    top: `${obj.y}px`,
                                    width: `${obj.size}px`,
                                    height: `${obj.size}px`,
                                    transform: `rotate(${obj.rotation}deg)`,
                                    fontSize: `${obj.size}px`,
                                    lineHeight: 1,
                                    border: 'none',
                                    outline: 'none',
                                    background: 'transparent',
                                    padding: 0,
                                    userSelect: 'none',
                                    WebkitUserSelect: 'none'
                                }}
                            >
                                {OBJECT_TYPES[obj.type].emoji}
                            </button>
                        ))}
                    </div>
                </Card>

                <Modal
                    isOpen={showResults}
                    onClose={() => {}}
                    title={gameOverReason === 'score' ? "💀 Гру закінчено" : "🎯 Результати"}
                    showCloseButton={false}
                >
                    <div className="text-center">
                        <div className="text-6xl mb-6">
                            {gameOverReason === 'score' ? '😵' : (accuracy >= 90 ? '🏆' : '🎉')}
                        </div>

                        <h3 className="text-2xl font-bold text-theme-primary mb-2">
                            {gameOverReason === 'score' ? "Ви втратили всі очки!" : "Час вийшов!"}
                        </h3>

                        {gameOverReason === 'score' && (
                            <p className="text-danger mb-6 font-bold">
                                Будьте уважніші з червоними об'єктами!
                            </p>
                        )}

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="p-4 bg-theme-tertiary rounded-xl">
                                <div className="text-3xl font-bold" style={{ color: 'var(--accent-primary)' }}>{score < 0 ? 0 : score}</div>
                                <div className="text-sm text-theme-secondary">Фінальний рахунок</div>
                            </div>
                            <div className="p-4 bg-theme-tertiary rounded-xl">
                                <div className="text-3xl font-bold" style={{ color: 'var(--accent-primary)' }}>{GAME_DURATION - time}с</div>
                                <div className="text-sm text-theme-secondary">Вижито</div>
                            </div>
                        </div>

                        <div className="flex space-x-4">
                            <Button variant="secondary" onClick={() => navigate('/')} fullWidth>
                                В меню
                            </Button>
                            <Button
                                onClick={() => {
                                    setShowResults(false);
                                    handleStartGame();
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