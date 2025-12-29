/**
 * App shell for CipherProject UI.
 *
 * Major responsibilities:
 * - Bootstraps theme + global UI (toasts)
 * - Manages login state (JWT + persisted user)
 * - Enforces session expiry on the client by reading the JWT exp claim
 * - Controls top-level overlays (Login/Admin/UserMenu/History)
 */

import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './ThemeContext';
import CipherApp from './CipherApp';
import ThemeToggle from './ThemeToggle';
import Login from './Login';
import AdminDashboard from './AdminDashboard';
import UserMenu from './UserMenu';
import CipherHistory from './CipherHistory';
import Toast, { showToast } from './Toast';

// Decode the JWT payload without validating signature.
// This is used only for UX/session expiry; backend remains the source of truth.
const decodeJwtPayload = (token) => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
    const json = atob(padded);
    return JSON.parse(json);
  } catch {
    return null;
  }
};

// Return the token expiry time in milliseconds, or null if missing/invalid.
const getTokenExpiryMs = (token) => {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== 'number') return null;
  return payload.exp * 1000;
};

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [showLogin, setShowLogin] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Centralized logout helper: clears persisted auth + resets overlays.
  const forceLogout = (message) => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setShowAdmin(false);
    setShowUserMenu(false);
    setShowHistory(false);
    setShowLogin(true);
    if (message) showToast(message, 'warning');
  };

  useEffect(() => {
    if (!token) return undefined;

    // Check current token expiry and compute the next delay until expiry.
    const checkExpiry = () => {
      const expiryMs = getTokenExpiryMs(token);

      // If token is not a JWT or doesn't include exp, don't keep the user "logged in".
      if (!expiryMs) {
        forceLogout('Session expired. Please login again.');
        return { expired: true, delay: 0 };
      }

      const delay = expiryMs - Date.now();
      if (delay <= 0) {
        forceLogout('Session expired. Please login again.');
        return { expired: true, delay: 0 };
      }

      return { expired: false, delay };
    };

    // Initial check + schedule a precise timeout.
    const initial = checkExpiry();
    if (initial.expired) return undefined;

    const expiryTimeout = setTimeout(() => {
      forceLogout('Session expired. Please login again.');
    }, initial.delay);

    // Defensive checks (handles laptop sleep / background tab timer throttling).
    const interval = setInterval(() => {
      checkExpiry();
    }, 30_000);

    const onVisibilityOrFocus = () => {
      checkExpiry();
    };

    window.addEventListener('focus', onVisibilityOrFocus);
    document.addEventListener('visibilitychange', onVisibilityOrFocus);

    return () => {
      clearTimeout(expiryTimeout);
      clearInterval(interval);
      window.removeEventListener('focus', onVisibilityOrFocus);
      document.removeEventListener('visibilitychange', onVisibilityOrFocus);
    };
  }, [token]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      const expiryMs = getTokenExpiryMs(token);
      if (!expiryMs || expiryMs <= Date.now()) {
        forceLogout('Session expired. Please login again.');
        return;
      }
      setToken(token);
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (userData, tokenFromLogin) => {
    if (tokenFromLogin) setToken(tokenFromLogin);
    setUser(userData);
    setShowLogin(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setShowHistory(false);
    showToast('Logged out successfully', 'info');
  };

  const handleShowHistory = () => {
    setShowUserMenu(false);
    setShowHistory(true);
  };

  return (
    <ThemeProvider>
      <div className="App">
        <ThemeToggle 
          user={user}
          onShowLogin={() => setShowLogin(true)}
          onLogout={handleLogout}
          onShowAdmin={() => setShowAdmin(true)}
          onShowUserMenu={() => setShowUserMenu(true)}
        />
        <CipherApp user={user} onShowLogin={() => setShowLogin(true)} />
        {showLogin && (
          <Login 
            onLogin={handleLogin} 
            onClose={() => setShowLogin(false)} 
          />
        )}
        {showAdmin && user?.role === 'admin' && (
          <AdminDashboard 
            user={user}
            onClose={() => setShowAdmin(false)}
          />
        )}
        {showUserMenu && user && (
          <UserMenu 
            user={user}
            onLogout={handleLogout}
            onShowHistory={handleShowHistory}
            onClose={() => setShowUserMenu(false)}
          />
        )}
        {showHistory && user && (
          <CipherHistory
            user={user}
            onClose={() => setShowHistory(false)}
          />
        )}
        <Toast />
      </div>
    </ThemeProvider>
  );
}

export default App;
