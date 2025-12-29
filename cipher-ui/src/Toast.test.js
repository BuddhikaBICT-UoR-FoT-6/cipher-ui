import React from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Toast, { showConfirmToast, showToast } from './Toast';

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

  test('confirm toast stays until action and confirm triggers callback', async () => {
    render(<Toast />);

    const onConfirm = jest.fn();

    act(() => {
      showConfirmToast({
        message: 'Delete this user?',
        confirmText: 'Delete',
        cancelText: 'Cancel',
        onConfirm,
      });
    });

    expect(screen.getByText('Delete this user?')).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(3000);
    });
    expect(screen.getByText('Delete this user?')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Delete this user?')).not.toBeInTheDocument();
  });
});
