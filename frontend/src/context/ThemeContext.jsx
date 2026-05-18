import React, { createContext, useContext, useEffect, useState } from 'react';

// ─── Theme Context ────────────────────────────────────────────────────────────
// Provides { theme, toggleTheme, isDark } to the entire app.
// Default theme: 'light'
// Persisted in localStorage under key: 'urban-nest-theme'

const ThemeContext = createContext({
    theme: 'light',
    toggleTheme: () => {},
    isDark: false,
});

export const useTheme = () => {
    const ctx = useContext(ThemeContext);
    if (!ctx) {
        throw new Error('useTheme must be used inside <ThemeProvider>');
    }
    return ctx;
};

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(() => {
        // On first load, read from localStorage; fall back to 'light'
        try {
            return localStorage.getItem('urban-nest-theme') || 'light';
        } catch {
            return 'light';
        }
    });

    // Apply data-theme attribute to <html> whenever theme changes
    useEffect(() => {
        const root = document.documentElement;
        root.setAttribute('data-theme', theme);
        // Sync color-scheme so browser native UI (scrollbars, inputs) follow suit
        root.style.colorScheme = theme;
        try {
            localStorage.setItem('urban-nest-theme', theme);
        } catch {
            // localStorage not available (e.g., private browsing with storage disabled)
        }
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
    };

    const value = {
        theme,
        toggleTheme,
        isDark: theme === 'dark',
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

export default ThemeContext;
