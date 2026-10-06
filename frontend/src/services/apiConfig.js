/**
 * API Configuration & Central Backend Base URL
 */
export const API_BASE_URL = 'http://localhost:5000/api';

/**
 * Helper to make API requests with error handling
 */
export const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  try {
    const res = await fetch(url, { ...options, headers });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || `Request failed with status ${res.status}`);
    }
    return data;
  } catch (err) {
    console.warn(`API request to ${endpoint} failed:`, err.message);
    throw err;
  }
};

/**
 * Simulates latency if needed for offline fallbacks
 */
export const simulateDelay = (ms = 250) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
