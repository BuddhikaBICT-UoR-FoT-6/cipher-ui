/**
 * CustomCipherBuilder tests.
 *
 * Validates mapping initialization/edit behavior and that callbacks fire when
 * the user changes the custom cipher definition.
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CustomCipherBuilder from './CustomCipherBuilder';

jest.mock('./Toast', () => ({
  __esModule: true,
  showToast: jest.fn(),
}));

describe('CustomCipherBuilder', () => {
  beforeEach(() => {
    localStorage.clear();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('initializes default mapping and calls onMappingChange', async () => {
    const onMappingChange = jest.fn();

    render(<CustomCipherBuilder onMappingChange={onMappingChange} onNameChange={jest.fn()} />);

    expect(screen.getByText(/custom cipher builder/i)).toBeInTheDocument();

    await waitFor(() => expect(onMappingChange).toHaveBeenCalled());

    const mapping = onMappingChange.mock.calls[0][0];
    expect(Object.keys(mapping)).toHaveLength(26);
    expect(mapping.A).toBe('A');
    expect(mapping.Z).toBe('Z');
  });

  test('shows saved ciphers list for logged-in user and can apply one', async () => {
    const onMappingChange = jest.fn();
    const onNameChange = jest.fn();
    localStorage.setItem('token', 'jwt');

    fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ([
        {
          id: 123,
          name: 'My Saved Cipher',
          mapping: { A: 'B', B: 'C', C: 'D', D: 'E', E: 'F', F: 'G', G: 'H', H: 'I', I: 'J', J: 'K', K: 'L', L: 'M', M: 'N', N: 'O', O: 'P', P: 'Q', Q: 'R', R: 'S', S: 'T', T: 'U', U: 'V', V: 'W', W: 'X', X: 'Y', Y: 'Z', Z: 'A' },
        },
      ]),
    });

    render(
      <CustomCipherBuilder
        user={{ id: 1, email: 'x@y.com', role: 'user' }}
        onMappingChange={onMappingChange}
        onNameChange={onNameChange}
      />
    );

    // Dropdown appears for logged in users
    const select = await screen.findByLabelText(/access previous ciphers/i);

    await waitFor(() => expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/ciphers',
      expect.objectContaining({ headers: expect.any(Object) })
    ));

    await userEvent.selectOptions(select, '123');

    expect(onNameChange).toHaveBeenCalledWith('My Saved Cipher');

    const lastMapping = onMappingChange.mock.calls[onMappingChange.mock.calls.length - 1][0];
    expect(lastMapping.A).toBe('B');
    expect(lastMapping.Z).toBe('A');
  });

  test('after saving a cipher, the saved ciphers list refreshes immediately', async () => {
    localStorage.setItem('token', 'jwt');

    // 1) initial load: empty list
    fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ([]),
    });

    // 2) save request
    fetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ message: 'Cipher saved successfully', id: 55 }),
    });

    // 3) refresh load: includes newly saved cipher
    fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ([
        { id: 55, name: 'New Cipher', mapping: { A: 'A', B: 'B', C: 'C', D: 'D', E: 'E', F: 'F', G: 'G', H: 'H', I: 'I', J: 'J', K: 'K', L: 'L', M: 'M', N: 'N', O: 'O', P: 'P', Q: 'Q', R: 'R', S: 'S', T: 'T', U: 'U', V: 'V', W: 'W', X: 'X', Y: 'Y', Z: 'Z' } },
      ]),
    });

    render(
      <CustomCipherBuilder
        user={{ id: 1, email: 'x@y.com', role: 'user' }}
        onMappingChange={jest.fn()}
        onNameChange={jest.fn()}
      />
    );

    const select = await screen.findByLabelText(/access previous ciphers/i);

    // Change name so save uses it
    await userEvent.clear(screen.getByPlaceholderText(/enter cipher name/i));
    await userEvent.type(screen.getByPlaceholderText(/enter cipher name/i), 'New Cipher');

    await userEvent.click(screen.getByRole('button', { name: /save cipher/i }));

    await waitFor(() => {
      // After save completes and refresh runs, the option should exist.
      expect(screen.getByRole('option', { name: 'New Cipher' })).toBeInTheDocument();
    });

    // Ensure refresh call happened (3 calls total)
    expect(fetch).toHaveBeenCalledTimes(3);
    expect(fetch).toHaveBeenNthCalledWith(
      1,
      'http://localhost:3001/api/ciphers',
      expect.any(Object)
    );
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      'http://localhost:3001/api/ciphers',
      expect.objectContaining({ method: 'POST' })
    );
    expect(fetch).toHaveBeenNthCalledWith(
      3,
      'http://localhost:3001/api/ciphers',
      expect.any(Object)
    );

    // sanity: dropdown is still present
    expect(select).toBeInTheDocument();
  });
});
