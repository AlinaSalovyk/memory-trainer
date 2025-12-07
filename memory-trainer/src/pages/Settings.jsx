import React, { useState } from 'react';
import {
    FaPalette,
    FaCheck,
    FaUniversalAccess,
    FaFont,
    FaLightbulb,
    FaFileLines,
    FaTrashCan
} from 'react-icons/fa6';
import Layout from '../components/layout/Layout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { useTheme, THEMES, THEME_INFO } from '../contexts/ThemeContext';
import { useProfile } from '../contexts/ProfileContext';

function Settings() {
    const { theme, changeTheme, accessibility, updateAccessibility } = useTheme();
    const { clearAllData } = useProfile();
    const [showClearModal, setShowClearModal] = useState(false);

    const handleClearData = () => {
        if (clearAllData()) {
            setShowClearModal(false);
            alert('Всі дані успішно очищено!');
        }
    };

    const ToggleSwitch = ({ enabled, onChange, label }) => (
        <div className="flex items-center justify-between py-3">
            <span className="font-medium text-theme-primary">{label}</span>
            <button
                onClick={() => onChange(!enabled)}
                className="relative w-14 h-8 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2"
                style={{
                    backgroundColor: enabled ? 'var(--accent-primary)' : 'var(--border-color)',
                    outlineColor: 'var(--border-focus)'
                }}
                aria-label={label}
                role="switch"
                aria-checked={enabled}
            >
                <span
                    className="absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-200"
                    style={{
                        transform: enabled ? 'translateX(24px)' : 'translateX(0)'
                    }}
                />
            </button>
        </div>
    );

    return (
        <Layout>
            <div className="max-w-3xl mx-auto">
                <h1 className="text-4xl font-bold mb-2 text-theme-primary">
                    Налаштування
                </h1>
                <p className="mb-8 text-theme-secondary">
                    Персоналізуйте свій досвід використання застосунку
                </p>

                <Card className="mb-6">
                    <div className="flex items-center mb-6">
                        <FaPalette className="mr-3 text-4xl text-primary" />
                        <div>
                            <h2 className="text-2xl font-bold text-theme-primary">
                                Тема інтерфейсу
                            </h2>
                            <p className="text-sm text-theme-secondary">
                                Оберіть комфортний для вас вигляд
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(THEME_INFO).map(([themeKey, themeData]) => (
                            <button
                                key={themeKey}
                                onClick={() => changeTheme(themeKey)}
                                className="group relative p-6 rounded-xl border-2 transition-all duration-300 text-left overflow-hidden"
                                style={{
                                    borderColor: theme === themeKey ? 'var(--accent-primary)' : 'var(--border-color)',
                                    backgroundColor: theme === themeKey ? 'var(--bg-hover)' : 'var(--bg-card)',
                                    boxShadow: theme === themeKey ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
                                    transform: theme === themeKey ? 'scale(1.02)' : 'scale(1)'
                                }}
                            >
                                {theme === themeKey && (
                                    <div className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center"
                                         style={{ backgroundColor: 'var(--accent-success)' }}>
                                        <FaCheck className="text-white text-sm" />
                                    </div>
                                )}

                                <div className="text-5xl mb-3 group-hover:scale-110 transition-transform duration-300">
                                    {themeData.icon}
                                </div>

                                <div className="font-bold text-lg mb-1 text-theme-primary">
                                    {themeData.name}
                                </div>

                                <div className="text-sm text-theme-secondary">
                                    {themeData.description}
                                </div>
                            </button>
                        ))}
                    </div>
                </Card>

                <Card className="mb-6">
                    <h2 className="text-2xl font-bold mb-4 flex items-center text-theme-primary">
                        <FaFont className="mr-2" />
                        Розмір шрифту
                    </h2>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { size: 'small', label: 'Малий', scale: 'text-sm' },
                            { size: 'normal', label: 'Звичайний', scale: 'text-base' },
                            { size: 'large', label: 'Великий', scale: 'text-lg' },
                            { size: 'xlarge', label: 'Дуже великий', scale: 'text-xl' }
                        ].map(({ size, label, scale }) => (
                            <button
                                key={size}
                                onClick={() => updateAccessibility({ fontSize: size })}
                                className={`p-4 rounded-xl border-2 transition-all duration-200 ${scale} text-theme-primary`}
                                style={{
                                    borderColor: accessibility.fontSize === size ? 'var(--accent-primary)' : 'var(--border-color)',
                                    backgroundColor: accessibility.fontSize === size ? 'var(--bg-hover)' : 'var(--bg-card)',
                                }}
                            >
                                <div className="font-bold mb-1">Aa</div>
                                <div className="text-sm">{label}</div>
                            </button>
                        ))}
                    </div>
                </Card>

                <Card className="mb-6">
                    <h2 className="text-2xl font-bold mb-4 flex items-center text-theme-primary">
                        <FaUniversalAccess className="mr-2" />
                        Доступність
                    </h2>

                    <div className="space-y-2">
                        <ToggleSwitch
                            enabled={accessibility.soundEnabled}
                            onChange={(value) => updateAccessibility({ soundEnabled: value })}
                            label="Звукові ефекти"
                        />

                        <div className="mt-4 p-4 rounded-lg"
                             style={{
                                 backgroundColor: 'var(--bg-hover)',
                                 border: '1px solid var(--border-color)'
                             }}>
                            <div className="flex items-start">
                                <FaLightbulb className="text-2xl mr-3 text-primary flex-shrink-0" />
                                <div>
                                    <p className="text-sm text-theme-secondary">
                                        <strong className="text-theme-primary">Як це працює:</strong> Вимкнення цієї опції прибере звукові ефекти у <strong>всіх</strong> міні-іграх. Це допоможе зосередитись у тиші.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>

                <Card className="mb-6" style={{ border: '2px solid var(--accent-danger)' }}>
                    <h2 className="text-2xl font-bold mb-4 flex items-center"
                        style={{ color: 'var(--accent-danger)' }}>
                        <FaTrashCan className="mr-2" />
                        Управління даними
                    </h2>

                    <p className="mb-4 text-theme-secondary">
                        Видалення всіх даних призведе до втрати профілю, статистики, рекордів та бейджів. Цю дію неможливо скасувати.
                    </p>

                    <Button
                        variant="danger"
                        onClick={() => setShowClearModal(true)}
                        fullWidth
                    >
                        Очистити всі дані
                    </Button>
                </Card>

                <Card>
                    <h2 className="text-2xl font-bold mb-4 flex items-center text-theme-primary">
                        <FaFileLines className="mr-2" />
                        Про застосунок
                    </h2>

                    <div className="space-y-2 text-theme-secondary">
                        <p><strong className="text-theme-primary">Версія:</strong> 1.0.0</p>
                        <p><strong className="text-theme-primary">Технології:</strong> React + Vite + TailwindCSS</p>
                        <p className="pt-3" style={{ borderTop: '1px solid var(--border-color)' }}>
                            <strong className="text-theme-primary">Memory Trainer</strong> - тренуйте пам'ять та концентрацію.
                        </p>
                    </div>
                </Card>

                <Modal
                    isOpen={showClearModal}
                    onClose={() => setShowClearModal(false)}
                    title="Підтвердження видалення"
                    size="sm"
                >
                    <div className="text-center">
                        <div className="text-6xl mb-4" style={{ color: 'var(--accent-danger)' }}>
                            <FaTrashCan className="inline-block" />
                        </div>
                        <p className="mb-6 text-theme-secondary">
                            Ви впевнені? Всі ваші рекорди буде втрачено.
                        </p>
                        <div className="flex space-x-4">
                            <Button
                                variant="ghost"
                                onClick={() => setShowClearModal(false)}
                                fullWidth
                            >
                                Скасувати
                            </Button>
                            <Button
                                variant="danger"
                                onClick={handleClearData}
                                fullWidth
                            >
                                Так, видалити
                            </Button>
                        </div>
                    </div>
                </Modal>
            </div>
        </Layout>
    );
}

export default Settings;