/**
 * Login tests.
 *
 * Exercises login/register/reset flows and checks UI state transitions while
 * mocking network requests.
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Login from './Login';

jest.mock('./Toast', () => ({
  __esModule: true,
  showToast: jest.fn(),
}));

describe('Login', () => {
  beforeEach(() => {
    localStorage.clear();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('toggles to Register and shows Username field', async () => {
    render(<Login onLogin={jest.fn()} onClose={jest.fn()} />);

    expect(screen.queryByPlaceholderText(/enter username/i)).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /register/i }));
    expect(screen.getByPlaceholderText(/enter username/i)).toBeInTheDocument();
  });

  test('successful login stores token and calls onLogin', async () => {
    const onLogin = jest.fn();

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        token: 'test.token.sig',
        user: { id: 1, email: 'a@b.com', role: 'user' },
      }),
    });

    render(<Login onLogin={onLogin} onClose={jest.fn()} />);

    await userEvent.type(screen.getByPlaceholderText(/enter email/i), 'a@b.com');
    await userEvent.type(screen.getByPlaceholderText(/enter password/i), 'pw');
    await userEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => expect(onLogin).toHaveBeenCalled());
    expect(localStorage.getItem('token')).toBe('test.token.sig');
    expect(JSON.parse(localStorage.getItem('user'))).toMatchObject({ email: 'a@b.com' });
  });
});
