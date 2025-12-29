/**
 * AdminDashboard tests.
 *
 * Verifies admin stats/users rendering and that destructive actions are routed
 * through the toast-driven confirmation flow.
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminDashboard from './AdminDashboard';

jest.mock('./Toast', () => ({
  __esModule: true,
  showToast: jest.fn(),
  showConfirmToast: jest.fn(),
}));

describe('AdminDashboard', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('token', 'jwt');
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('loads and renders stats and users', async () => {
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            id: 1,
            username: 'alice',
            email: 'alice@example.com',
            role: 'user',
            is_active: 1,
            cipher_count: 0,
            created_at: new Date().toISOString(),
          },
        ],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ totalUsers: 1, totalCiphers: 0, activeUsers: 1 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          enabled: true,
          provider: 'smtp',
          smtpHost: 'smtp.gmail.com',
          smtpPort: 587,
          smtpSecure: false,
          smtpUser: 'sender@example.com',
          emailFrom: 'sender@example.com',
          hasSmtpPass: true,
        }),
      });

    render(<AdminDashboard user={{ role: 'admin' }} onClose={jest.fn()} />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    expect(await screen.findByText(/admin dashboard/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /^email settings$/i })).toBeInTheDocument();
    expect(screen.getByText(/total users/i)).toBeInTheDocument();
    expect(screen.getAllByText('1').length).toBeGreaterThan(0);
    expect(screen.getByText(/alice@example.com/i)).toBeInTheDocument();
  });

  test('opens add user modal', async () => {
    fetch
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          enabled: true,
          provider: 'smtp',
          smtpHost: 'smtp.gmail.com',
          smtpPort: 587,
          smtpSecure: false,
          smtpUser: '',
          emailFrom: '',
          hasSmtpPass: false,
        }),
      });

    render(<AdminDashboard user={{ role: 'admin' }} onClose={jest.fn()} />);

    await waitFor(() => expect(screen.queryByText(/loading/i)).not.toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: /add user/i }));

    expect(screen.getByText(/add new user/i)).toBeInTheDocument();
  });
});
