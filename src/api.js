
/**
 * API Utility Module
 * Provides reusable functions for communicating with the PlaceReady
 * backend using GET, POST, and PUT requests. Manages authentication tokens
 * in localStorage, attaches Bearer tokens to authorized requests, handles
 * API errors, and redirects users to the login page when authentication
 * expires or becomes invalid.
 */

const BASE = import.meta.env.VITE_API_URL || '/api';

export const getToken = () => localStorage.getItem('pr_token');
export const setToken = (t) => (t ? localStorage.setItem('pr_token', t) : localStorage.removeItem('pr_token'));

async function request(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}) },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && getToken()) { setToken(null); window.location.href = '/login'; }
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const api = {
  get: (p) => request('GET', p),
  post: (p, b) => request('POST', p, b || {}),
  put: (p, b) => request('PUT', p, b || {})
};
