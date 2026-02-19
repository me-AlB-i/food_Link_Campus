/**
 * FoodLink Campus - Theme Context
 * Manages light/dark mode with localStorage persistence and system preference detection
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState('system');
    const [resolvedTheme, setResolvedTheme] = useState('light');

    // Initialize theme from localStorage or system preference
    useEffect(() => {
        const stored = localStorage.getItem('theme');
        if (stored && ['light', 'dark', 'system'].includes(stored)) {
            setTheme(stored);
        }
    }, []);

    // Apply theme and listen for system changes
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const applyTheme = () => {
            let resolved;
            if (theme === 'system') {
                resolved = mediaQuery.matches ? 'dark' : 'light';
            } else {
                resolved = theme;
            }

            setResolvedTheme(resolved);

            if (resolved === 'dark') {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        };

        applyTheme();

        // Listen for system preference changes
        const handleChange = () => {
            if (theme === 'system') {
                applyTheme();
            }
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [theme]);

    // Toggle between light and dark
    const toggleTheme = useCallback(() => {
        setTheme((prev) => {
            const next = prev === 'light' || (prev === 'system' && resolvedTheme === 'light')
                ? 'dark'
                : 'light';
            localStorage.setItem('theme', next);
            return next;
        });
    }, [resolvedTheme]);

    // Set a specific theme
    const setThemeValue = useCallback((value) => {
        if (['light', 'dark', 'system'].includes(value)) {
            setTheme(value);
            localStorage.setItem('theme', value);
        }
    }, []);

    const value = {
        theme,
        resolvedTheme,
        isDark: resolvedTheme === 'dark',
        toggleTheme,
        setTheme: setThemeValue,
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}

export default ThemeContext;
