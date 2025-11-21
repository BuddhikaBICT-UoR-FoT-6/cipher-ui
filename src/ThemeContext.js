/**
 * @fileoverview Theme context provider for managing application-wide theme state
 * @author Cipher Project Team
 * @version 1.0.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

/**
 * React context for theme management
 * @type {React.Context}
 */
const ThemeContext = createContext();

/**
 * Custom hook for accessing theme context
 * @function useTheme
 * @description Provides access to theme state and toggle functionality
 * @returns {Object} Theme context object containing isDark state and toggleTheme function
 * @throws {Error} When used outside of ThemeProvider
 * 
 * @example
 * const { isDark, toggleTheme } = useTheme();
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

/**
 * Theme provider component
 * @component
 * @param {Object} props - Component properties
 * @param {React.ReactNode} props.children - Child components to wrap with theme context
 * @description Provides theme context to all child components and manages theme persistence
 * @returns {JSX.Element} ThemeContext.Provider wrapping children with theme functionality
 * 
 * @example
 * <ThemeProvider>
 *   <App />
 * </ThemeProvider>
 */
export const ThemeProvider = ({ children }) => {
  /**
   * Theme state - true for dark mode, false for light mode
   * @type {boolean}
   * @default true
   */
  const [isDark, setIsDark] = useState(true);

  /**
   * Effect to load saved theme from localStorage on component mount
   * @function useEffect
   * @description Retrieves and applies previously saved theme preference
   */
  useEffect(() => {
    const savedTheme = localStorage.getItem('cipher-theme');
    if (savedTheme) {
      setIsDark(savedTheme === 'dark');
    }
  }, []);

  /**
   * Effect to apply theme class to document body when theme changes
   * @function useEffect
   * @description Updates document.body.className to apply global theme styles
   * @param {boolean} isDark - Current theme state dependency
   */
  useEffect(() => {
    document.body.className = isDark ? 'dark-theme' : 'light-theme';
  }, [isDark]);

  /**
   * Toggles between light and dark themes
   * @function toggleTheme
   * @description Switches theme state and persists choice to localStorage
   * @returns {void}
   */
  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    localStorage.setItem('cipher-theme', newTheme ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      <div className={isDark ? 'dark-theme' : 'light-theme'}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
};