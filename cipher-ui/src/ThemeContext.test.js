/**
 * ThemeContext tests.
 *
 * Validates provider requirements and persistence to localStorage.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, useTheme } from './ThemeContext';

function Probe() {
  const { isDark, toggleTheme } = useTheme();
  return (
    <button type="button" onClick={toggleTheme}>
      {isDark ? 'dark' : 'light'}
    </button>
  );
}

describe('ThemeContext', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.className = '';
  });

  test('throws if useTheme is used outside provider', () => {
    expect(() => render(<Probe />)).toThrow(/ThemeProvider/);
  });

  test('loads theme from localStorage and updates body class', async () => {
    localStorage.setItem('cipher-theme', 'light');

    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>
    );

    expect(await screen.findByRole('button', { name: 'light' })).toBeInTheDocument();
    expect(document.body.className).toBe('light-theme');
  });

  test('toggleTheme flips theme and persists choice', async () => {
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>
    );

    // Default is dark.
    const btn = await screen.findByRole('button', { name: 'dark' });
    expect(document.body.className).toBe('dark-theme');

    await userEvent.click(btn);

    expect(await screen.findByRole('button', { name: 'light' })).toBeInTheDocument();
    expect(document.body.className).toBe('light-theme');
    expect(localStorage.getItem('cipher-theme')).toBe('light');
  });
});
