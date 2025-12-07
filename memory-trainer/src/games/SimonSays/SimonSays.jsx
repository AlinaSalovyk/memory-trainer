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

const SOUNDS = {
    GAME_OVER: 150,
    SUCCESS: [523.25, 659.25, 783.99, 1046.50]
};

function SimonSays() {
    const navigate = useNavigate();
    const { accessibility } = useTheme();
    const gameState = useGameState('simonSays');
    const { refreshAll } = useProfile();
    const [gameStarted, setGameStarted] = useState(false);
    const [phase, setPhase] = useState(PHASES.READY);
    const [sequence, setSequence] = useState([]);
    const [playerSequence, setPlayerSequence] = useState([]);
    const [level, setLevel] = useState(1);
    const [activeColor, setActiveColor] = useState(null);
    const [showResults, setShowResults] = useState(false);
    const [isPlayingSequence, setIsPlayingSequence] = useState(false);

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

    const playSound = (frequency, type = 'sine', duration = 0.3) => {
        if (!accessibility.soundEnabled || !audioContextRef.current) return;

        try {
            const oscillator = audioContextRef.current.createOscillator();
            const gainNode = audioContextRef.current.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContextRef.current.destination);

            oscillator.frequency.value = frequency;
            oscillator.type = type;

            gainNode.gain.setValueAtTime(0.3, audioContextRef.current.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + duration);

            oscillator.start(audioContextRef.current.currentTime);
            oscillator.stop(audioContextRef.current.currentTime + duration);
        } catch (e) {
            console.error("Audio playback error:", e);
        }
    };

    const handleStartGame = () => {
        setGameStarted(true);
        gameState.startGame();
        setSequence([]);
        setPlayerSequence([]);
        setLevel(1);
        startNewRound([]);
    };

    const startNewRound = (currentSequence) => {
        const newColor = Math.floor(Math.random() * 4);
        const newSequence = [...currentSequence, newColor];
        setSequence(newSequence);
        setPlayerSequence([]);
        setPhase(PHASES.SHOWING);
        setIsPlayingSequence(true);
        setTimeout(() => playSequence(newSequence), 500);
    };

    const playSequence = async (seq) => {
        const speed = Math.max(200, 600 - seq.length * 20);

        for (let i = 0; i < seq.length; i++) {
            setActiveColor(seq[i]);
            playSound(COLORS[seq[i]].sound, 'sine', speed / 1000);
            await new Promise(resolve => setTimeout(resolve, speed));
            setActiveColor(null);
            await new Promise(resolve => setTimeout(resolve, speed / 2));
        }
        setIsPlayingSequence(false);
        setPhase(PHASES.PLAYER_TURN);
    };

    const handleColorClick = (colorId) => {
        if (phase !== PHASES.PLAYER_TURN || isPlayingSequence) return;

        setActiveColor(colorId);
        playSound(COLORS[colorId].sound);
        setTimeout(() => setActiveColor(null), 200);

        const newPlayerSequence = [...playerSequence, colorId];
        setPlayerSequence(newPlayerSequence);

        if (newPlayerSequence[newPlayerSequence.length - 1] !== sequence[newPlayerSequence.length - 1]) {

            setTimeout(() => {
                playSound(SOUNDS.GAME_OVER, 'sawtooth', 0.6);
                setPhase(PHASES.GAME_OVER);
                finishGame();
            }, 300);
        } else if (newPlayerSequence.length === sequence.length) {
            setTimeout(() => {
                SOUNDS.SUCCESS.forEach((freq, i) => {
                    setTimeout(() => playSound(freq, 'sine', 0.2), i * 100);
                });

                setLevel(level + 1);
                startNewRound(sequence);
            }, 500);
        }
    };

    const finishGame = () => {
        const longestSequence = sequence.length;
        const currentRecords = storageService.getRecords();
        let isNewRecord = false;

        if (!currentRecords.simonSays.longestSequence ||
            longestSequence > currentRecords.simonSays.longestSequence) {
            storageService.updateRecord('simonSays', null, {
                longestSequence
            });
            isNewRecord = true;
        }

        gameState.finishGame({
            longestSequence,
            bestLongestSequence: isNewRecord ? longestSequence : (currentRecords.simonSays.longestSequence || longestSequence),
            level
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
                    <div className="grid grid-cols-2 gap-4 mb-6 max-w-md mx-auto">
                        {COLORS.map((color) => (
                            <button
                                key={color.id}
                                onPointerDown={(e) => { e.preventDefault(); handleColorClick(color.id); }}
                                disabled={phase !== PHASES.PLAYER_TURN || isPlayingSequence}
                                className={`
                                  aspect-square rounded-2xl font-bold text-2xl
                                  transition-all duration-100 transform
                                  ${phase === PHASES.PLAYER_TURN && !isPlayingSequence
                                    ? 'hover:scale-105 cursor-pointer active:scale-95'
                                    : 'cursor-not-allowed opacity-75'}
                                  ${activeColor === color.id
                                    ? 'scale-105 shadow-[0_0_20px_rgba(255,255,255,0.5)] brightness-125'
                                    : 'shadow-lg border-4 border-transparent'}
                                `}
                                style={{
                                    backgroundColor: color.color,
                                    opacity: activeColor === color.id ? 1 : 0.8,
                                    borderColor: activeColor === color.id ? 'var(--text-inverse)' : 'transparent',
                                    borderWidth: activeColor === color.id ? '4px' : '0',
                                    touchAction: 'none'
                                }}
                                aria-label={color.name}
                            >
                                <span className="text-white drop-shadow-md text-4xl opacity-50">
                                    {color.id === 0 && '🔴'}
                                    {color.id === 1 && '🔵'}
                                    {color.id === 2 && '🟢'}
                                    {color.id === 3 && '🟡'}
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
                                        className="w-4 h-4 rounded-full transition-colors duration-300"
                                        style={{
                                            backgroundColor: index < playerSequence.length
                                                ? 'var(--accent-primary)'
                                                : 'var(--bg-tertiary)',
                                            border: index < playerSequence.length
                                                ? 'none'
                                                : '1px solid var(--border-color)'
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
                            {sequence.length >= 10 ? '🏆' : sequence.length >= 5 ? '🎉' : '👍'}
                        </div>
                        <h3 className="text-2xl font-bold text-theme-primary mb-6">
                            Чудова спроба!
                        </h3>

                        <div className="p-6 rounded-xl mb-6" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                            <div className="text-5xl font-bold mb-2" style={{ color: 'var(--accent-primary)' }}>
                                {sequence.length}
                            </div>
                            <div className="text-theme-secondary">
                                Кольорів у послідовності
                            </div>
                        </div>

                        {sequence.length >= 10 && (
                            <div
                                className="mb-6 p-4 rounded-xl border"
                                style={{
                                    backgroundColor: 'var(--bg-tertiary)',
                                    borderColor: 'var(--accent-warning)'
                                }}
                            >
                                <div className="text-4xl mb-2">🎖️</div>
                                <p className="font-bold" style={{ color: 'var(--accent-warning)' }}>
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