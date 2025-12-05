import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useProfile } from '../../contexts/ProfileContext.jsx';
import { useTheme } from '../../contexts/ThemeContext.jsx';
import { FaBrain } from 'react-icons/fa6';
import { HiHome, HiUser, HiChartBar, HiTrophy, HiCog } from 'react-icons/hi2';

function Header() {
    const location = useLocation();
    const { profile } = useProfile();
    const { cycleTheme, getCurrentThemeInfo } = useTheme();

    const isActive = (path) => location.pathname === path;

    const navItems = [
        { path: '/', label: 'Меню', icon: <HiHome /> },
        { path: '/profile', label: 'Профіль', icon: <HiUser /> },
        { path: '/dashboard', label: 'Статистика', icon: <HiChartBar /> },
        { path: '/leaderboard', label: 'Рекорди', icon: <HiTrophy /> },
        { path: '/settings', label: 'Налаштування', icon: <HiCog /> }
    ];

    const currentTheme = getCurrentThemeInfo();

    return (
        <header className="sticky top-0 z-40 transition-all duration-300"
                style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderBottom: '1px solid var(--border-color)',
                    boxShadow: 'var(--shadow-md)'
                }}>
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    <Link
                        to="/"
                        className="flex items-center space-x-2 group"
                    >
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-2xl shadow-lg group-hover:scale-110 transition-transform"
                            style={{
                                background: 'var(--gradient-primary)'
                            }}>
                            <FaBrain />
                        </div>
                        <span className="hidden sm:block text-xl font-bold"
                              style={{ color: 'var(--text-primary)' }}>
                            Memory Trainer
                        </span>
                    </Link>
                    <nav className="hidden md:flex items-center space-x-1">
                        {navItems.map(item => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`
                                    flex items-center px-4 py-2 rounded-lg font-medium transition-all duration-200
                                    ${isActive(item.path)
                                    ? 'shadow-md'
                                    : 'hover:opacity-80'
                                }
                                `}
                                style={{
                                    backgroundColor: isActive(item.path) ? 'var(--accent-primary)' : 'transparent',
                                    color: isActive(item.path) ? 'var(--text-inverse)' : 'var(--text-secondary)'
                                }}
                            >
                                <span className="mr-2">{item.icon}</span>
                                <span>{item.label}</span>
                            </Link>
                        ))}
                    </nav>
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={cycleTheme}
                            className="group relative p-2 rounded-lg transition-all duration-200 hover:scale-105"
                            style={{
                                backgroundColor: 'var(--bg-hover)',
                                border: '1px solid var(--border-color)'
                            }}
                            aria-label={`Змінити тему. Поточна: ${currentTheme.name}`}
                            title={`Поточна тема: ${currentTheme.name}`}
                        >
                            <span className="text-2xl transform group-hover:rotate-12 transition-transform duration-300 inline-block">
                                {currentTheme.icon}
                            </span>

                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                                 style={{
                                     backgroundColor: 'var(--bg-card)',
                                     color: 'var(--text-primary)',
                                     boxShadow: 'var(--shadow-lg)',
                                     border: '1px solid var(--border-color)'
                                 }}>
                                {currentTheme.name}
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0"
                                     style={{
                                         borderLeft: '4px solid transparent',
                                         borderRight: '4px solid transparent',
                                         borderTop: '4px solid var(--bg-card)'
                                     }}></div>
                            </div>
                        </button>
                        <Link
                            to="/profile"
                            className="hidden sm:flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 hover:scale-105"
                            style={{
                                backgroundColor: 'var(--bg-hover)',
                                border: '1px solid var(--border-color)'
                            }}
                        >
                            <div
                                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
                                style={{
                                    background: 'var(--gradient-primary)'
                                }}>
                                {profile.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm font-medium"
                                  style={{ color: 'var(--text-primary)' }}>
                                {profile.name}
                            </span>
                        </Link>
                    </div>
                </div>
                <nav className="md:hidden flex overflow-x-auto pb-2 space-x-2 scrollbar-hide">
                    {navItems.map(item => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className="flex items-center flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                            style={{
                                backgroundColor: isActive(item.path) ? 'var(--accent-primary)' : 'var(--bg-hover)',
                                color: isActive(item.path) ? 'var(--text-inverse)' : 'var(--text-secondary)',
                                boxShadow: isActive(item.path) ? 'var(--shadow-md)' : 'none'
                            }}
                        >
                            <span className="mr-1">{item.icon}</span>
                            <span>{item.label}</span>
                        </Link>
                    ))}
                </nav>
            </div>
        </header>
    );
}

export default Header;

