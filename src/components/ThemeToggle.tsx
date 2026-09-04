import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      id="theme-toggle-btn"
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      title={isDark ? 'Switch to Light Mode (☀️)' : 'Switch to Dark Mode (🌙)'}
      className={`relative inline-flex items-center justify-center w-9 h-9 rounded-lg border text-xs font-medium transition-all duration-200 cursor-pointer ${
        isDark
          ? 'bg-stone-800 text-amber-300 border-stone-700 hover:bg-stone-700 hover:text-amber-200 focus-visible:ring-2 focus-visible:ring-amber-400'
          : 'bg-stone-100/80 text-stone-700 border-stone-200/60 hover:bg-stone-200/70 hover:text-stone-900 focus-visible:ring-2 focus-visible:ring-amber-500'
      } ${className}`}
    >
      <span className="sr-only">Toggle theme</span>
      {isDark ? (
        <Sun className="w-4 h-4 transition-transform duration-200 rotate-0 hover:rotate-45" />
      ) : (
        <Moon className="w-4 h-4 transition-transform duration-200 -rotate-12 hover:rotate-0" />
      )}
    </button>
  );
};
