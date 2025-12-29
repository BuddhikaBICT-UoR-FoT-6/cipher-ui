/**
 * CipherHistory overlay tests.
 */

import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { renderWithTheme } from './test-utils';
import CipherHistory from './CipherHistory';

describe('CipherHistory', () => {
  beforeEach(() => {
    localStorage.clear();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('fetches and renders history entries for logged-in user', async () => {
    localStorage.setItem('token', 'jwt');

    fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ([
        {
          id: 1,
          cipher_type: 'custom',
          operation: 'encrypt',
          input_length: 5,
          execution_time: 1.23,
          input_text: 'HELLO',
          output_text: 'IFMMP',
          cipher_config: { name: 'My Cipher' },
          created_at: '2025-12-29T10:00:00.000Z',
        },
      ]),
    });

    renderWithTheme(
      <CipherHistory
        user={{ id: 1, email: 'x@y.com' }}
        onClose={() => {}}
      />
    );

    await waitFor(() => expect(fetch).toHaveBeenCalled());

    expect(await screen.findByText(/cipher history/i)).toBeInTheDocument();
    expect(screen.getByText(/custom/i)).toBeInTheDocument();
    expect(screen.getByText(/encrypt/i)).toBeInTheDocument();
    expect(screen.getByText('HELLO')).toBeInTheDocument();
    expect(screen.getByText('IFMMP')).toBeInTheDocument();
    expect(screen.getByText(/config/i)).toBeInTheDocument();
  });
});
