import React, { useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

function Modal({
                   isOpen,
                   onClose,
                   title,
                   children,
                   showCloseButton = true,
                   closeOnOverlay = true,
                   size = 'md'
               }) {
    const { accessibility } = useTheme();

    const sizeClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl'
    };

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleOverlayClick = (e) => {
        if (closeOnOverlay && e.target === e.currentTarget) {
            onClose();
        }
    };

    const animationClass = accessibility.animationsEnabled
        ? 'animate-fade-in'
        : '';

    return (
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${animationClass}`}
            style={{
                backgroundColor: 'var(--overlay-bg)'
            }}
            onClick={handleOverlayClick}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            <div
                className={`
                    rounded-2xl w-full ${sizeClasses[size]} 
                    ${accessibility.animationsEnabled ? 'animate-slide-up' : ''}
                `}
                style={{
                    backgroundColor: 'var(--bg-card)',
                    boxShadow: 'var(--shadow-xl)',
                    border: '1px solid var(--border-color)'
                }}
            >
                <div
                    className="flex items-center justify-between p-6"
                    style={{
                        borderBottom: '1px solid var(--border-color)'
                    }}
                >
                    <h2
                        id="modal-title"
                        className="text-2xl font-bold"
                        style={{ color: 'var(--text-primary)' }}
                    >
                        {title}
                    </h2>
                    {showCloseButton && (
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg transition-colors"
                            style={{
                                color: 'var(--text-secondary)',
                                backgroundColor: 'transparent'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                                e.currentTarget.style.color = 'var(--text-primary)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = 'var(--text-secondary)';
                            }}
                            aria-label="Закрити"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    );
}

export default Modal;