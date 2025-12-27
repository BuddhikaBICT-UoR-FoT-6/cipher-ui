import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { showToast } from './Toast';
import App from './App';

jest.mock('./CipherApp', () => ({
  __esModule: true,
  default: () => <div>CipherAppMock</div>,
}));

jest.mock('./ThemeToggle', () => ({
  __esModule: true,
  default: () => <div>ThemeToggleMock</div>,
}));

jest.mock('./Login', () => ({
  __esModule: true,
  default: () => <div>LoginModal</div>,
}));

jest.mock('./AdminDashboard', () => ({
  __esModule: true,
  default: () => <div>AdminDashboardMock</div>,
}));

jest.mock('./UserMenu', () => ({
  __esModule: true,
  default: () => <div>UserMenuMock</div>,
}));

jest.mock('./Toast', () => ({
  __esModule: true,
  default: () => null,
  showToast: jest.fn(),
}));

function base64UrlEncode(obj) {
  const base64 = btoa(JSON.stringify(obj));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function makeJwt(payload) {
  const header = base64UrlEncode({ alg: 'none', typ: 'JWT' });
  const body = base64UrlEncode(payload);
  return `${header}.${body}.sig`;
}

describe('App session management', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('shows login modal immediately for expired token', async () => {
    const expiredExp = Math.floor(Date.now() / 1000) - 10;

    localStorage.setItem('token', makeJwt({ exp: expiredExp }));
    localStorage.setItem('user', JSON.stringify({ id: 1, role: 'user', email: 'x@y.com' }));

    render(<App />);

    expect(await screen.findByText('LoginModal')).toBeInTheDocument();
    expect(showToast).toHaveBeenCalledWith(
      'Session expired. Please login again.',
      'warning'
    );
  });

  test('auto-logs out at token expiry time', async () => {
    jest.useFakeTimers();

    const expSoon = Math.floor((Date.now() + 1000) / 1000);
    localStorage.setItem('token', makeJwt({ exp: expSoon }));
    localStorage.setItem('user', JSON.stringify({ id: 1, role: 'user', email: 'x@y.com' }));

    render(<App />);

    await act(async () => {
      jest.advanceTimersByTime(1500);
    });

    expect(await screen.findByText('LoginModal')).toBeInTheDocument();
    expect(showToast).toHaveBeenCalledWith(
      'Session expired. Please login again.',
      'warning'
    );

    jest.useRealTimers();
  });
});
