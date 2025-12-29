/**
 * Jest setup for the React UI.
 *
 * Extends matchers via `@testing-library/jest-dom` and polyfills browser APIs
 * (e.g., clipboard, matchMedia, createObjectURL) that JSDOM may not provide.
 */
// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Common browser APIs used across components that are not fully implemented in JSDOM.
if (!navigator.clipboard) {
	Object.defineProperty(navigator, 'clipboard', {
		value: {
			writeText: jest.fn().mockResolvedValue(undefined),
		},
		configurable: true,
	});
}

if (!window.matchMedia) {
	window.matchMedia = jest.fn().mockImplementation((query) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: jest.fn(),
		removeListener: jest.fn(),
		addEventListener: jest.fn(),
		removeEventListener: jest.fn(),
		dispatchEvent: jest.fn(),
	}));
}

if (!URL.createObjectURL) {
	URL.createObjectURL = jest.fn(() => 'blob:mock');
}

if (!URL.revokeObjectURL) {
	URL.revokeObjectURL = jest.fn();
}
