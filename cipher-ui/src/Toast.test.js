import React from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Toast, { showToast } from './Toast';

describe('Toast', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('renders a toast and auto-removes it', () => {
    render(<Toast />);

    act(() => {
      showToast('Hello', 'info');
    });
    expect(screen.getByText('Hello')).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(3000);
    });
    expect(screen.queryByText('Hello')).not.toBeInTheDocument();
  });

  test('close button removes toast immediately', async () => {
    render(<Toast />);

    act(() => {
      showToast('Closable', 'info');
    });
    expect(screen.getByText('Closable')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '×' }));
    expect(screen.queryByText('Closable')).not.toBeInTheDocument();
  });
});
