/**
 * UserMenu tests.
 *
 * Ensures user profile actions render and that OTP-protected flows call the
 * expected endpoints and show appropriate feedback.
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserMenu from './UserMenu';

jest.mock('./Toast', () => ({
  __esModule: true,
  showToast: jest.fn(),
}));

describe('UserMenu', () => {
  let consoleLogSpy;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    localStorage.clear();
    localStorage.setItem('token', 'jwt');
    global.fetch = jest.fn();
  });

  afterEach(() => {
    consoleLogSpy?.mockRestore();
    jest.resetAllMocks();
  });

  test('shows confirm dialog and can cancel', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        user: {},
        stats: { challenges_completed: 0, total_points: 0 },
        badges: [],
        badgeAssets: [
          { badge: 'bronze', url_path: '/badges/Bronze.png' },
          { badge: 'silver', url_path: '/badges/Silver.png' },
          { badge: 'gold', url_path: '/badges/Gold.jpg' },
          { badge: 'diamond', url_path: '/badges/Diamond.png' },
        ],
      }),
    });

    render(
      <UserMenu
        user={{ username: 'alice', email: 'alice@example.com', role: 'user' }}
        onLogout={jest.fn()}
        onClose={jest.fn()}
      />
    );

    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/me/profile',
        expect.objectContaining({ headers: expect.any(Object) })
      )
    );

    await userEvent.click(screen.getByRole('button', { name: /deactivate account/i }));
    expect(screen.getByText(/confirm action/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(screen.queryByText(/confirm action/i)).not.toBeInTheDocument();
  });

  test('deactivate calls API and onLogout on success', async () => {
    const onLogout = jest.fn();

    // profile fetch
    fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        user: {},
        stats: { challenges_completed: 2, total_points: 10 },
        badges: [],
        badgeAssets: [
          { badge: 'bronze', url_path: '/badges/Bronze.png' },
          { badge: 'silver', url_path: '/badges/Silver.png' },
          { badge: 'gold', url_path: '/badges/Gold.jpg' },
          { badge: 'diamond', url_path: '/badges/Diamond.png' },
        ],
      }),
    });

    // request OTP
    fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ message: 'OTP sent' }),
    });

    // deactivate confirm
    fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ message: 'ok' }),
    });

    render(
      <UserMenu
        user={{ username: 'alice', email: 'alice@example.com', role: 'user' }}
        onLogout={onLogout}
        onClose={jest.fn()}
      />
    );

    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/me/profile',
        expect.objectContaining({ headers: expect.any(Object) })
      )
    );

    await userEvent.click(screen.getByRole('button', { name: /deactivate account/i }));
    await userEvent.click(screen.getByRole('button', { name: /send otp/i }));

    await waitFor(() => expect(screen.getByPlaceholderText(/enter otp/i)).toBeInTheDocument());
    await userEvent.type(screen.getByPlaceholderText(/enter otp/i), '123456');
    await userEvent.click(screen.getByRole('button', { name: /yes, deactivate/i }));

    await waitFor(() => expect(onLogout).toHaveBeenCalled());
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/me/profile',
      expect.objectContaining({ headers: expect.any(Object) })
    );
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/user/deactivate/request-otp',
      expect.objectContaining({ method: 'POST' })
    );
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/user/deactivate',
      expect.objectContaining({ method: 'PUT' })
    );
  });
});
