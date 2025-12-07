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

const CARD_EMOJIS = ['🍎', '🍌', '🍇', '🍊', '🍓', '🍒', '🍑', '🍍', '🥝', '🥑', '🍆', '🥕', '🌽', '🥔', '🥜', '🍄', '🧀', '🥖', '🥐', '🍕', '🍔', '🌮', '🍿', '🍦', '🍪', '🎂', '🍰', '🧁', '☕', '🍵', '🥤', '🍺'];

const DIFFICULTY_LEVELS = {
    easy: { rows: 4, cols: 4, name: 'Легкий' },
    medium: { rows: 6, cols: 6, name: 'Середній' },
    hard: { rows: 8, cols: 8, name: 'Важкий' }
};

const SOUNDS = {
    FLIP: 400,
    MATCH: 880,
    MISMATCH: 150,
    HINT: 1200,
    WIN_NOTES: [523.25, 659.25, 783.99, 1046.50]
};

function MemoryCards() {
    const navigate = useNavigate();
    const { accessibility } = useTheme();
    const { refreshAll } = useProfile();
    const [difficulty, setDifficulty] = useState(null);
    const [cards, setCards] = useState([]);
    const [flippedCards, setFlippedCards] = useState([]);
    const [matchedCards, setMatchedCards] = useState([]);
    const [moves, setMoves] = useState(0);
    const [hints, setHints] = useState(3);
    const [showResults, setShowResults] = useState(false);
    const [sessionResults, setSessionResults] = useState(null);
    const [isHintActive, setIsHintActive] = useState(false);
    const { time, formattedTime, start: startTimer, pause: pauseTimer, resume: resumeTimer, reset: resetTimer } = useTimer();
    const gameState = useGameState('memoryCards');
    const audioContextRef = useRef(null);

    useEffect(() => {
        if (gameState.isPaused) {
            pauseTimer();
        } else if (gameState.isPlaying && difficulty) {
            resumeTimer();
        }
    }, [gameState.isPaused, gameState.isPlaying, pauseTimer, resumeTimer, difficulty]);

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

    const playSound = (frequency, type = 'sine', duration = 0.1, slideTo = null) => {
        if (!accessibility.soundEnabled || !audioContextRef.current) return;

        try {
            const oscillator = audioContextRef.current.createOscillator();
            const gainNode = audioContextRef.current.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContextRef.current.destination);

            oscillator.frequency.value = frequency;
            oscillator.type = type;

            if (slideTo) {
                oscillator.frequency.exponentialRampToValueAtTime(slideTo, audioContextRef.current.currentTime + duration);
            }

            gainNode.gain.setValueAtTime(0.1, audioContextRef.current.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioContextRef.current.currentTime + duration);

            oscillator.start(audioContextRef.current.currentTime);
            oscillator.stop(audioContextRef.current.currentTime + duration);
        } catch (e) {
            console.error("Audio playback error:", e);
        }
    };

    const generateCards = (level) => {
        const { rows, cols } = DIFFICULTY_LEVELS[level];
        const totalCards = rows * cols;
        const pairsCount = totalCards / 2;

        const selectedEmojis = CARD_EMOJIS.slice(0, pairsCount);
        const cardPairs = [...selectedEmojis, ...selectedEmojis];

        const shuffled = cardPairs
            .map((emoji, index) => ({
                id: index,
                emoji,
                isFlipped: false,
                isMatched: false
            }))
            .sort(() => Math.random() - 0.5);

        return shuffled;
    };

    const handleStartGame = (level) => {
        setDifficulty(level);
        const newCards = generateCards(level);
        setCards(newCards);
        setFlippedCards([]);
        setMatchedCards([]);
        setMoves(0);
        setHints(3);
        setIsHintActive(false);
        resetTimer();
        gameState.startGame({ level });
        startTimer();
        playSound(SOUNDS.FLIP, 'sine', 0.2, 600);
    };

    const handleCardClick = (cardId) => {
        if (
            gameState.isPaused ||
            isHintActive ||
            flippedCards.length >= 2 ||
            flippedCards.includes(cardId) ||
            matchedCards.includes(cardId)
        ) {
            return;
        }
        playSound(SOUNDS.FLIP, 'sine', 0.1, 500);

        const newFlipped = [...flippedCards, cardId];
        setFlippedCards(newFlipped);

        if (newFlipped.length === 2) {
            setMoves(moves + 1);
            checkMatch(newFlipped);
        }
    };

    const checkMatch = (flipped) => {
        const [first, second] = flipped;
        const firstCard = cards.find(c => c.id === first);
        const secondCard = cards.find(c => c.id === second);

        if (firstCard.emoji === secondCard.emoji) {
            setTimeout(() => playSound(SOUNDS.MATCH, 'triangle', 0.3), 100);

            setMatchedCards([...matchedCards, first, second]);
            setFlippedCards([]);
        } else {
            setTimeout(() => playSound(SOUNDS.MISMATCH, 'sawtooth', 0.2), 300);

            setTimeout(() => {
                setFlippedCards([]);
            }, 1000);
        }
    };

    const useHint = () => {
        if (hints <= 0 || gameState.isPaused || isHintActive) return;

        const unmatchedCards = cards.filter(c => !matchedCards.includes(c.id));
        if (unmatchedCards.length < 2) return;
        playSound(SOUNDS.HINT, 'sine', 0.5, 800);

        const emojiGroups = {};
        unmatchedCards.forEach(card => {
            if (!emojiGroups[card.emoji]) {
                emojiGroups[card.emoji] = [];
            }
            emojiGroups[card.emoji].push(card.id);
        });

        const pairToShow = Object.values(emojiGroups).find(group => group.length >= 2);

        if (pairToShow) {
            setIsHintActive(true);
            setFlippedCards([]);
            setTimeout(() => {
                setFlippedCards([pairToShow[0], pairToShow[1]]);
                setHints(hints - 1);
                setTimeout(() => {
                    setFlippedCards([]);
                    setIsHintActive(false);
                }, 1500);
            }, 100);
        }
    };

    const togglePause = () => {
        if (gameState.isPaused) {
            gameState.resumeGame();
        } else {
            gameState.pauseGame();
        }
    };

    useEffect(() => {
        if (difficulty && matchedCards.length === cards.length && cards.length > 0) {
            pauseTimer();
            SOUNDS.WIN_NOTES.forEach((freq, i) => {
                setTimeout(() => playSound(freq, 'triangle', 0.2), i * 150);
            });

            const currentRecords = storageService.getRecords();
            const levelRecord = currentRecords.memoryCards[difficulty];
            let isNewBestMoves = false;

            if (!levelRecord.bestMoves || moves < levelRecord.bestMoves) {
                storageService.updateRecord('memoryCards', difficulty, { bestMoves: moves });
                isNewBestMoves = true;
            }
            if (!levelRecord.bestTime || time < levelRecord.bestTime) {
                storageService.updateRecord('memoryCards', difficulty, { bestTime: time });
            }

            const results = gameState.finishGame({
                level: difficulty,
                moves,
                time,
                hintsUsed: 3 - hints,
                bestMoves: isNewBestMoves ? moves : (levelRecord.bestMoves || moves)
            });

            refreshAll();
            setSessionResults(results);
            setShowResults(true);
        }
    }, [matchedCards, cards.length, difficulty, moves, time, hints, pauseTimer, gameState, refreshAll]);

    const getGridSettings = () => {
        switch (difficulty) {
            case 'hard': // 8x8
                return {
                    maxWidth: '460px',
                    gap: '4px',
                    fontSize: '1.2rem'
                };
            case 'medium': // 6x6
                return {
                    maxWidth: '420px',
                    gap: '8px',
                    fontSize: '1.8rem'
                };
            case 'easy': // 4x4
            default:
                return {
                    maxWidth: '380px',
                    gap: '12px',
                    fontSize: '2.5rem'
                };
        }
    };

    if (!difficulty) {
        return (
            <Layout>
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-8">
                        <h1 className="text-5xl font-bold text-theme-primary mb-4">
                            🃏 Memory Cards
                        </h1>
                        <p className="text-xl text-theme-secondary">
                            Знайдіть всі парочки карт
                        </p>
                    </div>

                    <Card className="mb-8 text-center">
                        <h2 className="text-2xl font-bold text-theme-primary mb-4">
                            Оберіть рівень складності
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {Object.entries(DIFFICULTY_LEVELS).map(([key, level]) => (
                                <Card
                                    key={key}
                                    hoverable
                                    padding="lg"
                                    onClick={() => handleStartGame(key)}
                                    className="cursor-pointer text-center"
                                >
                                    <div className="text-5xl mb-4">
                                        {key === 'easy' && '🟢'}
                                        {key === 'medium' && '🟡'}
                                        {key === 'hard' && '🔴'}
                                    </div>
                                    <h3 className="text-2xl font-bold text-theme-primary mb-2">
                                        {level.name}
                                    </h3>
                                    <p className="text-theme-secondary">
                                        {level.rows}x{level.cols} ({level.rows * level.cols} карт)
                                    </p>
                                </Card>
                            ))}
                        </div>
                    </Card>

                    <Card>
                        <h3 className="text-xl font-bold text-theme-primary mb-4">
                            📖 Правила гри
                        </h3>
                        <ul className="space-y-2 text-theme-secondary">
                            <li>• Перевертайте по дві карти за раз</li>
                            <li>• Знайдіть всі парочки однакових емодзі</li>
                            <li>• Намагайтеся запам'ятати розташування карт</li>
                            <li>• У вас є 3 підказки на кожну гру</li>
                            <li>• Мета: знайти всі пари за найменшу кількість ходів</li>
                        </ul>
                    </Card>
                </div>
            </Layout>
        );
    }

    const { rows, cols } = DIFFICULTY_LEVELS[difficulty];
    const gridSettings = getGridSettings();

    return (
        <Layout>
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row items-center justify-between mb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-theme-primary">
                            Memory Cards - {DIFFICULTY_LEVELS[difficulty].name}
                        </h1>
                    </div>
                    <div className="flex items-center space-x-4 mt-2 md:mt-0">
                        <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
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

                {/* Stats Bar */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                    <Card padding="sm" className="text-center">
                        <div className="text-xl mb-1">⏱️</div>
                        <div
                            className="text-xl font-bold"
                            style={{ color: 'var(--accent-primary)' }}
                        >
                            {formattedTime}
                        </div>
                        <div className="text-xs text-theme-secondary">Час</div>
                    </Card>

                    <Card padding="sm" className="text-center">
                        <div className="text-xl mb-1">👣</div>
                        <div
                            className="text-xl font-bold"
                            style={{ color: 'var(--accent-primary)' }}
                        >
                            {moves}
                        </div>
                        <div className="text-xs text-theme-secondary">Ходів</div>
                    </Card>

                    <Card padding="sm" className="text-center">
                        <div className="text-xl mb-1">💡</div>
                        <div
                            className="text-xl font-bold"
                            style={{ color: 'var(--accent-primary)' }}
                        >
                            {hints}
                        </div>
                        <div className="text-xs text-theme-secondary">
                            <Button
                                size="xs"
                                variant="outline"
                                onClick={useHint}
                                disabled={hints === 0 || gameState.isPaused || isHintActive || matchedCards.length === cards.length}
                                className="mt-1"
                            >
                                Підказка
                            </Button>
                        </div>
                    </Card>
                </div>

                {/* Game Board */}
                <Card padding="md" className="relative flex justify-center overflow-hidden">
                    <div
                        className={`grid transition-opacity duration-300 mx-auto ${gameState.isPaused ? 'opacity-20 blur-sm pointer-events-none' : ''}`}
                        style={{
                            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                            width: '100%',
                            maxWidth: gridSettings.maxWidth,
                            gap: gridSettings.gap
                        }}
                    >
                        {cards.map((card) => {
                            const isFlipped = flippedCards.includes(card.id) || matchedCards.includes(card.id);
                            const isMatched = matchedCards.includes(card.id);

                            return (
                                <button
                                    key={card.id}
                                    onClick={() => handleCardClick(card.id)}
                                    disabled={isMatched || gameState.isPaused} // Захист від кліків під час паузи
                                    className={`
                                        aspect-square rounded-lg font-bold flex items-center justify-center
                                        transition-all duration-500 transform
                                        ${isMatched ? 'opacity-50 cursor-default' : 'hover:scale-105 cursor-pointer'}
                                        ${!isFlipped && !isMatched && !gameState.isPaused && 'shadow hover:shadow-md'}
                                        ${accessibility.animationsEnabled ? 'animate-flip-card' : ''}
                                    `}
                                    style={{
                                        fontSize: gridSettings.fontSize,
                                        transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                                        transformStyle: 'preserve-3d',
                                        background: isFlipped ? 'var(--bg-card)' : 'var(--gradient-primary)',
                                        border: isFlipped ? '1px solid var(--border-color)' : 'none',
                                        boxShadow: !isFlipped ? 'var(--shadow-sm)' : 'none'
                                    }}
                                >
                                    <span style={{ transform: 'rotateY(180deg)' }}>
                                        {isFlipped ? card.emoji : '❓'}
                                    </span>
                                </button>
                            );
                        })}
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
                </Card>

                {/* Results Modal */}
                <Modal
                    isOpen={showResults}
                    onClose={() => {}}
                    title="🎉 Вітаємо!"
                    showCloseButton={false}
                >
                    {sessionResults && (
                        <div className="text-center">
                            <div className="text-6xl mb-6">🏆</div>
                            <h3 className="text-2xl font-bold text-theme-primary mb-6">
                                Ви знайшли всі парочки!
                            </h3>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                                    <div
                                        className="text-3xl font-bold"
                                        style={{ color: 'var(--accent-primary)' }}
                                    >
                                        {moves}
                                    </div>
                                    <div className="text-sm text-theme-secondary">Ходів</div>
                                </div>
                                <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                                    <div
                                        className="text-3xl font-bold"
                                        style={{ color: 'var(--accent-primary)' }}
                                    >
                                        {formattedTime}
                                    </div>
                                    <div className="text-sm text-theme-secondary">Час</div>
                                </div>
                            </div>

                            {sessionResults.earnedBadges?.length > 0 && (
                                <div
                                    className="mb-6 p-4 rounded-xl border"
                                    style={{
                                        backgroundColor: 'var(--bg-tertiary)',
                                        borderColor: 'var(--accent-warning)'
                                    }}
                                >
                                    <h4 className="font-bold mb-2" style={{ color: 'var(--accent-warning)' }}>
                                        Нові бейджі! 🎖️
                                    </h4>
                                    <div className="flex justify-center space-x-2">
                                        {sessionResults.earnedBadges.map(badge => (
                                            <span key={badge.id} className="text-4xl">{badge.icon}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex space-x-4">
                                <Button
                                    variant="secondary"
                                    onClick={() => navigate('/')}
                                    fullWidth
                                >
                                    В меню
                                </Button>
                                <Button
                                    onClick={() => {
                                        setShowResults(false);
                                        handleStartGame(difficulty);
                                    }}
                                    fullWidth
                                >
                                    Ще раз
                                </Button>
                            </div>
                        </div>
                    )}
                </Modal>
            </div>
        </Layout>
    );
}

export default MemoryCards;