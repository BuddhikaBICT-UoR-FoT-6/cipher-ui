/**
 * CipherChallenges overlay tests.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CipherChallenges from './CipherChallenges';

describe('CipherChallenges', () => {
  test('renders modal and close calls onClose', async () => {
    const onClose = jest.fn();

    render(<CipherChallenges user={{ id: 1 }} onClose={onClose} />);

    expect(await screen.findByText(/cipher challenges/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '×' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
