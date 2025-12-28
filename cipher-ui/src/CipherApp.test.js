import React from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CipherApp from './CipherApp';

jest.mock('./CryptanalysisChallenge', () => ({
  __esModule: true,
  default: ({ user, onClose }) => (
    <div>
      <div>Cryptanalysis Modal</div>
      <div>{user ? 'Logged In' : 'Logged Out'}</div>
      <button onClick={onClose}>Close Modal</button>
    </div>
  ),
}));

jest.mock('./Toast', () => ({
  __esModule: true,
  showToast: jest.fn(),
  default: () => null,
}));

describe('CipherApp', () => {
  test('does not show cryptanalysis challenge button when logged out', () => {
    render(<CipherApp user={null} onShowLogin={jest.fn()} />);
    expect(screen.queryByRole('button', { name: /cryptanalysis challenge/i })).not.toBeInTheDocument();
  });

  test('shows cryptanalysis challenge button when logged in and opens modal', async () => {
    render(<CipherApp user={{ id: 1, role: 'user', email: 'x@y.com' }} onShowLogin={jest.fn()} />);

    const button = screen.getByRole('button', { name: /cryptanalysis challenge/i });
    await userEvent.click(button);

    expect(screen.getByText(/cryptanalysis modal/i)).toBeInTheDocument();
  });

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

  test('shows cryptanalysis button only when logged in', () => {
    const { rerender } = render(<CipherApp user={null} onShowLogin={jest.fn()} />);
    expect(screen.queryByText(/cryptanalysis challenge/i)).not.toBeInTheDocument();

    rerender(<CipherApp user={{ id: 1, role: 'user', email: 'x@y.com' }} onShowLogin={jest.fn()} />);
    expect(screen.getByText(/cryptanalysis challenge/i)).toBeInTheDocument();
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
