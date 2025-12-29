import React, { useEffect, useState } from 'react';
import { showToast } from './Toast';
import './Login.css';

const Login = ({ onLogin, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    otp: ''
  });
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const resetToLogin = () => {
    setIsLogin(true);
    setError('');
    setOtpSent(false);
    setFormData({ username: '', email: '', password: '', otp: '' });
  };

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (typeof onClose === 'function') onClose();
        else resetToLogin();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const requestOtp = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('http://localhost:3001/api/auth/register/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setOtpSent(true);
        showToast('OTP sent to your email', 'success');
      } else {
        const errorMsg = data.message || 'Failed to send OTP';
        setError(errorMsg);
        showToast(errorMsg, 'error');
      }
    } catch {
      const errorMsg = 'Connection error. Please try again.';
      setError(errorMsg);
      showToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';

      if (!isLogin && (!otpSent || !String(formData.otp || '').trim())) {
        const errorMsg = 'Please request and enter the OTP sent to your email';
        setError(errorMsg);
        showToast(errorMsg, 'error');
        return;
      }

      const response = await fetch(`http://localhost:3001${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        showToast(isLogin ? 'Login successful!' : 'Registration successful! Welcome!', 'success');
        onLogin(data.user, data.token);
      } else {
        const errorMsg = data.message || 'Authentication failed';
        setError(errorMsg);
        showToast(errorMsg, 'error');
      }
    } catch (err) {
      const errorMsg = 'Connection error. Please try again.';
      setError(errorMsg);
      showToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <button className="close-btn" onClick={() => (typeof onClose === 'function' ? onClose() : resetToLogin())}>×</button>
        <div className="login-header">
          <h2>🔐 {isLogin ? 'Login' : 'Register'}</h2>
          <p>Access Custom Cipher Builder</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {!isLogin && (
            <div className="form-group">
              <label>Username:</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required={!isLogin}
                placeholder="Enter username"
              />
            </div>
          )}

          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter email"
            />
          </div>

          <div className="form-group">
            <label>Password:</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter password"
            />
          </div>

          {!isLogin && (
            <div className="form-group">
              <label>OTP:</label>
              <input
                type="text"
                name="otp"
                value={formData.otp}
                onChange={handleChange}
                placeholder="Enter OTP"
                inputMode="numeric"
              />
              <button
                type="button"
                onClick={requestOtp}
                disabled={loading}
                className="toggle-btn"
                style={{ marginTop: 8 }}
              >
                {otpSent ? 'Resend OTP' : 'Send OTP'}
              </button>
            </div>
          )}

          {error && <div className="error-message">{error}</div>}

          <button type="submit" disabled={loading || (!isLogin && (!otpSent || !String(formData.otp || '').trim()))} className="login-btn">
            {loading ? 'Processing...' : (isLogin ? 'Login' : 'Register')}
          </button>

          {!isLogin && (
            <button
              type="button"
              className="toggle-btn"
              style={{ marginTop: 10, width: '100%' }}
              onClick={resetToLogin}
              disabled={loading}
            >
              Cancel
            </button>
          )}
        </form>

        <div className="login-footer">
          <p>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => {
                if (isLogin) {
                  setIsLogin(false);
                  setError('');
                  setOtpSent(false);
                  setFormData({ username: '', email: '', password: '', otp: '' });
                } else {
                  resetToLogin();
                }
              }}
              className="toggle-btn"
            >
              {isLogin ? 'Register' : 'Login'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;