// E:\final\memory-trainer\src\games\NumberSequence\NumberSequence.jsx
// NumberSequence.jsx - Гра на запам'ятовування цифр

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import useGameState from '../../hooks/useGameState';
import { useTheme } from '../../contexts/ThemeContext';
import storageService from '../../services/storageService';

const PHASES = {
    MEMORIZE: 'memorize',
    RECALL: 'recall',
    RESULT: 'result'
};

function NumberSequence() {
    const navigate = useNavigate();
    const { accessibility } = useTheme();
    const gameState = useGameState('number-sequence');

    const [gameStarted, setGameStarted] = useState(false);
    const [phase, setPhase] = useState(PHASES.MEMORIZE);
    const [level, setLevel] = useState(3);
    const [sequence, setSequence] = useState([]);
    const [userInput, setUserInput] = useState([]);
    const [displayTime, setDisplayTime] = useState(3);
    const [correctStreak, setCorrectStreak] = useState(0);
    const [totalAttempts, setTotalAttempts] = useState(0);
    const [incorrectCount, setIncorrectCount] = useState(0);
    const [showResults, setShowResults] = useState(false);
    const [feedback, setFeedback] = useState(null);

    const inputRefs = useRef([]);

    // Генерація послідовності
    const generateSequence = (length) => {
        return Array.from({ length }, () => Math.floor(Math.random() * 10));
    };

    // Початок гри
    const handleStartGame = () => {
        setGameStarted(true);
        gameState.startGame();
        startRound(3);
    };

    // Початок раунду
    const startRound = (currentLevel) => {
        const newSequence = generateSequence(currentLevel);
        setSequence(newSequence);
        setUserInput(Array(currentLevel).fill(''));
        setPhase(PHASES.MEMORIZE);
        setDisplayTime(Math.min(currentLevel, 5)); // Максимум 5 секунд
        setFeedback(null);
    };

    // Таймер показу послідовності
    useEffect(() => {
        if (phase === PHASES.MEMORIZE && displayTime > 0) {
            const timer = setTimeout(() => {
                setDisplayTime(displayTime - 1);
            }, 1000);
            return () => clearTimeout(timer);
        } else if (phase === PHASES.MEMORIZE && displayTime === 0) {
            setPhase(PHASES.RECALL);
            // Фокус на першому інпуті
            setTimeout(() => inputRefs.current[0]?.focus(), 100);
        }
    }, [phase, displayTime]);

    // Обробка введення
    const handleInputChange = (index, value) => {
        if (value.length > 1) return;
        if (value !== '' && !/^\d$/.test(value)) return;

        const newInput = [...userInput];
        newInput[index] = value;
        setUserInput(newInput);

        // Автоматичний перехід до наступного поля
        if (value !== '' && index < sequence.length - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    // Обробка клавіш
    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && userInput[index] === '' && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    // Перевірка відповіді
    const checkAnswer = () => {
        const isCorrect = userInput.every((digit, index) =>
            digit === sequence[index].toString()
        );

        setTotalAttempts(totalAttempts + 1);

        if (isCorrect) {
            setCorrectStreak(correctStreak + 1);
            setFeedback({ type: 'success', message: 'Правильно! 🎉' });

            // Переход на наступний рівень
            setTimeout(() => {
                const nextLevel = level + 1;
                setLevel(nextLevel);
                startRound(nextLevel);
            }, 1500);
        } else {
            setIncorrectCount(incorrectCount + 1);
            setFeedback({
                type: 'error',
                message: `Неправильно. Послідовність була: ${sequence.join(' ')}`
            });

            // Завершити гру після 3 помилок
            if (incorrectCount + 1 >= 3) {
                setTimeout(() => {
                    finishGame();
                }, 2000);
            } else {
                setTimeout(() => {
                    startRound(level);
                }, 2500);
            }
        }
    };

    // Завершення гри
    const finishGame = () => {
        const accuracy = totalAttempts > 0
            ? Math.round((correctStreak / totalAttempts) * 100)
            : 0;

        const results = gameState.finishGame({
            longestSequence: level - 1,
            correctStreak,
            totalAttempts,
            accuracy
        });

        // Оновлення рекордів
        const currentRecords = storageService.getRecords();
        if (!currentRecords.numberSequence.longestSequence ||
            level - 1 > currentRecords.numberSequence.longestSequence) {
            storageService.updateRecord('numberSequence', null, {
                longestSequence: level - 1,
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
                            🔢 Number Sequence
                        </h1>
                        <p className="text-xl text-theme-secondary">
                            Запам'ятайте послідовність цифр
                        </p>
                    </div>

                    <Card className="mb-8 text-center">
                        <div className="text-8xl mb-6">🧠</div>
                        <h2 className="text-3xl font-bold text-theme-primary mb-4">
                            Тренуйте короткочасну пам'ять
                        </h2>
                        <p className="text-lg text-theme-secondary mb-8">
                            Вам покажуть послідовність цифр.<br />
                            Запам'ятайте їх і введіть в правильному порядку.
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
                            <li>• Послідовність показується на кілька секунд</li>
                            <li>• Запам'ятайте порядок цифр</li>
                            <li>• Введіть цифри в правильному порядку</li>
                            <li>• З кожним рівнем довжина послідовності зростає</li>
                            <li>• Гра завершується після 3 помилок</li>
                            <li>• Мета: досягти найдовшої послідовності</li>
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
                            🔢 Number Sequence
                        </h1>
                        <p className="text-theme-secondary">
                            Рівень {level} • {sequence.length} цифр
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
                        <div className="text-2xl mb-1">✅</div>
                        <div className="text-2xl font-bold" style={{ color: 'var(--accent-primary)' }}>{correctStreak}</div>
                        <div className="text-sm text-theme-secondary">Правильних</div>
                    </Card>

                    <Card padding="md" className="text-center">
                        <div className="text-2xl mb-1">❌</div>
                        <div className="text-2xl font-bold text-danger">{incorrectCount}/3</div>
                        <div className="text-sm text-theme-secondary">Помилок</div>
                    </Card>
                </div>

                {/* Game Area */}
                <Card padding="lg" className="min-h-[400px] flex flex-col items-center justify-center">
                    {phase === PHASES.MEMORIZE ? (
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-theme-primary mb-8">
                                Запам'ятайте послідовність
                            </h2>
                            <div className="flex justify-center space-x-4 mb-8">
                                {sequence.map((digit, index) => (
                                    <div
                                        key={index}
                                        className={`
                      w-16 h-20 flex items-center justify-center
                      text-white text-4xl font-bold rounded-xl shadow-lg
                      ${accessibility.animationsEnabled ? 'animate-bounce' : ''}
                    `}
                                        style={{
                                            animationDelay: `${index * 100}ms`,
                                            backgroundColor: 'var(--accent-primary)'
                                        }}
                                    >
                                        {digit}
                                    </div>
                                ))}
                            </div>
                            <div className="text-6xl font-bold" style={{ color: 'var(--accent-primary)' }}>
                                {displayTime}
                            </div>
                            <p className="text-theme-secondary mt-4">
                                секунд до введення
                            </p>
                        </div>
                    ) : (
                        <div className="text-center w-full">
                            <h2 className="text-2xl font-bold text-theme-primary mb-8">
                                Введіть послідовність
                            </h2>
                            <div className="flex justify-center space-x-3 mb-8">
                                {userInput.map((digit, index) => (
                                    <input
                                        key={index}
                                        ref={el => inputRefs.current[index] = el}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleInputChange(index, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(index, e)}
                                        className="
                      w-16 h-20 text-center text-4xl font-bold
                      border-4 border-theme
                      rounded-xl bg-theme-secondary
                      text-theme-primary
                      focus:border-[var(--border-focus)] focus:outline-none
                      transition-colors
                    "
                                    />
                                ))}
                            </div>

                            {feedback && (
                                <div className={`
                  p-4 rounded-xl mb-6 font-bold text-lg
                  ${feedback.type === 'success'
                                    ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                                    : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'}
                  ${accessibility.animationsEnabled ? 'animate-slide-up' : ''}
                `}>
                                    {feedback.message}
                                </div>
                            )}

                            {!feedback && (
                                <Button
                                    size="lg"
                                    onClick={checkAnswer}
                                    disabled={userInput.some(d => d === '')}
                                >
                                    Перевірити
                                </Button>
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
                        <li>• Спробуйте розбити послідовність на групи по 2-3 цифри</li>
                        <li>• Промовляйте цифри вголос під час запам'ятовування</li>
                        <li>• Створюйте асоціації з числами</li>
                    </ul>
                </Card>

                {/* Results Modal */}
                <Modal
                    isOpen={showResults}
                    onClose={() => {}}
                    title="🧠 Результати"
                    showCloseButton={false}
                >
                    <div className="text-center">
                        <div className="text-6xl mb-6">
                            {correctStreak >= 10 ? '🏆' : correctStreak >= 5 ? '🎉' : '👍'}
                        </div>
                        <h3 className="text-2xl font-bold text-theme-primary mb-6">
                            Вітаємо з завершенням!
                        </h3>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="p-4 bg-theme-tertiary rounded-xl">
                                <div className="text-3xl font-bold" style={{ color: 'var(--accent-primary)' }}>{level - 1}</div>
                                <div className="text-sm text-theme-secondary">
                                    Найдовша послідовність
                                </div>
                            </div>
                            <div className="p-4 bg-theme-tertiary rounded-xl">
                                <div className="text-3xl font-bold" style={{ color: 'var(--accent-primary)' }}>{correctStreak}</div>
                                <div className="text-sm text-theme-secondary">
                                    Правильних відповідей
                                </div>
                            </div>
                        </div>

                        {correctStreak >= 10 && (
                            <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900 dark:bg-opacity-20 rounded-xl">
                                <div className="text-4xl mb-2">🎖️</div>
                                <p className="font-bold text-yellow-700 dark:text-yellow-300">
                                    Чудова робота! 10+ правильних відповідей поспіль!
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
                                    setLevel(3);
                                    setCorrectStreak(0);
                                    setTotalAttempts(0);
                                    setIncorrectCount(0);
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

export default NumberSequence;