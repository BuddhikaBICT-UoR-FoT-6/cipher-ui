/**
 * @fileoverview Theme toggle component for switching between light and dark modes
 * @author Cipher Project Team
 * @version 1.0.0
 */

import React from 'react';
import { useTheme } from './ThemeContext';
import './ThemeToggle.css';

/**
 * Theme toggle button component
 * @component
 * @description Provides a toggle switch for switching between light (purple) and dark (black) themes with smooth animations
 * @returns {JSX.Element} Animated toggle button with theme icons
 * 
 * @example
 * <ThemeToggle />
 */
const ThemeToggle = () => {
  /**
   * Theme context hook providing current theme state and toggle function
   * @type {Object}
   * @property {boolean} isDark - Current theme state (true for dark, false for light)
   * @property {Function} toggleTheme - Function to toggle between themes
   */
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