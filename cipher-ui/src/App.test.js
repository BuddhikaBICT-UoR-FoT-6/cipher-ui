/**
 * App smoke tests.
 *
 * Ensures the top-level UI renders key content.
 */
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders cipher app heading', () => {
  render(<App />);
  expect(screen.getByText(/cipher algorithms/i)).toBeInTheDocument();
});
