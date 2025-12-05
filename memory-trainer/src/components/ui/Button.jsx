import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

function Button({
                    children,
                    variant = 'primary',
                    size = 'md',
                    onClick,
                    disabled = false,
                    fullWidth = false,
                    icon = null,
                    type = 'button',
                    className = '',
                    ariaLabel,
                    ...props
                }) {
    const { accessibility } = useTheme();

    const baseClasses = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';

    const variantClasses = {
        primary: 'bg-primary text-white hover:bg-primary-dark focus:ring-primary shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed',
        secondary: 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 focus:ring-gray-400',
        success: 'bg-success text-white hover:bg-green-600 focus:ring-success shadow-lg hover:shadow-xl',
        danger: 'bg-danger text-white hover:bg-red-600 focus:ring-danger shadow-lg hover:shadow-xl',
        outline: 'border-2 border-primary text-primary hover:bg-primary hover:text-white focus:ring-primary',
        ghost: 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:ring-gray-400'
    };

    const sizeClasses = {
        sm: 'px-3 py-2 text-sm min-h-[36px]',
        md: 'px-5 py-3 text-base min-h-[44px]',
        lg: 'px-7 py-4 text-lg min-h-[52px]'
    };

    const widthClass = fullWidth ? 'w-full' : '';

    const animationClass = accessibility.animationsEnabled
        ? 'transform active:scale-95'
        : '';

    const handleClick = (e) => {
        if (!disabled && onClick) {
            if (navigator.vibrate) {
                navigator.vibrate(10);
            }
            onClick(e);
        }
    };

    return (
        <button
            type={type}
            onClick={handleClick}
            disabled={disabled}
            aria-label={ariaLabel}
            className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${widthClass}
        ${animationClass}
        ${className}
      `}
            {...props}
        >
            {icon && <span className="mr-2">{icon}</span>}
            {children}
        </button>
    );
}

export default Button;