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
    render(
      <UserMenu
        user={{ username: 'alice', email: 'alice@example.com', role: 'user' }}
        onLogout={jest.fn()}
        onClose={jest.fn()}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: /deactivate account/i }));
    expect(screen.getByText(/confirm action/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(screen.queryByText(/confirm action/i)).not.toBeInTheDocument();
  });

  test('deactivate calls API and onLogout on success', async () => {
    const onLogout = jest.fn();

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

    await userEvent.click(screen.getByRole('button', { name: /deactivate account/i }));
    await userEvent.click(screen.getByRole('button', { name: /yes, deactivate/i }));

    await waitFor(() => expect(onLogout).toHaveBeenCalled());
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/user/deactivate',
      expect.objectContaining({ method: 'PUT' })
    );
  });
});
