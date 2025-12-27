import React from 'react';
import { render, screen } from '@testing-library/react';
import BruteForceSimulator from './BruteForceSimulator';

describe('BruteForceSimulator', () => {
  test('returns null when not visible', () => {
    const { container } = render(<BruteForceSimulator isVisible={false} onClose={jest.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  test('renders analysis for identity mapping', () => {
    const mapping = {};
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach((l) => (mapping[l] = l));

    render(
      <BruteForceSimulator
        isVisible={true}
        onClose={jest.fn()}
        customCipherData={{ name: 'My Cipher', mapping }}
      />
    );

    expect(screen.getByText(/brute force simulator/i)).toBeInTheDocument();
    expect(screen.getByText(/identity mapping/i)).toBeInTheDocument();
  });
});
