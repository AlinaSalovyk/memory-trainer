
import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

function Card({
                  children,
                  className = '',
                  onClick,
                  hoverable = false,
                  padding = 'md',
                  ...props
              }) {
    const { accessibility } = useTheme();

    const paddingClasses = {
        none: '',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8'
    };

    const hoverClasses = hoverable
        ? 'cursor-pointer hover:scale-105'
        : '';

    const animationClass = accessibility.animationsEnabled
        ? 'transform transition-all duration-300'
        : '';

    const handleClick = (e) => {
        if (onClick) {
            if (navigator.vibrate) {
                navigator.vibrate(10);
            }
            onClick(e);
        }
    };

    return (
        <div
            onClick={handleClick}
            className={`
                theme-card 
                text-theme-primary
                rounded-2xl
                ${paddingClasses[padding]}
                ${hoverClasses}
                ${animationClass}
                ${className}
            `}
            {...props}
        >
            {children}
        </div>
    );
}

export default Card;