/**
 * SavedMessages tests.
 *
 * Verifies the modal renders and that close actions call the provided handler.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SavedMessages from './SavedMessages';

describe('SavedMessages', () => {
  test('renders modal and close calls onClose', async () => {
    const onClose = jest.fn();

    render(<SavedMessages user={{ id: 1 }} onClose={onClose} />);

    expect(await screen.findByRole('heading', { name: /saved messages/i })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '×' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
