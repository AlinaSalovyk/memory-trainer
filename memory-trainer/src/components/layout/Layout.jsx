import React from 'react';
import Header from './Header';
import { useTheme } from '../../contexts/ThemeContext.jsx';
import { FaBrain } from 'react-icons/fa6';

function Layout({ children, showHeader = true }) {
    const { accessibility } = useTheme();

    return (
        <div className="min-h-screen bg-theme-primary transition-colors duration-300 flex flex-col">
            {showHeader && <Header />}
            <main className={`
                container mx-auto px-4 py-6 flex-grow {/* Додав flex-grow */}
                ${accessibility.animationsEnabled ? 'animate-fade-in' : ''}
            `}>
                {children}
            </main>
            <footer className="py-6 text-center text-theme-secondary text-sm">
                <p>© 2025 Memory Trainer. Всі права захищені.</p>
                <p className="mt-1 flex items-center justify-center gap-1">
                    Тренуйте пам'ять кожен день! <FaBrain />
                </p>
            </footer>
        </div>
    );
}

export default Layout;