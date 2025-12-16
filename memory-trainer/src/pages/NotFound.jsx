import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
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
                <Link
                    to="/"
                    className="inline-block px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-colors"
                >
                    Повернутися на головну
                </Link>
            </div>
        </div>
    );
};

export default NotFound;