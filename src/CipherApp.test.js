import React from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CipherApp from './CipherApp';

jest.mock('./Toast', () => ({
  __esModule: true,
  showToast: jest.fn(),
  default: () => null,
}));

describe('CipherApp', () => {
  test('does not show chaining option when logged out', () => {
    render(<CipherApp user={null} onShowLogin={jest.fn()} />);
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
    expect(screen.queryByText(/multiple cipher chaining/i)).not.toBeInTheDocument();
  });

  test('shows chaining option when logged in', () => {
    render(<CipherApp user={{ id: 1, role: 'user', email: 'x@y.com' }} onShowLogin={jest.fn()} />);
    expect(screen.getByText(/multiple cipher chaining/i)).toBeInTheDocument();
  });

  test('shows Rail Fence visual chart when railfence selected and input has text', async () => {
    render(<CipherApp user={null} onShowLogin={jest.fn()} />);

    await userEvent.selectOptions(screen.getByRole('combobox'), 'railfence');
    await userEvent.type(screen.getByPlaceholderText(/enter your message here/i), 'HELLO');

    expect(screen.getByRole('img', { name: /rail fence zigzag pattern chart/i })).toBeInTheDocument();
  });

  test('encrypts with Caesar cipher', async () => {
    jest.useFakeTimers();

    render(<CipherApp user={null} onShowLogin={jest.fn()} />);

    await userEvent.type(screen.getByPlaceholderText(/enter your message here/i), 'A');
    await userEvent.click(screen.getByRole('button', { name: /encrypt/i }));

    await act(async () => {
      jest.advanceTimersByTime(900);
    });

    expect(screen.getByPlaceholderText(/your encrypted\/decrypted text will appear here/i)).toHaveValue('D');

    jest.useRealTimers();
  });
});
