import { useState, useEffect, useRef, useCallback } from 'react';

function useTimer(initialTime = 0, countDown = false) {
    const [time, setTime] = useState(initialTime);
    const [isRunning, setIsRunning] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const intervalRef = useRef(null);
    const startTimeRef = useRef(null);
    const pausedTimeRef = useRef(0);

    const start = useCallback(() => {
        if (!isRunning) {
            setIsRunning(true);
            setIsPaused(false);
            startTimeRef.current = Date.now() - pausedTimeRef.current;
        }
    }, [isRunning]);

    const pause = useCallback(() => {
        if (isRunning && !isPaused) {
            setIsPaused(true);
            pausedTimeRef.current = Date.now() - startTimeRef.current;
        }
    }, [isRunning, isPaused]);

    const resume = useCallback(() => {
        if (isRunning && isPaused) {
            setIsPaused(false);
            startTimeRef.current = Date.now() - pausedTimeRef.current;
        }
    }, [isRunning, isPaused]);

    const stop = useCallback(() => {
        setIsRunning(false);
        setIsPaused(false);
        pausedTimeRef.current = 0;
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    const reset = useCallback(() => {
        stop();
        setTime(initialTime);
    }, [initialTime, stop]);


    const setCustomTime = useCallback((newTime) => {
        setTime(newTime);
        pausedTimeRef.current = 0;
    }, []);

    useEffect(() => {
        if (isRunning && !isPaused) {
            intervalRef.current = setInterval(() => {
                const elapsed = Date.now() - startTimeRef.current;

                if (countDown) {
                    const remaining = Math.max(0, initialTime - Math.floor(elapsed / 1000));
                    setTime(remaining);

                    if (remaining === 0) {
                        stop();
                    }
                } else {
                    setTime(Math.floor(elapsed / 1000));
                }
            }, 100);

            return () => {
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                }
            };
        }
    }, [isRunning, isPaused, countDown, initialTime, stop]);

    const formatTime = useCallback((seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }, []);

    return {
        time,
        formattedTime: formatTime(time),
        isRunning,
        isPaused,
        start,
        pause,
        resume,
        stop,
        reset,
        setTime: setCustomTime
    };
}

export default useTimer;