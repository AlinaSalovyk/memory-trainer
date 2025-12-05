// E:\final\memory-trainer\src\games\SimonSays\SimonSays.jsx
// SimonSays.jsx - Гра "Повтори послідовність кольорів"

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import useGameState from '../../hooks/useGameState';
import { useTheme } from '../../contexts/ThemeContext';
import storageService from '../../services/storageService';

const COLORS = [
    { id: 0, name: 'Червоний', color: '#ef4444', sound: 261.63 },
    { id: 1, name: 'Синій', color: '#3b82f6', sound: 329.63 },
    { id: 2, name: 'Зелений', color: '#10b981', sound: 392.00 },
    { id: 3, name: 'Жовтий', color: '#f59e0b', sound: 523.25 }
];

const PHASES = {
    READY: 'ready',
    SHOWING: 'showing',
    PLAYER_TURN: 'player_turn',
    GAME_OVER: 'game_over'
};

function SimonSays() {
    const navigate = useNavigate();
    const { accessibility } = useTheme();
    const gameState = useGameState('simon-says');

    const [gameStarted, setGameStarted] = useState(false);
    const [phase, setPhase] = useState(PHASES.READY);
    const [sequence, setSequence] = useState([]);
    const [playerSequence, setPlayerSequence] = useState([]);
    const [level, setLevel] = useState(1);
    const [activeColor, setActiveColor] = useState(null);
    const [showResults, setShowResults] = useState(false);
    const [isPlayingSequence, setIsPlayingSequence] = useState(false);

    const audioContextRef = useRef(null);

    // Ініціалізація AudioContext
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

    // Відтворення звуку
    const playSound = (frequency) => {
        if (!accessibility.soundEnabled || !audioContextRef.current) return;

        const oscillator = audioContextRef.current.createOscillator();
        const gainNode = audioContextRef.current.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContextRef.current.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, audioContextRef.current.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.3);

        oscillator.start(audioContextRef.current.currentTime);
        oscillator.stop(audioContextRef.current.currentTime + 0.3);
    };

    // Початок гри
    const handleStartGame = () => {
        setGameStarted(true);
        gameState.startGame();
        setSequence([]);
        setPlayerSequence([]);
        setLevel(1);
        startNewRound([]);
    };

    // Новий раунд
    const startNewRound = (currentSequence) => {
        const newColor = Math.floor(Math.random() * 4);
        const newSequence = [...currentSequence, newColor];
        setSequence(newSequence);
        setPlayerSequence([]);
        setPhase(PHASES.SHOWING);
        setIsPlayingSequence(true);
        playSequence(newSequence);
    };

    // Показ послідовності
    const playSequence = async (seq) => {
        for (let i = 0; i < seq.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 400));
            setActiveColor(seq[i]);
            playSound(COLORS[seq[i]].sound);
            await new Promise(resolve => setTimeout(resolve, 400));
            setActiveColor(null);
        }
        setIsPlayingSequence(false);
        setPhase(PHASES.PLAYER_TURN);
    };

    // Клік гравця
    const handleColorClick = (colorId) => {
        if (phase !== PHASES.PLAYER_TURN || isPlayingSequence) return;

        setActiveColor(colorId);
        playSound(COLORS[colorId].sound);
        setTimeout(() => setActiveColor(null), 300);

        const newPlayerSequence = [...playerSequence, colorId];
        setPlayerSequence(newPlayerSequence);

        // Перевірка правильності
        if (newPlayerSequence[newPlayerSequence.length - 1] !== sequence[newPlayerSequence.length - 1]) {
            // Помилка
            setTimeout(() => {
                setPhase(PHASES.GAME_OVER);
                finishGame();
            }, 500);
        } else if (newPlayerSequence.length === sequence.length) {
            // Правильно, наступний рівень
            setTimeout(() => {
                setLevel(level + 1);
                startNewRound(sequence);
            }, 1000);
        }
    };

    // Завершення гри
    const finishGame = () => {
        const longestSequence = sequence.length;

        const results = gameState.finishGame({
            longestSequence,
            level
        });

        // Оновлення рекордів
        const currentRecords = storageService.getRecords();
        if (!currentRecords.simonSays.longestSequence ||
            longestSequence > currentRecords.simonSays.longestSequence) {
            storageService.updateRecord('simonSays', null, {
                longestSequence
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
                            🎨 Simon Says
                        </h1>
                        <p className="text-xl text-theme-secondary">
                            Повторіть кольорову послідовність
                        </p>
                    </div>

                    <Card className="mb-8 text-center">
                        <div className="text-8xl mb-6">🎵</div>
                        <h2 className="text-3xl font-bold text-theme-primary mb-4">
                            Класична гра на пам'ять
                        </h2>
                        <p className="text-lg text-theme-secondary mb-8">
                            Запам'ятайте послідовність кольорів і повторіть її.<br />
                            З кожним рівнем додається ще один колір.
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
                            <li>• Спостерігайте за послідовністю кольорів</li>
                            <li>• Повторіть послідовність, натискаючи на кольори</li>
                            <li>• З кожним рівнем додається новий колір</li>
                            <li>• Гра закінчується після першої помилки</li>
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
                            🎨 Simon Says
                        </h1>
                        <p className="text-theme-secondary">
                            {phase === PHASES.SHOWING && 'Дивіться уважно...'}
                            {phase === PHASES.PLAYER_TURN && 'Ваша черга!'}
                            {phase === PHASES.READY && 'Приготуйтесь...'}
                        </p>
                    </div>
                    <Button variant="ghost" onClick={() => navigate('/')}>
                        Вихід
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <Card padding="md" className="text-center">
                        <div className="text-2xl mb-1">🎯</div>
                        <div className="text-2xl font-bold" style={{ color: 'var(--accent-primary)' }}>{level}</div>
                        <div className="text-sm text-theme-secondary">Рівень</div>
                    </Card>

                    <Card padding="md" className="text-center">
                        <div className="text-2xl mb-1">📊</div>
                        <div className="text-2xl font-bold" style={{ color: 'var(--accent-primary)' }}>{sequence.length}</div>
                        <div className="text-sm text-theme-secondary">Довжина послідовності</div>
                    </Card>
                </div>

                {/* Game Board */}
                <Card padding="lg">
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        {COLORS.map((color) => (
                            <button
                                key={color.id}
                                onClick={() => handleColorClick(color.id)}
                                disabled={phase !== PHASES.PLAYER_TURN || isPlayingSequence}
                                className={`
                  aspect-square rounded-2xl font-bold text-2xl
                  transition-all duration-200 transform
                  ${phase === PHASES.PLAYER_TURN && !isPlayingSequence
                                    ? 'hover:scale-105 cursor-pointer'
                                    : 'cursor-not-allowed opacity-75'}
                  ${activeColor === color.id
                                    ? 'scale-110 shadow-2xl brightness-150'
                                    : 'shadow-lg'}
                  ${accessibility.animationsEnabled ? '' : ''}
                `}
                                style={{
                                    backgroundColor: color.color,
                                    opacity: activeColor === color.id ? 1 : 0.8
                                }}
                                aria-label={color.name}
                            >
                                <span className="text-white drop-shadow-lg">
                                    {color.name}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Player Progress */}
                    {phase === PHASES.PLAYER_TURN && playerSequence.length > 0 && (
                        <div className="text-center">
                            <p className="text-theme-secondary mb-2">
                                Ваш прогрес: {playerSequence.length} / {sequence.length}
                            </p>
                            <div className="flex justify-center space-x-2">
                                {sequence.map((_, index) => (
                                    <div
                                        key={index}
                                        className="w-4 h-4 rounded-full"
                                        style={{
                                            backgroundColor: index < playerSequence.length
                                                ? 'var(--accent-primary)'
                                                : 'var(--bg-tertiary, #e2e8f0)' // Fallback for bg-theme-tertiary
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </Card>

                {/* Tips */}
                <Card className="mt-6">
                    <h3 className="text-lg font-bold text-theme-primary mb-3">
                        💡 Підказки
                    </h3>
                    <ul className="text-sm text-theme-secondary space-y-1">
                        <li>• Промовляйте кольори вголос для кращого запам'ятовування</li>
                        <li>• Звертайте увагу не тільки на кольори, а й на звуки</li>
                        <li>• Розбивайте довгі послідовності на частини</li>
                    </ul>
                </Card>

                {/* Results Modal */}
                <Modal
                    isOpen={showResults}
                    onClose={() => {}}
                    title="🎨 Результати"
                    showCloseButton={false}
                >
                    <div className="text-center">
                        <div className="text-6xl mb-6">
                            {sequence.length >= 20 ? '🏆' : sequence.length >= 10 ? '🎉' : '👍'}
                        </div>
                        <h3 className="text-2xl font-bold text-theme-primary mb-6">
                            Чудова спроба!
                        </h3>

                        <div className="p-6 bg-theme-tertiary rounded-xl mb-6">
                            <div className="text-5xl font-bold mb-2" style={{ color: 'var(--accent-primary)' }}>
                                {sequence.length}
                            </div>
                            <div className="text-theme-secondary">
                                Кольорів у послідовності
                            </div>
                        </div>

                        {sequence.length >= 20 && (
                            <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900 dark:bg-opacity-20 rounded-xl">
                                <div className="text-4xl mb-2">🎖️</div>
                                <p className="font-bold text-yellow-700 dark:text-yellow-300">
                                    Майстер Simon! Неймовірна пам'ять!
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
                                    setSequence([]);
                                    setPlayerSequence([]);
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

export default SimonSays;