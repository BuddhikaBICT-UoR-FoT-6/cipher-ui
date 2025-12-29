/**
 * Testing utilities.
 *
 * Provides helpers (like `renderWithTheme`) so component tests run under the
 * same ThemeContext as the real app.
 */
import React from 'react';
import { render } from '@testing-library/react';
import { ThemeProvider } from './ThemeContext';

export function renderWithTheme(ui, options) {
  function Wrapper({ children }) {
    return <ThemeProvider>{children}</ThemeProvider>;
  }

  return render(ui, { wrapper: Wrapper, ...options });
}
