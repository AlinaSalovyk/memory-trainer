// E:\final\memory-trainer\src\games\MemoryCards\MemoryCards.jsx
// MemoryCards.jsx - Гра "Знайди парочки"

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import useGameState from '../../hooks/useGameState';
import useTimer from '../../hooks/useTimer';
import { useTheme } from '../../contexts/ThemeContext';
import storageService from '../../services/storageService';

const CARD_EMOJIS = ['🍎', '🍌', '🍇', '🍊', '🍓', '🍒', '🍑', '🍍', '🥝', '🥑', '🍆', '🥕', '🌽', '🥔', '🥜', '🍄', '🧀', '🥖', '🥐', '🍕', '🍔', '🌮', '🍿', '🍦', '🍪', '🎂', '🍰', '🧁', '☕', '🍵', '🥤', '🍺'];

const DIFFICULTY_LEVELS = {
    easy: { rows: 4, cols: 4, name: 'Легкий' },
    medium: { rows: 6, cols: 6, name: 'Середній' },
    hard: { rows: 8, cols: 8, name: 'Важкий' }
};

function MemoryCards() {
    const navigate = useNavigate();
    const { accessibility } = useTheme();
    const [difficulty, setDifficulty] = useState(null);
    const [cards, setCards] = useState([]);
    const [flippedCards, setFlippedCards] = useState([]);
    const [matchedCards, setMatchedCards] = useState([]);
    const [moves, setMoves] = useState(0);
    const [hints, setHints] = useState(3);
    const [showResults, setShowResults] = useState(false);
    const [sessionResults, setSessionResults] = useState(null);

    const { time, formattedTime, start: startTimer, pause: pauseTimer, reset: resetTimer } = useTimer();
    const gameState = useGameState('memory-cards');

    // Генерація карт
    const generateCards = (level) => {
        const { rows, cols } = DIFFICULTY_LEVELS[level];
        const totalCards = rows * cols;
        const pairsCount = totalCards / 2;

        const selectedEmojis = CARD_EMOJIS.slice(0, pairsCount);
        const cardPairs = [...selectedEmojis, ...selectedEmojis];

        // Перемішування
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

    // Початок гри
    const handleStartGame = (level) => {
        setDifficulty(level);
        const newCards = generateCards(level);
        setCards(newCards);
        setFlippedCards([]);
        setMatchedCards([]);
        setMoves(0);
        setHints(3);
        resetTimer();
        gameState.startGame({ level });
        startTimer();
    };

    // Клік по карті
    const handleCardClick = (cardId) => {
        if (
            flippedCards.length >= 2 ||
            flippedCards.includes(cardId) ||
            matchedCards.includes(cardId)
        ) {
            return;
        }

        const newFlipped = [...flippedCards, cardId];
        setFlippedCards(newFlipped);

        if (newFlipped.length === 2) {
            setMoves(moves + 1);
            checkMatch(newFlipped);
        }
    };

    // Перевірка співпадіння
    const checkMatch = (flipped) => {
        const [first, second] = flipped;
        const firstCard = cards.find(c => c.id === first);
        const secondCard = cards.find(c => c.id === second);

        if (firstCard.emoji === secondCard.emoji) {
            // Співпадіння!
            setMatchedCards([...matchedCards, first, second]);
            setFlippedCards([]);
        } else {
            // Не співпали
            setTimeout(() => {
                setFlippedCards([]);
            }, 1000);
        }
    };

    // Використання підказки
    const useHint = () => {
        if (hints <= 0 || flippedCards.length > 0) return;

        const unmatchedCards = cards.filter(c => !matchedCards.includes(c.id));
        if (unmatchedCards.length < 2) return;

        // Знайти пару
        const emojiGroups = {};
        unmatchedCards.forEach(card => {
            if (!emojiGroups[card.emoji]) {
                emojiGroups[card.emoji] = [];
            }
            emojiGroups[card.emoji].push(card.id);
        });

        const pairToShow = Object.values(emojiGroups).find(group => group.length >= 2);
        if (pairToShow) {
            setFlippedCards(pairToShow.slice(0, 2));
            setHints(hints - 1);
            setTimeout(() => {
                setFlippedCards([]);
            }, 2000);
        }
    };

    // Перевірка закінчення гри
    useEffect(() => {
        if (difficulty && matchedCards.length === cards.length && cards.length > 0) {
            pauseTimer();

            const results = gameState.finishGame({
                level: difficulty,
                moves,
                time,
                hintsUsed: 3 - hints
            });

            // Оновлення рекордів
            const currentRecords = storageService.getRecords();
            const levelRecord = currentRecords.memoryCards[difficulty];

            if (!levelRecord.bestMoves || moves < levelRecord.bestMoves) {
                storageService.updateRecord('memoryCards', difficulty, { bestMoves: moves });
            }
            if (!levelRecord.bestTime || time < levelRecord.bestTime) {
                storageService.updateRecord('memoryCards', difficulty, { bestTime: time });
            }

            setSessionResults(results);
            setShowResults(true);
        }
    }, [matchedCards, cards.length]);

    // Пауза гри
    const handlePause = () => {
        gameState.pauseGame();
        pauseTimer();
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

    return (
        <Layout>
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-theme-primary">
                            Memory Cards - {DIFFICULTY_LEVELS[difficulty].name}
                        </h1>
                    </div>
                    <div className="flex items-center space-x-4 mt-4 md:mt-0">
                        <Button variant="ghost" onClick={() => navigate('/')}>
                            Вихід
                        </Button>
                        <Button variant="secondary" onClick={handlePause}>
                            ⏸ Пауза
                        </Button>
                    </div>
                </div>

                {/* Stats Bar */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <Card padding="md" className="text-center">
                        <div className="text-2xl mb-1">⏱️</div>
                        <div
                            className="text-2xl font-bold"
                            style={{ color: 'var(--accent-primary)' }}
                        >
                            {formattedTime}
                        </div>
                        <div className="text-sm text-theme-secondary">Час</div>
                    </Card>

                    <Card padding="md" className="text-center">
                        <div className="text-2xl mb-1">👣</div>
                        <div
                            className="text-2xl font-bold"
                            style={{ color: 'var(--accent-primary)' }}
                        >
                            {moves}
                        </div>
                        <div className="text-sm text-theme-secondary">Ходів</div>
                    </Card>

                    <Card padding="md" className="text-center">
                        <div className="text-2xl mb-1">💡</div>
                        <div
                            className="text-2xl font-bold"
                            style={{ color: 'var(--accent-primary)' }}
                        >
                            {hints}
                        </div>
                        <div className="text-sm text-theme-secondary">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={useHint}
                                disabled={hints === 0 || flippedCards.length > 0}
                                className="mt-2"
                            >
                                Підказка
                            </Button>
                        </div>
                    </Card>
                </div>

                {/* Game Board */}
                <Card padding="lg">
                    <div
                        className="grid gap-3"
                        style={{
                            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`
                        }}
                    >
                        {cards.map((card) => {
                            const isFlipped = flippedCards.includes(card.id) || matchedCards.includes(card.id);
                            const isMatched = matchedCards.includes(card.id);

                            return (
                                <button
                                    key={card.id}
                                    onClick={() => handleCardClick(card.id)}
                                    disabled={isMatched}
                                    className={`
                    aspect-square rounded-xl text-4xl font-bold flex items-center justify-center
                    transition-all duration-500 transform
                    ${isFlipped ? 'bg-theme-card' : 'bg-gradient-to-br from-primary to-purple-600'}
                    ${isMatched ? 'opacity-50 cursor-default' : 'hover:scale-105 cursor-pointer'}
                    ${!isFlipped && 'shadow-lg hover:shadow-xl'}
                    ${accessibility.animationsEnabled ? 'animate-flip-card' : ''}
                  `}
                                    style={{
                                        transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                                        transformStyle: 'preserve-3d'
                                    }}
                                >
                  <span style={{ transform: 'rotateY(180deg)' }}>
                    {isFlipped ? card.emoji : '❓'}
                  </span>
                                </button>
                            );
                        })}
                    </div>
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
                                <div className="p-4 bg-theme-tertiary rounded-xl">
                                    <div
                                        className="text-3xl font-bold"
                                        style={{ color: 'var(--accent-primary)' }}
                                    >
                                        {moves}
                                    </div>
                                    <div className="text-sm text-theme-secondary">Ходів</div>
                                </div>
                                <div className="p-4 bg-theme-tertiary rounded-xl">
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
                                <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900 dark:bg-opacity-20 rounded-xl">
                                    <h4 className="font-bold text-theme-primary mb-2">
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