/**
 * RailFencePattern tests.
 *
 * Ensures the zigzag chart renders (or not) based on inputs.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import RailFencePattern from './RailFencePattern';

describe('RailFencePattern', () => {
  test('returns null for empty text', () => {
    const { container } = render(<RailFencePattern text="" rails={3} />);
    expect(container.firstChild).toBeNull();
  });

  test('renders a chart for non-empty text', () => {
    render(<RailFencePattern text="ABC" rails={3} />);

    expect(
      screen.getByRole('img', { name: /rail fence zigzag pattern chart/i })
    ).toBeInTheDocument();

    expect(screen.getByText(/␠ = space/i)).toBeInTheDocument();
    expect(screen.getByText(/↵ = newline/i)).toBeInTheDocument();
  });
});
