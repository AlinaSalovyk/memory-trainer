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

const PHASES = {
    MEMORIZE: 'memorize',
    RECALL: 'recall',
    RESULT: 'result'
};

const SOUNDS = {
    TICK: 1000,
    CLICK: 400,
    START_RECALL: 600,
    SUCCESS: [523.25, 659.25, 783.99],
    ERROR: 150,
    GAME_OVER: 100
};

function PatternGrid() {
    const navigate = useNavigate();
    const { accessibility } = useTheme();
    const gameState = useGameState('patternGrid');
    const { refreshAll } = useProfile();
    const [gameStarted, setGameStarted] = useState(false);
    const [phase, setPhase] = useState(PHASES.MEMORIZE);
    const [level, setLevel] = useState(1);
    const [gridSize, setGridSize] = useState(3);
    const [pattern, setPattern] = useState([]);
    const [playerPattern, setPlayerPattern] = useState([]);
    const [displayTime, setDisplayTime] = useState(3);
    const [lives, setLives] = useState(3);
    const [showResults, setShowResults] = useState(false);
    const [feedback, setFeedback] = useState(null);
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

            gainNode.gain.setValueAtTime(0.05, audioContextRef.current.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioContextRef.current.currentTime + duration);

            oscillator.start(audioContextRef.current.currentTime);
            oscillator.stop(audioContextRef.current.currentTime + duration);
        } catch (e) {
            console.error("Audio playback error:", e);
        }
    };

    const generatePattern = (size, cellCount) => {
        const totalCells = size * size;
        const pattern = new Set();

        while (pattern.size < cellCount) {
            const cell = Math.floor(Math.random() * totalCells);
            pattern.add(cell);
        }

        return Array.from(pattern);
    };

    const handleStartGame = () => {
        setGameStarted(true);
        gameState.startGame();
        startRound(1, 3);
    };

    const startRound = (currentLevel, size) => {
        const cellCount = Math.min(currentLevel + 2, size * size - 1);
        const newPattern = generatePattern(size, cellCount);

        setLevel(currentLevel);
        setGridSize(size);
        setPattern(newPattern);
        setPlayerPattern([]);
        setPhase(PHASES.MEMORIZE);
        setDisplayTime(Math.max(2, 5 - Math.floor(currentLevel / 3)));
        setFeedback(null);
    };

    useEffect(() => {
        if (phase === PHASES.MEMORIZE && displayTime > 0) {
            playSound(SOUNDS.TICK, 'sine', 0.05);

            const timer = setTimeout(() => {
                setDisplayTime(displayTime - 1);
            }, 1000);
            return () => clearTimeout(timer);
        } else if (phase === PHASES.MEMORIZE && displayTime === 0) {
            playSound(SOUNDS.START_RECALL, 'triangle', 0.2);
            setPhase(PHASES.RECALL);
        }
    }, [phase, displayTime]);

    const handleCellClick = (cellIndex) => {
        if (phase !== PHASES.RECALL) return;

        playSound(SOUNDS.CLICK, 'square', 0.05);

        if (playerPattern.includes(cellIndex)) {
            setPlayerPattern(playerPattern.filter(c => c !== cellIndex));
        } else {
            setPlayerPattern([...playerPattern, cellIndex]);
        }
    };

    const checkAnswer = () => {
        const isCorrect =
            playerPattern.length === pattern.length &&
            playerPattern.every(cell => pattern.includes(cell));

        if (isCorrect) {
            setFeedback({ type: 'success', message: 'Правильно! 🎉' });

            SOUNDS.SUCCESS.forEach((freq, i) => {
                setTimeout(() => playSound(freq, 'sine', 0.2), i * 100);
            });

            setTimeout(() => {
                const nextLevel = level + 1;
                const newSize = Math.min(6, 3 + Math.floor(nextLevel / 3));
                startRound(nextLevel, newSize);
            }, 1500);
        } else {
            const newLives = lives - 1;
            setLives(newLives);
            setFeedback({
                type: 'error',
                message: `Неправильно. Залишилось спроб: ${newLives}`
            });

            playSound(SOUNDS.ERROR, 'sawtooth', 0.4);

            if (newLives === 0) {
                setTimeout(() => {
                    finishGame();
                }, 2000);
            } else {
                setTimeout(() => {
                    startRound(level, gridSize);
                }, 2500);
            }
        }
    };

    const finishGame = () => {
        playSound(SOUNDS.GAME_OVER, 'sawtooth', 0.6);

        const currentRecords = storageService.getRecords();
        let newHighScore = false;

        if (!currentRecords.patternGrid.highestLevel ||
            level > currentRecords.patternGrid.highestLevel) {
            storageService.updateRecord('patternGrid', null, {
                highestLevel: level
            });
            newHighScore = true;
        }

        const results = gameState.finishGame({
            level: level,
            highestLevel: newHighScore ? level : (currentRecords.patternGrid.highestLevel || level)
        });

        refreshAll();
        setShowResults(true);
    };

    const getFeedbackStyles = (type) => {
        const isSuccess = type === 'success';
        return {
            backgroundColor: 'var(--bg-tertiary)',
            color: isSuccess ? 'var(--accent-success)' : 'var(--accent-danger)',
            border: `1px solid ${isSuccess ? 'var(--accent-success)' : 'var(--accent-danger)'}`
        };
    };

    if (!gameStarted) {
        return (
            <Layout>
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-8">
                        <h1 className="text-5xl font-bold text-theme-primary mb-4">
                            🔷 Pattern Memory
                        </h1>
                        <p className="text-xl text-theme-secondary">
                            Запам'ятайте розташування підсвічених клітин
                        </p>
                    </div>

                    <Card className="mb-8 text-center">
                        <div className="text-8xl mb-6">🧩</div>
                        <h2 className="text-3xl font-bold text-theme-primary mb-4">
                            Тренуйте візуальну пам'ять
                        </h2>
                        <p className="text-lg text-theme-secondary mb-8">
                            Запам'ятайте патерн підсвічених клітин на сітці.<br />
                            Потім відтворіть його самостійно.
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
                            <li>• Запам'ятайте розташування підсвічених клітин</li>
                            <li>• Відтворіть патерн, натискаючи на клітини</li>
                            <li>• З кожним рівнем збільшується кількість клітин</li>
                            <li>• Розмір сітки також зростає</li>
                            <li>• У вас є 3 життя</li>
                            <li>• Мета: досягти найвищого рівня</li>
                        </ul>
                    </Card>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-theme-primary">
                            🔷 Pattern Memory
                        </h1>
                        <p className="text-theme-secondary">
                            Рівень {level} • Сітка {gridSize}x{gridSize}
                        </p>
                    </div>
                    <Button variant="ghost" onClick={() => navigate('/')}>
                        Вихід
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <Card padding="md" className="text-center">
                        <div className="text-2xl mb-1">🎯</div>
                        <div className="text-2xl font-bold" style={{ color: 'var(--accent-primary)' }}>{level}</div>
                        <div className="text-sm text-theme-secondary">Рівень</div>
                    </Card>

                    <Card padding="md" className="text-center">
                        <div className="text-2xl mb-1">❤️</div>
                        <div className="text-2xl font-bold" style={{ color: 'var(--accent-danger)' }}>
                            {'❤️'.repeat(lives)}
                        </div>
                        <div className="text-sm text-theme-secondary">Життя</div>
                    </Card>

                    <Card padding="md" className="text-center">
                        <div className="text-2xl mb-1">📊</div>
                        <div className="text-2xl font-bold" style={{ color: 'var(--accent-primary)' }}>{pattern.length}</div>
                        <div className="text-sm text-theme-secondary">Клітин</div>
                    </Card>
                </div>

                {/* Game Area */}
                <Card padding="lg">
                    {phase === PHASES.MEMORIZE ? (
                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-bold text-theme-primary mb-4">
                                Запам'ятайте патерн
                            </h2>
                            <div className="text-5xl font-bold mb-2" style={{ color: 'var(--accent-primary)' }}>
                                {displayTime}
                            </div>
                            <p className="text-theme-secondary">секунд</p>
                        </div>
                    ) : (
                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-bold text-theme-primary mb-2">
                                Відтворіть патерн
                            </h2>
                            <p className="text-theme-secondary">
                                Натискайте на клітини
                            </p>
                        </div>
                    )}

                    {/* Grid */}
                    <div
                        className="grid gap-2 mx-auto mb-6"
                        style={{
                            gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
                            maxWidth: `${gridSize * 70}px`
                        }}
                    >
                        {Array.from({ length: gridSize * gridSize }).map((_, index) => {
                            const isInPattern = pattern.includes(index);
                            const isSelected = playerPattern.includes(index);
                            const showPattern = phase === PHASES.MEMORIZE;
                            const isActive = (showPattern && isInPattern) || (!showPattern && isSelected);
                            const isInteractable = phase === PHASES.RECALL;

                            return (
                                <button
                                    key={index}
                                    onClick={() => handleCellClick(index)}
                                    disabled={phase === PHASES.MEMORIZE}
                                    className={`
                                        aspect-square rounded-xl transition-all duration-200
                                        ${isActive ? 'shadow-lg' : ''}
                                        ${isInteractable
                                        ? 'hover:scale-105 cursor-pointer'
                                        : 'cursor-not-allowed'}
                                        ${accessibility.animationsEnabled && isActive ? 'animate-pulse-slow' : ''}
                                    `}
                                    style={{
                                        backgroundColor: isActive
                                            ? 'var(--accent-primary)'
                                            : 'var(--bg-secondary)',
                                        border: isActive ? 'none' : '2px solid var(--border-color)',
                                        boxShadow: (!isActive && isInteractable) ? 'none' : undefined,
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isActive && isInteractable) {
                                            e.currentTarget.style.borderColor = 'var(--accent-primary)';
                                            e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!isActive && isInteractable) {
                                            e.currentTarget.style.borderColor = 'var(--border-color)';
                                            e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                                        }
                                    }}
                                />
                            );
                        })}
                    </div>

                    {/* Feedback */}
                    {feedback && (
                        <div
                            className={`
                                p-4 rounded-xl mb-6 font-bold text-lg text-center
                                ${accessibility.animationsEnabled ? 'animate-slide-up' : ''}
                            `}
                            style={getFeedbackStyles(feedback.type)}
                        >
                            {feedback.message}
                        </div>
                    )}

                    {/* Controls */}
                    {phase === PHASES.RECALL && !feedback && (
                        <div className="flex space-x-4">
                            <Button
                                variant="secondary"
                                onClick={() => setPlayerPattern([])}
                                fullWidth
                            >
                                Очистити
                            </Button>
                            <Button
                                onClick={checkAnswer}
                                disabled={playerPattern.length === 0}
                                fullWidth
                            >
                                Перевірити ({playerPattern.length}/{pattern.length})
                            </Button>
                        </div>
                    )}
                </Card>

                {/* Tips */}
                <Card className="mt-6">
                    <h3 className="text-lg font-bold text-theme-primary mb-3">
                        💡 Підказки
                    </h3>
                    <ul className="text-sm text-theme-secondary space-y-1">
                        <li>• Шукайте візуальні патерни (лінії, форми, групи)</li>
                        <li>• Запам'ятовуйте координати клітин (рядок, стовпець)</li>
                        <li>• Розділяйте сітку на сектори для легшого запам'ятовування</li>
                    </ul>
                </Card>

                {/* Results Modal */}
                <Modal
                    isOpen={showResults}
                    onClose={() => {}}
                    title="🔷 Результати"
                    showCloseButton={false}
                >
                    <div className="text-center">
                        <div className="text-6xl mb-6">
                            {level >= 10 ? '🏆' : level >= 5 ? '🎉' : '👍'}
                        </div>
                        <h3 className="text-2xl font-bold text-theme-primary mb-6">
                            Чудова спроба!
                        </h3>

                        <div className="p-6 rounded-xl mb-6" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                            <div className="text-5xl font-bold mb-2" style={{ color: 'var(--accent-primary)' }}>{level}</div>
                            <div className="text-theme-secondary">
                                Досягнутий рівень
                            </div>
                        </div>

                        {level >= 10 && (
                            <div
                                className="mb-6 p-4 rounded-xl border"
                                style={{
                                    backgroundColor: 'var(--bg-tertiary)',
                                    borderColor: 'var(--accent-warning)'
                                }}
                            >
                                <div className="text-4xl mb-2">🎖️</div>
                                <p className="font-bold" style={{ color: 'var(--accent-warning)' }}>
                                    Експерт візуальної пам'яті!
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
                                    setLevel(1);
                                    setLives(3);
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

export default PatternGrid;