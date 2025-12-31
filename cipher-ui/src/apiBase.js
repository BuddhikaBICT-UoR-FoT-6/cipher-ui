const rawBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

export const API_BASE_URL = String(rawBaseUrl).replace(/\/+$/, '');

export const apiUrl = (path) => {
  const p = String(path || '');
  if (!p) return API_BASE_URL;
  return `${API_BASE_URL}${p.startsWith('/') ? '' : '/'}${p}`;
};
