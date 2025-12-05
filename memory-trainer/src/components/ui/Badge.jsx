import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

function BadgeComponent({
                            icon,
                            name,
                            description,
                            color,
                            earned = false,
                            earnedAt = null,
                            size = 'md',
                            onClick
                        }) {
    const { accessibility } = useTheme();

    const sizeClasses = {
        sm: 'w-16 h-16 text-2xl',
        md: 'w-24 h-24 text-4xl',
        lg: 'w-32 h-32 text-5xl'
    };

    const animationClass = accessibility.animationsEnabled && earned
        ? 'hover:scale-110 transform transition-transform duration-300'
        : '';

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('uk-UA', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    return (
        <div
            onClick={onClick}
            className={`
                flex flex-col items-center p-4 rounded-2xl 
                ${onClick ? 'cursor-pointer' : ''}
                ${animationClass}
            `}
            style={{
                backgroundColor: earned ? 'var(--bg-card)' : 'var(--bg-hover)',
                boxShadow: earned ? 'var(--shadow-lg)' : 'none',
                border: `1px solid ${earned ? 'var(--border-color)' : 'var(--border-color)'}`,
                opacity: earned ? 1 : 0.5
            }}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
        >
            <div
                className={`
                    ${sizeClasses[size]} 
                    rounded-full flex items-center justify-center
                    ${earned ? 'shadow-md' : ''}
                `}
                style={{
                    backgroundColor: earned ? color : 'var(--bg-tertiary)',
                    opacity: earned ? 0.95 : 0.4
                }}
            >
                <span className={earned ? '' : 'grayscale opacity-50'}>{icon}</span>
            </div>

            <h3
                className={`
                    mt-3 font-bold text-center
                    ${size === 'sm' ? 'text-sm' : size === 'md' ? 'text-base' : 'text-lg'}
                `}
                style={{
                    color: earned ? 'var(--text-primary)' : 'var(--text-tertiary)'
                }}
            >
                {name}
            </h3>

            <p
                className="mt-1 text-xs text-center"
                style={{
                    color: earned ? 'var(--text-secondary)' : 'var(--text-tertiary)'
                }}
            >
                {description}
            </p>

            {earned && earnedAt && (
                <p
                    className="mt-2 text-xs"
                    style={{ color: 'var(--text-tertiary)' }}
                >
                    {formatDate(earnedAt)}
                </p>
            )}

            {!earned && (
                <div
                    className="mt-2 text-xs flex items-center"
                    style={{ color: 'var(--text-tertiary)' }}
                >
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    Заблоковано
                </div>
            )}
        </div>
    );
}

export default BadgeComponent;