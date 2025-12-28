import React from 'react';
import { screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CryptanalysisChallenge from './CryptanalysisChallenge';
import { renderWithTheme } from './test-utils';

jest.mock('./Toast', () => ({
  __esModule: true,
  showToast: jest.fn(),
  default: () => null,
}));

describe('CryptanalysisChallenge', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  test('renders nothing when user is not provided', () => {
    renderWithTheme(<CryptanalysisChallenge user={null} onClose={jest.fn()} />);
    expect(screen.queryByText(/cryptanalysis challenge/i)).not.toBeInTheDocument();
  });

  test('loads and displays a challenge for logged-in user', async () => {
    localStorage.setItem('token', 'test-token');

    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          id: 1,
          title: 'Break Caesar',
          description: 'Decrypt the message',
          difficulty: 'easy',
          cipher_type: 'caesar',
          encrypted_text: 'KHOOR',
          hint: 'Shift by 3',
          points: 10,
        },
      ],
    });

    renderWithTheme(
      <CryptanalysisChallenge user={{ id: 1, email: 'x@y.com' }} onClose={jest.fn()} />
    );

    expect(screen.getByText(/loading challenges/i)).toBeInTheDocument();

    expect(await screen.findByText(/break caesar/i)).toBeInTheDocument();
    expect(screen.getByText(/easy/i)).toBeInTheDocument();
    expect(screen.getAllByText(/caesar/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/10 pts/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/encrypted text/i)).toHaveTextContent('KHOOR');
    expect(screen.getByText(/shift by 3/i)).toBeInTheDocument();

    expect(global.fetch).toHaveBeenCalledWith('http://localhost:3001/api/challenges', {
      headers: { Authorization: 'Bearer test-token' },
    });
  });

  test('submits an attempt and shows correct result', async () => {
    localStorage.setItem('token', 'test-token');

    global.fetch = jest
      .fn()
      // initial load
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            id: 5,
            title: 'Break ROT13',
            description: 'Decrypt the message',
            difficulty: 'easy',
            cipher_type: 'rot13',
            encrypted_text: 'URYYB',
            hint: null,
            points: 5,
          },
        ],
      })
      // submit attempt
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ correct: true, message: 'Correct!', pointsEarned: 5 }),
      });

    renderWithTheme(
      <CryptanalysisChallenge user={{ id: 1, email: 'x@y.com' }} onClose={jest.fn()} />
    );

    await screen.findByText(/break rot13/i);

    await userEvent.type(
      screen.getByPlaceholderText(/type your best plaintext guess/i),
      'HELLO'
    );

    await userEvent.click(screen.getByRole('button', { name: /submit answer/i }));

    // Single-challenge scenario ends the run immediately.
    expect(await screen.findByText(/run complete/i)).toBeInTheDocument();

    expect(screen.getByRole('status')).toHaveTextContent('Correct!');
    expect(screen.getByRole('status')).toHaveTextContent('+5 pts');

    const attemptCall = global.fetch.mock.calls.find((c) => c[0] === 'http://localhost:3001/api/challenges/attempt');
    expect(attemptCall).toBeTruthy();

    const [, options] = attemptCall;
    const parsedBody = JSON.parse(options.body);
    expect(parsedBody).toMatchObject({ challengeId: 5, answer: 'HELLO' });
    expect(typeof parsedBody.timeTakenSeconds).toBe('number');

    expect(global.fetch).toHaveBeenCalledWith('http://localhost:3001/api/challenges/attempt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-token',
      },
      body: expect.any(String),
    });
  });

  test('calls onClose when overlay is clicked', async () => {
    localStorage.setItem('token', 'test-token');

    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    const onClose = jest.fn();

    renderWithTheme(<CryptanalysisChallenge user={{ id: 1 }} onClose={onClose} />);

    // Wait until loading is finished.
    await act(async () => {});

    await userEvent.click(document.querySelector('.cryptanalysis-overlay'));
    expect(onClose).toHaveBeenCalled();
  });
});
