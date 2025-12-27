import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './ThemeContext';
import CipherApp from './CipherApp';
import ThemeToggle from './ThemeToggle';
import Login from './Login';
import AdminDashboard from './AdminDashboard';
import UserMenu from './UserMenu';
import Toast, { showToast } from './Toast';

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

const getTokenExpiryMs = (token) => {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== 'number') return null;
  return payload.exp * 1000;
};

function App() {
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const expiryMs = getTokenExpiryMs(token);
    if (!expiryMs) return;

    const delay = expiryMs - Date.now();
    if (delay <= 0) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      setShowAdmin(false);
      setShowUserMenu(false);
      setShowLogin(true);
      showToast('Session expired. Please login again.', 'warning');
      return;
    }

    const timer = setTimeout(() => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      setShowAdmin(false);
      setShowUserMenu(false);
      setShowLogin(true);
      showToast('Session expired. Please login again.', 'warning');
    }, delay);

    return () => clearTimeout(timer);
  }, [user]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      const expiryMs = getTokenExpiryMs(token);
      if (expiryMs && expiryMs <= Date.now()) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setShowLogin(true);
        return;
      }
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    setShowLogin(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    showToast('Logged out successfully', 'info');
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
            onClose={() => setShowUserMenu(false)}
          />
        )}
        <Toast />
      </div>
    </ThemeProvider>
  );
}

export default App;
