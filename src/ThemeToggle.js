/**
 * @fileoverview Theme toggle component for switching between light and dark modes
 * @author Cipher Project Team
 * @version 1.0.0
 */

import React from 'react';
import { useTheme } from './ThemeContext';
import './ThemeToggle.css';

/**
 * Theme toggle and auth controls component
 * @component
 * @description Provides theme toggle and authentication controls in top-right corner
 * @returns {JSX.Element} Theme toggle and auth buttons
 */
const ThemeToggle = ({ user, onShowLogin, onLogout, onShowAdmin }) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="top-controls">
      {user ? (
        <div className="user-controls">
          <span className="user-name">👤 {user.username || user.email}</span>
          {user.role === 'admin' && (
            <button className="admin-btn" onClick={onShowAdmin}>
              🛡️ Admin
            </button>
          )}
          <button className="logout-btn" onClick={onLogout}>
            Logout
          </button>
        </div>
      ) : (
        <button className="login-btn" onClick={onShowLogin}>
          🔑 Login
        </button>
      )}
      
      <button className="theme-toggle" onClick={toggleTheme} title={`Switch to ${isDark ? 'light' : 'dark'} mode`}>
        <div className="toggle-track">
          <div className={`toggle-thumb ${isDark ? 'dark' : 'light'}`}>
            <span className="toggle-icon">
              {isDark ? '🌙' : '☀️'}
            </span>
          </div>
        </div>
      </button>
    </div>
  );
};

export default ThemeToggle;