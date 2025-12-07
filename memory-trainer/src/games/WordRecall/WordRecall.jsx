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

// Словник українських слів
const WORDS = [
    'СОНЦЕ', 'МІСЯЦЬ', 'ЗІРКА', 'ХМАРА', 'ВІТЕР', 'ДОЩ', 'СНІГ', 'ГРОЗА',
    'МОРЕ', 'РІКА', 'ОЗЕРО', 'ГОРА', 'ЛІСИ', 'ПОЛЕ', 'СТЕП', 'ДОЛИНА',
    'КВІТКА', 'ДЕРЕВО', 'ТРАВА', 'ЛИСТЯ', 'КОРІНЬ', 'ГІЛКА', 'ПЛІД', 'НАСІННЯ',
    'СОБАКА', 'КІШКА', 'ПТАХ', 'РИБА', 'КОРОВА', 'КІНЬ', 'ВІВЦЯ', 'КОЗА',
    'ХЛІБ', 'ВОДА', 'МОЛОКО', 'МАСЛО', 'СИР', 'М\'ЯСО', 'ОВОЧІ', 'ФРУКТИ',
    'БУДИНОК', 'ВІКНО', 'ДВЕРІ', 'СТІНА', 'ПІДЛОГА', 'СТЕЛЯ', 'ДАХОВІ', 'БАЛКОН',
    'КНИГА', 'ЗОШИТ', 'РУЧКА', 'ОЛІВЕЦЬ', 'ПАПІР', 'СТІЛ', 'СТІЛЕЦЬ', 'ШАФА',
    'ЛІТАК', 'ПОЇЗД', 'ЧОВЕН', 'МАШИНА', 'ВЕЛИК', 'МОТОР', 'ТРАМВАЙ', 'МЕТРО',
    'МУЗИКА', 'ПІСНЯ', 'ТАНЕЦЬ', 'ТЕАТР', 'КІНО', 'СПОРТ', 'ФУТБОЛ', 'БАСКЕТ',
    'ВЕСНА', 'ЛІТО', 'ОСІНЬ', 'ЗИМА', 'РАНОК', 'ДЕНЬ', 'ВЕЧІР', 'НІЧ'
];

const PHASES = {
    DISPLAY: 'display',
    RECALL: 'recall',
    RESULT: 'result'
};

const SOUNDS = {
    TICK: 1000,
    TYPE: 800,
    START_RECALL: 600,
    SUCCESS: [523.25, 659.25, 783.99],
    ERROR: 150,
    HINT: 1200,
    GAME_OVER: 100
};

function WordRecall() {
    const navigate = useNavigate();
    const { accessibility } = useTheme();
    const gameState = useGameState('wordRecall');
    const { refreshAll } = useProfile();
    const [gameStarted, setGameStarted] = useState(false);
    const [phase, setPhase] = useState(PHASES.DISPLAY);
    const [currentWord, setCurrentWord] = useState('');
    const [maskedWord, setMaskedWord] = useState('');
    const [userInput, setUserInput] = useState('');
    const [correctStreak, setCorrectStreak] = useState(0);
    const [totalAttempts, setTotalAttempts] = useState(0);
    const [incorrectCount, setIncorrectCount] = useState(0);
    const [displayTime, setDisplayTime] = useState(3);
    const [showResults, setShowResults] = useState(false);
    const [feedback, setFeedback] = useState(null);
    const [usedWords, setUsedWords] = useState([]);
    const [hints, setHints] = useState(3);
    const inputRef = useRef(null);
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

    const getRandomWord = () => {
        const availableWords = WORDS.filter(w => !usedWords.includes(w));
        if (availableWords.length === 0) {
            setUsedWords([]);
            return WORDS[Math.floor(Math.random() * WORDS.length)];
        }
        return availableWords[Math.floor(Math.random() * availableWords.length)];
    };

    const maskWord = (word) => {
        const length = word.length;
        const lettersToRemove = Math.min(Math.ceil(length / 2), length - 1);
        const indices = new Set();

        while (indices.size < lettersToRemove) {
            indices.add(Math.floor(Math.random() * length));
        }

        return word.split('').map((char, index) =>
            indices.has(index) ? '_' : char
        ).join('');
    };

    const handleStartGame = () => {
        setGameStarted(true);
        gameState.startGame();
        setUsedWords([]);
        setCorrectStreak(0);
        setTotalAttempts(0);
        setIncorrectCount(0);
        setHints(3);
        startRound();
    };


    const startRound = () => {
        const word = getRandomWord();
        setCurrentWord(word);
        setUserInput('');
        setPhase(PHASES.DISPLAY);
        setDisplayTime(3);
        setFeedback(null);
        setUsedWords([...usedWords, word]);
    };

    useEffect(() => {
        if (phase === PHASES.DISPLAY && displayTime > 0) {
            playSound(SOUNDS.TICK, 'sine', 0.05);

            const timer = setTimeout(() => {
                setDisplayTime(displayTime - 1);
            }, 1000);
            return () => clearTimeout(timer);
        } else if (phase === PHASES.DISPLAY && displayTime === 0) {
            playSound(SOUNDS.START_RECALL, 'triangle', 0.2);

            const masked = maskWord(currentWord);
            setMaskedWord(masked);
            setPhase(PHASES.RECALL);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [phase, displayTime]);

    const checkAnswer = () => {
        const isCorrect = userInput.toUpperCase() === currentWord;
        setTotalAttempts(totalAttempts + 1);

        if (isCorrect) {
            setCorrectStreak(correctStreak + 1);
            setFeedback({ type: 'success', message: 'Правильно! 🎉' });

            SOUNDS.SUCCESS.forEach((freq, i) => {
                setTimeout(() => playSound(freq, 'sine', 0.2), i * 100);
            });

            setTimeout(() => {
                startRound();
            }, 1500);
        } else {
            setIncorrectCount(incorrectCount + 1);
            setFeedback({
                type: 'error',
                message: `Неправильно. Слово було: ${currentWord}`
            });

            playSound(SOUNDS.ERROR, 'sawtooth', 0.4);

            if (incorrectCount + 1 >= 3) {
                setTimeout(() => {
                    finishGame();
                }, 2500);
            } else {
                setTimeout(() => {
                    startRound();
                }, 3000);
            }
        }
    };

    const showHint = () => {
        if (hints <= 0) return;

        playSound(SOUNDS.HINT, 'sine', 0.3);

        const missingIndices = maskedWord
            .split('')
            .map((char, index) => char === '_' ? index : -1)
            .filter(index => index !== -1);

        if (missingIndices.length > 0) {
            const randomIndex = missingIndices[Math.floor(Math.random() * missingIndices.length)];
            const newMasked = maskedWord.split('');
            newMasked[randomIndex] = currentWord[randomIndex];
            setMaskedWord(newMasked.join(''));
            setHints(hints - 1);
        }
    };


    const finishGame = () => {
        playSound(SOUNDS.GAME_OVER, 'sawtooth', 0.8);

        const accuracy = totalAttempts > 0
            ? Math.round((correctStreak / totalAttempts) * 100)
            : 0;

        const currentRecords = storageService.getRecords();
        let isNewRecord = false;

        if (!currentRecords.wordRecall.bestStreak ||
            correctStreak > currentRecords.wordRecall.bestStreak) {
            storageService.updateRecord('wordRecall', null, {
                bestStreak: correctStreak
            });
            isNewRecord = true;
        }

        gameState.finishGame({
            correctStreak,
            totalAttempts,
            accuracy,
            bestStreak: isNewRecord ? correctStreak : (currentRecords.wordRecall.bestStreak || correctStreak)
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

    const handleInputChange = (e) => {
        const newValue = e.target.value.toUpperCase();

        if (newValue.length > userInput.length) {
            playSound(SOUNDS.TYPE, 'square', 0.05);
        }

        setUserInput(newValue);
    };

    if (!gameStarted) {
        return (
            <Layout>
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-8">
                        <h1 className="text-5xl font-bold text-theme-primary mb-4">
                            📝 Word Recall
                        </h1>
                        <p className="text-xl text-theme-secondary">
                            Запам'ятайте слово та заповніть пропуски
                        </p>
                    </div>

                    <Card className="mb-8 text-center">
                        <div className="text-8xl mb-6">📚</div>
                        <h2 className="text-3xl font-bold text-theme-primary mb-4">
                            Тренуйте вербальну пам'ять
                        </h2>
                        <p className="text-lg text-theme-secondary mb-8">
                            Вам покажуть слово на кілька секунд.<br />
                            Потім потрібно згадати пропущені літери.
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
                            <li>• Запам'ятайте слово, яке показується на екрані</li>
                            <li>• Заповніть пропущені літери</li>
                            <li>• <strong>У вас є лише 3 підказки на всю гру</strong></li>
                            <li>• Гра завершується після 3 помилок</li>
                            <li>• Мета: максимальна серія правильних відповідей</li>
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
                    <h1 className="text-3xl font-bold text-theme-primary">
                        📝 Word Recall
                    </h1>
                    <Button variant="ghost" onClick={() => navigate('/')}>
                        Вихід
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                    <Card padding="md" className="text-center">
                        <div className="text-2xl mb-1">🔥</div>
                        <div className="text-2xl font-bold" style={{ color: 'var(--accent-primary)' }}>{correctStreak}</div>
                        <div className="text-sm text-theme-secondary">Серія</div>
                    </Card>

                    <Card padding="md" className="text-center">
                        <div className="text-2xl mb-1">✅</div>
                        <div className="text-2xl font-bold" style={{ color: 'var(--accent-primary)' }}>
                            {totalAttempts > 0 ? Math.round((correctStreak / totalAttempts) * 100) : 0}%
                        </div>
                        <div className="text-sm text-theme-secondary">Точність</div>
                    </Card>

                    <Card padding="md" className="text-center">
                        <div className="text-2xl mb-1">💡</div>
                        <div className="text-2xl font-bold" style={{ color: 'var(--accent-warning)' }}>
                            {hints}
                        </div>
                        <div className="text-sm text-theme-secondary">Підказок</div>
                    </Card>

                    <Card padding="md" className="text-center">
                        <div className="text-2xl mb-1">❌</div>
                        <div className="text-2xl font-bold" style={{ color: 'var(--accent-danger)' }}>
                            {incorrectCount}/3
                        </div>
                        <div className="text-sm text-theme-secondary">Помилок</div>
                    </Card>
                </div>

                {/* Game Area */}
                <Card padding="lg" className="min-h-[400px] flex flex-col items-center justify-center">
                    {phase === PHASES.DISPLAY ? (
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-theme-primary mb-8">
                                Запам'ятайте слово
                            </h2>
                            <div className={`
                                            text-6xl font-bold mb-8
                                            ${accessibility.animationsEnabled ? 'animate-pulse' : ''}
                                          `} style={{ color: 'var(--accent-primary)' }}>
                                {currentWord}
                            </div>
                            <div className="text-5xl font-bold text-theme-primary">
                                {displayTime}
                            </div>
                            <p className="text-theme-secondary mt-4">
                                секунд
                            </p>
                        </div>
                    ) : (
                        <div className="text-center w-full">
                            <h2 className="text-2xl font-bold text-theme-primary mb-8">
                                Заповніть пропущені літери
                            </h2>

                            {/* Masked Word Display */}
                            <div className="text-5xl font-mono font-bold text-theme-primary mb-8 tracking-wider">
                                {maskedWord}
                            </div>

                            {/* Input */}
                            <div className="max-w-md mx-auto mb-6">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={userInput}
                                    onChange={handleInputChange}
                                    onKeyPress={(e) => e.key === 'Enter' && !feedback && checkAnswer()}
                                    placeholder="Введіть слово"
                                    className="
                                        w-full px-6 py-4 text-2xl text-center font-bold uppercase
                                        border-2 rounded-xl
                                        focus:outline-none transition-colors
                                      "
                                    style={{
                                        backgroundColor: 'var(--bg-secondary)',
                                        color: 'var(--text-primary)',
                                        borderColor: 'var(--border-color)',
                                    }}
                                    disabled={feedback !== null}
                                />
                            </div>

                            {/* Feedback */}
                            {feedback && (
                                <div
                                    className={`
                                      p-4 rounded-xl mb-6 font-bold text-lg
                                      ${accessibility.animationsEnabled ? 'animate-slide-up' : ''}
                                    `}
                                    style={getFeedbackStyles(feedback.type)}
                                >
                                    {feedback.message}
                                </div>
                            )}

                            {/* Controls */}
                            {!feedback && (
                                <div className="flex space-x-4 max-w-md mx-auto">
                                    <Button
                                        variant="secondary"
                                        onClick={showHint}
                                        disabled={hints <= 0 || maskedWord.indexOf('_') === -1}
                                    >
                                        💡 Підказка ({hints})
                                    </Button>
                                    <Button
                                        onClick={checkAnswer}
                                        disabled={userInput.length === 0}
                                        fullWidth
                                    >
                                        Перевірити
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </Card>

                {/* Tips */}
                <Card className="mt-6">
                    <h3 className="text-lg font-bold text-theme-primary mb-3">
                        💡 Підказки
                    </h3>
                    <ul className="text-sm text-theme-secondary space-y-1">
                        <li>• Промовляйте слово вголос для кращого запам'ятовування</li>
                        <li>• Асоціюйте слово з образами або емоціями</li>
                        <li>• Звертайте увагу на довжину слова</li>
                    </ul>
                </Card>

                {/* Results Modal */}
                <Modal
                    isOpen={showResults}
                    onClose={() => {}}
                    title="📝 Результати"
                    showCloseButton={false}
                >
                    <div className="text-center">
                        <div className="text-6xl mb-6">
                            {correctStreak >= 15 ? '🏆' : correctStreak >= 8 ? '🎉' : '👍'}
                        </div>
                        <h3 className="text-2xl font-bold text-theme-primary mb-6">
                            Чудова спроба!
                        </h3>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                                <div className="text-3xl font-bold" style={{ color: 'var(--accent-primary)' }}>{correctStreak}</div>
                                <div className="text-sm text-theme-secondary">
                                    Правильних поспіль
                                </div>
                            </div>
                            <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                                <div className="text-3xl font-bold" style={{ color: 'var(--accent-primary)' }}>
                                    {totalAttempts > 0 ? Math.round((correctStreak / totalAttempts) * 100) : 0}%
                                </div>
                                <div className="text-sm text-theme-secondary">Точність</div>
                            </div>
                        </div>

                        {correctStreak >= 15 && (
                            <div
                                className="mb-6 p-4 rounded-xl border"
                                style={{
                                    backgroundColor: 'var(--bg-tertiary)',
                                    borderColor: 'var(--accent-warning)'
                                }}
                            >
                                <div className="text-4xl mb-2">🎖️</div>
                                <p className="font-bold" style={{ color: 'var(--accent-warning)' }}>
                                    Чарівник слів! Фантастична серія!
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
                                    setCorrectStreak(0);
                                    setTotalAttempts(0);
                                    setIncorrectCount(0);
                                    setHints(3);
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

export default WordRecall;