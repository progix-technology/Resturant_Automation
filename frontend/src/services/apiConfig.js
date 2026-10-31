import { storage } from '../utils/storage';
import { STORAGE_KEYS } from '../constants/storageKeys';

const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  // Smart fallback for live production frontend (e.g. Vercel)
  if (typeof window !== 'undefined' && !['localhost', '127.0.0.1'].includes(window.location.hostname)) {
    return 'https://resturant-automation-ihxs.onrender.com/api';
  }
  return 'http://localhost:5000/api';
};

export const API_BASE_URL = getApiBaseUrl();

/**
 * Retrieves valid JWT session token for Admin or SuperAdmin
 */
export const getAuthToken = (endpoint = '') => {
  if (endpoint.startsWith('/superadmin')) {
    const superAdminSession = storage.get(STORAGE_KEYS.SUPERADMIN_SESSION, null);
    return superAdminSession?.token || null;
  }
  const adminSession = storage.get(STORAGE_KEYS.ADMIN_SESSION, null);
  const superAdminSession = storage.get(STORAGE_KEYS.SUPERADMIN_SESSION, null);
  return adminSession?.token || superAdminSession?.token || null;
};

/**
 * Helper to make API requests with error handling & auto JWT Authorization injection
 */
export const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  // Automatically attach JWT token for authenticated requests if not already provided
  if (!headers['Authorization'] && !headers['authorization']) {
    const token = getAuthToken(endpoint);
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

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
