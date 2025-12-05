import { useState, useCallback, useRef } from 'react';
import storageService from '../services/storageService';
import badgeService from '../services/badgeService';

const GAME_STATUS = {
    IDLE: 'idle',
    READY: 'ready',
    PLAYING: 'playing',
    PAUSED: 'paused',
    FINISHED: 'finished'
};

function useGameState(gameId, initialGameData = {}) {
    const [status, setStatus] = useState(GAME_STATUS.IDLE);
    const [gameData, setGameData] = useState(initialGameData);
    const [score, setScore] = useState(0);
    const sessionStartRef = useRef(null);

    const startGame = useCallback((customData = {}) => {
        setStatus(GAME_STATUS.PLAYING);
        setGameData(prev => ({ ...prev, ...customData }));
        setScore(0);
        sessionStartRef.current = Date.now();
    }, []);

    const pauseGame = useCallback(() => {
        if (status === GAME_STATUS.PLAYING) {
            setStatus(GAME_STATUS.PAUSED);
        }
    }, [status]);

    const resumeGame = useCallback(() => {
        if (status === GAME_STATUS.PAUSED) {
            setStatus(GAME_STATUS.PLAYING);
        }
    }, [status]);

    const finishGame = useCallback((finalData = {}) => {
        setStatus(GAME_STATUS.FINISHED);

        const duration = sessionStartRef.current
            ? Math.floor((Date.now() - sessionStartRef.current) / 1000)
            : 0;

        const sessionData = {
            gameId,
            duration,
            score,
            ...gameData,
            ...finalData
        };

        storageService.addSession(sessionData);

        const earnedBadges = badgeService.checkAndAwardBadges(gameId, sessionData);

        return {
            ...sessionData,
            earnedBadges
        };
    }, [gameId, score, gameData]);

    const resetGame = useCallback(() => {
        setStatus(GAME_STATUS.IDLE);
        setGameData(initialGameData);
        setScore(0);
        sessionStartRef.current = null;
    }, [initialGameData]);

    const updateGameData = useCallback((updates) => {
        setGameData(prev => {
            if (typeof updates === 'function') {
                return updates(prev);
            }
            return { ...prev, ...updates };
        });
    }, []);

    const updateScore = useCallback((newScore) => {
        setScore(prev => {
            if (typeof newScore === 'function') {
                return newScore(prev);
            }
            return newScore;
        });
    }, []);

    const incrementScore = useCallback((amount = 1) => {
        setScore(prev => prev + amount);
    }, []);

    return {
        status,
        gameData,
        score,
        isPlaying: status === GAME_STATUS.PLAYING,
        isPaused: status === GAME_STATUS.PAUSED,
        isFinished: status === GAME_STATUS.FINISHED,
        startGame,
        pauseGame,
        resumeGame,
        finishGame,
        resetGame,
        updateGameData,
        updateScore,
        incrementScore,
        GAME_STATUS
    };
}

export default useGameState;