import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { ProfileProvider } from './contexts/ProfileContext';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Dashboard from './pages/Dashboard';
import Leaderboard from './pages/Leaderboard';
import Settings from './pages/Settings';
import MemoryCards from './games/MemoryCards/MemoryCards';
import FocusClicker from './games/FocusClicker/FocusClicker';
import NumberSequence from './games/NumberSequence/NumberSequence';
import SimonSays from './games/SimonSays/SimonSays';
import PatternGrid from './games/PatternGrid/PatternGrid';
import WordRecall from './games/WordRecall/WordRecall';
import FocusAvoider from './games/FocusAvoider/FocusAvoider';
import DualTask from './games/DualTask/DualTask';

function App() {
    return (
        <Router>
            <ThemeProvider>
                <ProfileProvider>
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/leaderboard" element={<Leaderboard />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/game/memory-cards" element={<MemoryCards />} />
                        <Route path="/game/focus-clicker" element={<FocusClicker />} />
                        <Route path="/game/number-sequence" element={<NumberSequence />} />
                        <Route path="/game/simon-says" element={<SimonSays />} />
                        <Route path="/game/pattern-grid" element={<PatternGrid />} />
                        <Route path="/game/word-recall" element={<WordRecall />} />
                        <Route path="/game/focus-avoider" element={<FocusAvoider />} />
                        <Route path="/game/dual-task" element={<DualTask />} />
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </ProfileProvider>
            </ThemeProvider>
        </Router>
    );
}

function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="text-center">
                <div className="text-9xl mb-4">🤔</div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                    Сторінка не знайдена
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mb-8">
                    На жаль, ця сторінка не існує
                </p>
                <a
                    href="/"
                    className="inline-block px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-colors"
                >
                    Повернутися на головну
                </a>
            </div>
        </div>
    );
}

export default App;