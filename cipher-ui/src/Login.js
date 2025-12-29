/**
 * Login / Register / Reset Password modal.
 *
 * Major logic:
 * - Supports three modes: login, register (OTP), and password reset (OTP)
 * - OTP is requested first, then the final action is submitted with OTP
 * - Handles Escape to close/reset for better UX
 */

import React, { useEffect, useState } from 'react';
import { showToast } from './Toast';
import './Login.css';

const Login = ({ onLogin, onClose }) => {
  const [mode, setMode] = useState('login');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    otp: '',
    newPassword: ''
  });
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isLogin = mode === 'login';
  const isRegister = mode === 'register';
  const isReset = mode === 'reset';

  // Reset modal state back to the default login screen.
  const resetToLogin = () => {
    setMode('login');
    setError('');
    setOtpSent(false);
    setFormData({ username: '', email: '', password: '', otp: '', newPassword: '' });
  };

  // Allow the modal to close via Escape.
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

  // Step 1 (Register): request an OTP be emailed to the provided address.
  const requestRegisterOtp = async () => {
    const trimmedUsername = String(formData.username || '').trim();
    const trimmedEmail = String(formData.email || '').trim();
    if (!trimmedUsername || !trimmedEmail) {
      const errorMsg = 'Please enter username and email first';
      setError(errorMsg);
      showToast(errorMsg, 'error');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await fetch('http://localhost:3001/api/auth/register/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: trimmedUsername,
          email: trimmedEmail,
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

  // Step 1 (Reset password): request an OTP for the email (if the account exists).
  const requestResetOtp = async () => {
    const trimmedEmail = String(formData.email || '').trim();
    if (!trimmedEmail) {
      const errorMsg = 'Please enter your email first';
      setError(errorMsg);
      showToast(errorMsg, 'error');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await fetch('http://localhost:3001/api/auth/forgot-password/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail }),
      });

      const data = await response.json();
      if (response.ok) {
        setOtpSent(true);
        showToast(data.message || 'OTP sent to your email (if the account exists)', 'success');
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
      let endpoint = '/api/auth/login';
      if (isRegister) endpoint = '/api/auth/register';
      if (isReset) endpoint = '/api/auth/reset-password';

      if (isRegister && (!otpSent || !String(formData.otp || '').trim())) {
        const errorMsg = 'Please request and enter the OTP sent to your email';
        setError(errorMsg);
        showToast(errorMsg, 'error');
        return;
      }

      if (isReset) {
        if (!otpSent || !String(formData.otp || '').trim()) {
          const errorMsg = 'Please request and enter the OTP sent to your email';
          setError(errorMsg);
          showToast(errorMsg, 'error');
          return;
        }
        if (!String(formData.newPassword || '').trim()) {
          const errorMsg = 'Please enter a new password';
          setError(errorMsg);
          showToast(errorMsg, 'error');
          return;
        }
      }

      const body = isReset
        ? {
            email: formData.email,
            otp: formData.otp,
            newPassword: formData.newPassword,
          }
        : formData;

      const response = await fetch(`http://localhost:3001${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        if (isReset) {
          showToast(data.message || 'Password reset successful. Please login.', 'success');
          resetToLogin();
          return;
        }

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
      <div className={`login-card ${isRegister ? 'login-card--split' : ''}`}>
        <button className="close-btn" onClick={() => (typeof onClose === 'function' ? onClose() : resetToLogin())}>×</button>
        <div className="login-header">
          <h2>🔐 {isLogin ? 'Login' : (isRegister ? 'Register' : 'Reset Password')}</h2>
          <p>Access Custom Cipher Builder</p>
        </div>

        {isRegister ? (
          <div className="auth-split">
            <div className="auth-split-left">
              <div className="auth-instructions" role="note" aria-label="Registration instructions">
                <div className="auth-instructions-title">How registration works</div>
                <ol className="auth-instructions-list">
                  <li>Enter a username, email, and password.</li>
                  <li>Click <strong>Send OTP</strong> to receive a 6-digit code in your email.</li>
                  <li>Enter the OTP in the OTP field.</li>
                  <li>Click <strong>Register</strong> to create your account.</li>
                </ol>
                <div className="auth-instructions-hint">
                  Note: If you don’t receive the OTP, check spam/junk or ask an admin to configure Email Settings.
                </div>
              </div>
            </div>

            <div className="auth-split-right">
              <form onSubmit={handleSubmit} className="login-form">
                <div className="form-group">
                  <label>Username:</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    required={isRegister}
                    placeholder="Enter username"
                  />
                </div>

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
                    onClick={requestRegisterOtp}
                    disabled={loading}
                    className="toggle-btn"
                    style={{ marginTop: 8 }}
                  >
                    {otpSent ? 'Resend OTP' : 'Send OTP'}
                  </button>
                </div>

                {error && <div className="error-message">{error}</div>}

                <button
                  type="submit"
                  disabled={loading || (!otpSent || !String(formData.otp || '').trim())}
                  className="login-btn"
                >
                  {loading ? 'Processing...' : 'Register'}
                </button>

                <button
                  type="button"
                  className="toggle-btn"
                  style={{ marginTop: 10, width: '100%' }}
                  onClick={resetToLogin}
                  disabled={loading}
                >
                  Cancel
                </button>
              </form>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="login-form">
          {isRegister && (
            <div className="form-group">
              <label>Username:</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required={isRegister}
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

          {(isLogin || isRegister) && (
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
          )}

          {isReset && (
            <div className="form-group">
              <label>New Password:</label>
              <input
                type="password"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                required
                placeholder="Enter new password"
              />
            </div>
          )}

          {(isRegister || isReset) && (
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
                onClick={isRegister ? requestRegisterOtp : requestResetOtp}
                disabled={loading}
                className="toggle-btn"
                style={{ marginTop: 8 }}
              >
                {otpSent ? 'Resend OTP' : 'Send OTP'}
              </button>
            </div>
          )}

          {error && <div className="error-message">{error}</div>}

          <button
            type="submit"
            disabled={
              loading ||
              ((isRegister || isReset) && (!otpSent || !String(formData.otp || '').trim()))
            }
            className="login-btn"
          >
            {loading ? 'Processing...' : (isLogin ? 'Login' : (isRegister ? 'Register' : 'Reset Password'))}
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
        )}

        <div className="login-footer">
          {isLogin && (
            <p>
              <button
                type="button"
                className="toggle-btn"
                onClick={() => {
                  setMode('reset');
                  setError('');
                  setOtpSent(false);
                  setFormData({ username: '', email: formData.email, password: '', otp: '', newPassword: '' });
                }}
              >
                Forgot password?
              </button>
            </p>
          )}

          <p>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => {
                if (isLogin) {
                  setMode('register');
                  setError('');
                  setOtpSent(false);
                  setFormData({ username: '', email: '', password: '', otp: '', newPassword: '' });
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