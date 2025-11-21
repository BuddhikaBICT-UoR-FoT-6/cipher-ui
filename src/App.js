import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './ThemeContext';
import CipherApp from './CipherApp';
import ThemeToggle from './ThemeToggle';
import Login from './Login';
import AdminDashboard from './AdminDashboard';
import Toast, { showToast } from './Toast';

function App() {
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
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
        <Toast />
      </div>
    </ThemeProvider>
  );
}

export default App;
