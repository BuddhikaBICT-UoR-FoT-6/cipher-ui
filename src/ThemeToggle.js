import React from 'react';
import { useTheme } from './ThemeContext';
import './ThemeToggle.css';

const ThemeToggle = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button className="theme-toggle" onClick={toggleTheme} title={`Switch to ${isDark ? 'light' : 'dark'} mode`}>
      <div className="toggle-track">
        <div className={`toggle-thumb ${isDark ? 'dark' : 'light'}`}>
          <span className="toggle-icon">
            {isDark ? '🌙' : '☀️'}
          </span>
        </div>
      </div>
    </button>
  );
};

export default ThemeToggle;