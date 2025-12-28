import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SourceCodeViewer from './SourceCodeViewer';

describe('SourceCodeViewer', () => {
  test('expands and copies code', async () => {
    render(<SourceCodeViewer selectedCipher="caesar" />);

    expect(screen.getByText(/java source code/i)).toBeInTheDocument();

    await userEvent.click(screen.getByText(/java source code/i));

    expect(screen.getByRole('button', { name: /copy code/i })).toBeInTheDocument();
    expect(screen.getByText(/class CaesarCipher/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /copy code/i }));
    expect(navigator.clipboard.writeText).toHaveBeenCalled();
  });
});
