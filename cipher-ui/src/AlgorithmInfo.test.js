import React from 'react';
import { render, screen } from '@testing-library/react';
import AlgorithmInfo from './AlgorithmInfo';

describe('AlgorithmInfo', () => {
  test('renders Caesar info', () => {
    render(<AlgorithmInfo selectedCipher="caesar" />);

    expect(screen.getByText(/algorithm information/i)).toBeInTheDocument();
    expect(screen.getByText(/25 possible keys/i)).toBeInTheDocument();
  });

  test('computes key space for chaining', () => {
    render(
      <AlgorithmInfo
        selectedCipher="chain"
        chainSteps={[
          { cipher: 'caesar', shift: 3 },
          { cipher: 'vigenere', key: 'HELLO' },
          { cipher: 'railfence', rails: 3 },
        ]}
      />
    );

    expect(screen.getByText(/multiple ciphers in sequence/i)).toBeInTheDocument();
    expect(screen.getByText(/2\^/i)).toBeInTheDocument();
    expect(screen.getByText(/combined/i)).toBeInTheDocument();
  });
});
