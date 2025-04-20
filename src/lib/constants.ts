export const APP_VERSION = '1.0.0';

export const SUPPORT_EMAIL = 'support@jmefit.com';
export const SECURITY_EMAIL = 'security@jmefit.com';

export const API_TIMEOUT = 8000; // 8 seconds

export const CACHE_TIMES = {
  PROFILE: 1000 * 60 * 5, // 5 minutes
  WORKOUTS: 1000 * 60 * 2, // 2 minutes
  SUBSCRIPTIONS: 1000 * 60 * 1, // 1 minute
} as const;

export const ERROR_MESSAGES = {
  GENERIC: 'Something went wrong. Please try again.',
  NETWORK: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'Please log in to continue.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION: 'Please check your input and try again.',
} as const;