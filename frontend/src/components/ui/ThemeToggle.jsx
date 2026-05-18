import { useTheme } from '../../context/ThemeContext';
import { FiSun, FiMoon } from 'react-icons/fi';
import './ThemeToggle.css';

/**
 * ThemeToggle
 * A pill-shaped toggle button that switches between light and dark themes.
 * Reads state from ThemeContext — no props needed.
 * Placed in the Navbar's header-actions area.
 */
function ThemeToggle() {
    const { theme, toggleTheme, isDark } = useTheme();

    return (
        <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-pressed={isDark}
            aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            type="button"
        >
            <span className="theme-toggle__sr-only">
                {isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            </span>

            {/* Sun & Moon icons on the track */}
            <span className="theme-toggle__icons" aria-hidden="true">
                <span className="theme-toggle__icon theme-toggle__icon--sun">
                    <FiSun size={13} strokeWidth={2.5} />
                </span>
                <span className="theme-toggle__icon theme-toggle__icon--moon">
                    <FiMoon size={13} strokeWidth={2.5} />
                </span>
            </span>

            {/* Sliding thumb */}
            <span className="theme-toggle__thumb" aria-hidden="true" />
        </button>
    );
}

export default ThemeToggle;
