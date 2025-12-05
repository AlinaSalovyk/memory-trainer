import React, { createContext, useContext, useEffect, useState } from 'react';
import storageService from '../services/storageService';
import { HiSun, HiMoon, HiBolt } from 'react-icons/hi2';
import { FaWater } from 'react-icons/fa6';

const ThemeContext = createContext();

export const THEMES = {
    LIGHT: 'light',
    DARK: 'dark',
    HIGH_CONTRAST: 'high-contrast',
    OCEAN: 'ocean'
};

export const THEME_INFO = {
    [THEMES.LIGHT]: {
        name: 'Світла',
        icon: <HiSun />,
        description: 'Класична світла тема'
    },
    [THEMES.DARK]: {
        name: 'Темна',
        icon: <HiMoon />,
        description: 'Комфортна для очей у темряві'
    },
    [THEMES.HIGH_CONTRAST]: {
        name: 'Висококонтрастна',
        icon: <HiBolt />,
        description: 'Максимальний контраст для людей з вадами зору'
    },
    [THEMES.OCEAN]: {
        name: 'Морська',
        icon: <FaWater />,
        description: 'Спокійна морська атмосфера'
    }
};

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(() => {
        const profile = storageService.getProfile();
        return profile.theme || THEMES.LIGHT;
    });

    const [accessibility, setAccessibility] = useState(() => {
        const profile = storageService.getProfile();
        return profile.accessibility || {
            highContrast: false,
            animationsEnabled: true,
            soundEnabled: true,
            fontSize: 'normal'
        };
    });

    useEffect(() => {
        const root = document.documentElement;

        Object.values(THEMES).forEach(t => root.classList.remove(t));

        if (theme !== THEMES.LIGHT) {
            root.classList.add(theme);
        }

        root.setAttribute('data-theme', theme);

        const profile = storageService.getProfile();
        storageService.updateProfile({
            ...profile,
            theme
        });

        if (accessibility.animationsEnabled) {
            root.style.transition = 'background-color 0.4s ease, color 0.4s ease';
        }
    }, [theme, accessibility.animationsEnabled]);

    useEffect(() => {
        const root = document.documentElement;

        root.classList.remove('text-size-small', 'text-size-normal', 'text-size-large', 'text-size-xlarge');
        root.classList.add(`text-size-${accessibility.fontSize}`);

        if (!accessibility.animationsEnabled) {
            root.style.setProperty('--animation-duration', '0.01ms');
        } else {
            root.style.removeProperty('--animation-duration');
        }

        const profile = storageService.getProfile();
        storageService.updateProfile({
            ...profile,
            accessibility
        });
    }, [accessibility]);

    const changeTheme = (newTheme) => {
        if (Object.values(THEMES).includes(newTheme)) {
            setTheme(newTheme);

            // Анімація зміни теми
            if (accessibility.animationsEnabled) {
                document.body.classList.add('theme-transitioning');
                setTimeout(() => {
                    document.body.classList.remove('theme-transitioning');
                }, 400);
            }
        }
    };

    const cycleTheme = () => {
        const themes = Object.values(THEMES);
        const currentIndex = themes.indexOf(theme);
        const nextIndex = (currentIndex + 1) % themes.length;
        changeTheme(themes[nextIndex]);
    };

    const updateAccessibility = (updates) => {
        setAccessibility(prev => ({
            ...prev,
            ...updates
        }));
    };

    const toggleAnimations = () => {
        updateAccessibility({
            animationsEnabled: !accessibility.animationsEnabled
        });
    };

    const toggleSound = () => {
        updateAccessibility({
            soundEnabled: !accessibility.soundEnabled
        });
    };

    const changeFontSize = (size) => {
        const validSizes = ['small', 'normal', 'large', 'xlarge'];
        if (validSizes.includes(size)) {
            updateAccessibility({ fontSize: size });
        }
    };

    const getCurrentThemeInfo = () => {
        return THEME_INFO[theme];
    };

    const value = {
        theme,
        changeTheme,
        cycleTheme,
        accessibility,
        updateAccessibility,
        toggleAnimations,
        toggleSound,
        changeFontSize,
        isDark: theme === THEMES.DARK,
        isHighContrast: theme === THEMES.HIGH_CONTRAST,
        isOcean: theme === THEMES.OCEAN,
        getCurrentThemeInfo,
        THEMES,
        THEME_INFO
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return context;
}

export default ThemeContext;