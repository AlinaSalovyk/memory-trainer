import React, { useEffect } from 'react'; // Додаємо useEffect
import Header from './Header';
import { useTheme } from '../../contexts/ThemeContext.jsx';
import { FaBrain } from 'react-icons/fa6';

function Layout({ children, showHeader = true }) {
    const { accessibility, toggleSound } = useTheme();
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

            if (e.code === 'KeyM') {
                toggleSound();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [toggleSound]);

    return (
        <div className="min-h-screen bg-theme-primary transition-colors duration-300 flex flex-col">
            {showHeader && <Header />}
            <main className={`
                container mx-auto px-4 py-6 flex-grow
                ${accessibility.animationsEnabled ? 'animate-fade-in' : ''}
            `}>
                {children}
            </main>
            <footer className="py-6 text-center text-theme-secondary text-sm">
                <p>© 2025 Memory Trainer. Всі права захищені.</p>
                <p className="mt-1 flex items-center justify-center gap-1">
                    Тренуйте пам'ять кожен день! <FaBrain />
                </p>
                <p className="mt-2 text-xs opacity-50">
                    Гарячі клавіші: 'M' - звук, 'P' - пауза
                </p>
            </footer>
        </div>
    );
}

export default Layout;