import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import CustomCipherBuilder from './CustomCipherBuilder';

jest.mock('./Toast', () => ({
  __esModule: true,
  showToast: jest.fn(),
}));

describe('CustomCipherBuilder', () => {
  beforeEach(() => {
    localStorage.clear();
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
});
