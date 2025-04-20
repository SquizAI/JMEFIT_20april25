import { AppError, ErrorCodes } from './error';

const API_URL = import.meta.env.VITE_API_URL;

interface FetchOptions extends RequestInit {
  timeout?: number;
}

async function fetchWithTimeout(url: string, options: FetchOptions = {}) {
  const { timeout = 8000, ...fetchOptions } = options;
  
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
    });
    
    if (!response.ok) {
      throw new AppError(
        'API request failed',
        response.status === 401 ? ErrorCodes.UNAUTHORIZED : ErrorCodes.SERVER_ERROR,
        response.status
      );
    }
    
    return response;
  } finally {
    clearTimeout(id);
  }
}

export const api = {
  get: async <T>(endpoint: string, options?: FetchOptions): Promise<T> => {
    const response = await fetchWithTimeout(`${API_URL}${endpoint}`, {
      ...options,
      method: 'GET',
    });
    return response.json();
  },
  
  post: async <T>(endpoint: string, data: unknown, options?: FetchOptions): Promise<T> => {
    const response = await fetchWithTimeout(`${API_URL}${endpoint}`, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json();
  },
  
  put: async <T>(endpoint: string, data: unknown, options?: FetchOptions): Promise<T> => {
    const response = await fetchWithTimeout(`${API_URL}${endpoint}`, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.json();
  },
  
  delete: async <T>(endpoint: string, options?: FetchOptions): Promise<T> => {
    const response = await fetchWithTimeout(`${API_URL}${endpoint}`, {
      ...options,
      method: 'DELETE',
    });
    return response.json();
  },
};