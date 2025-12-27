import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ThemeToggle from './ThemeToggle';
import { renderWithTheme } from './test-utils';

describe('ThemeToggle', () => {
  test('shows Login when no user', () => {
    renderWithTheme(
      <ThemeToggle
        user={null}
        onShowLogin={jest.fn()}
        onLogout={jest.fn()}
        onShowAdmin={jest.fn()}
        onShowUserMenu={jest.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  test('shows user name and admin button for admins', async () => {
    const onShowAdmin = jest.fn();

    renderWithTheme(
      <ThemeToggle
        user={{ username: 'alice', role: 'admin', email: 'alice@example.com' }}
        onShowLogin={jest.fn()}
        onLogout={jest.fn()}
        onShowAdmin={onShowAdmin}
        onShowUserMenu={jest.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /alice/i })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /admin/i }));
    expect(onShowAdmin).toHaveBeenCalledTimes(1);
  });

  test('logout calls onLogout', async () => {
    const onLogout = jest.fn();

    renderWithTheme(
      <ThemeToggle
        user={{ username: 'bob', role: 'user', email: 'bob@example.com' }}
        onShowLogin={jest.fn()}
        onLogout={onLogout}
        onShowAdmin={jest.fn()}
        onShowUserMenu={jest.fn()}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: /logout/i }));
    expect(onLogout).toHaveBeenCalledTimes(1);
  });
});
