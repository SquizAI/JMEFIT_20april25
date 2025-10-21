/**
 * Supabase Error Handling Utility
 *
 * Provides centralized error classification, user-friendly messages,
 * and secure logging for Supabase operations.
 *
 * Security Features:
 * - Never exposes database schema details to users
 * - Logs full error context for debugging
 * - Classifies errors by type for appropriate handling
 * - Provides actionable user messages
 */

import { PostgrestError } from '@supabase/supabase-js';

/**
 * Error classification types
 */
export enum SupabaseErrorType {
  NETWORK = 'network',
  AUTH = 'auth',
  PERMISSION = 'permission',
  NOT_FOUND = 'not_found',
  VALIDATION = 'validation',
  CONFLICT = 'conflict',
  DATABASE = 'database',
  UNKNOWN = 'unknown',
}

/**
 * Classified error result
 */
export interface ClassifiedError {
  type: SupabaseErrorType;
  userMessage: string;
  logMessage: string;
  shouldRetry: boolean;
  code?: string;
}

/**
 * Postgres error codes we care about
 * See: https://www.postgresql.org/docs/current/errcodes-appendix.html
 */
const POSTGRES_CODES = {
  // Class 23 - Integrity Constraint Violation
  UNIQUE_VIOLATION: '23505',
  FOREIGN_KEY_VIOLATION: '23503',
  NOT_NULL_VIOLATION: '23502',
  CHECK_VIOLATION: '23514',

  // Class 42 - Syntax Error or Access Rule Violation
  INSUFFICIENT_PRIVILEGE: '42501',
  UNDEFINED_TABLE: '42P01',
  UNDEFINED_COLUMN: '42703',

  // Class 08 - Connection Exception
  CONNECTION_FAILURE: '08006',
  CONNECTION_DOES_NOT_EXIST: '08003',

  // Class 53 - Insufficient Resources
  DISK_FULL: '53100',
  OUT_OF_MEMORY: '53200',
};

/**
 * Supabase error codes
 */
const SUPABASE_CODES = {
  // Row Level Security
  PGRST116: 'PGRST116', // No rows returned (could be RLS blocking access)

  // Auth errors
  INVALID_CREDENTIALS: '401',
  EMAIL_NOT_CONFIRMED: '400',
  USER_ALREADY_EXISTS: '422',
  WEAK_PASSWORD: '422',
};

/**
 * Classify a Supabase error and provide appropriate messaging
 */
export function classifySupabaseError(error: any): ClassifiedError {
  // Handle null/undefined
  if (!error) {
    return {
      type: SupabaseErrorType.UNKNOWN,
      userMessage: 'An unexpected error occurred. Please try again.',
      logMessage: 'Null or undefined error received',
      shouldRetry: false,
    };
  }

  // Extract error properties safely
  const message = error.message || error.msg || '';
  const code = error.code || '';
  const details = error.details || '';
  const hint = error.hint || '';

  // Network errors (no connection)
  if (
    message.includes('network') ||
    message.includes('fetch') ||
    message.includes('Failed to fetch') ||
    message.includes('NetworkError') ||
    code === POSTGRES_CODES.CONNECTION_FAILURE ||
    code === POSTGRES_CODES.CONNECTION_DOES_NOT_EXIST
  ) {
    return {
      type: SupabaseErrorType.NETWORK,
      userMessage: 'Unable to connect to the server. Please check your internet connection and try again.',
      logMessage: `Network error: ${message}`,
      shouldRetry: true,
      code,
    };
  }

  // Auth errors
  if (
    message.includes('Invalid login credentials') ||
    message.includes('Authentication') ||
    message.includes('Invalid API key') ||
    code === SUPABASE_CODES.INVALID_CREDENTIALS
  ) {
    return {
      type: SupabaseErrorType.AUTH,
      userMessage: 'Invalid email or password. Please try again.',
      logMessage: `Auth error: ${message}`,
      shouldRetry: false,
      code,
    };
  }

  // Email not confirmed
  if (
    message.includes('Email not confirmed') ||
    message.includes('email_confirmed_at')
  ) {
    return {
      type: SupabaseErrorType.AUTH,
      userMessage: 'Please verify your email address before signing in. Check your inbox for a verification link.',
      logMessage: `Email not confirmed: ${message}`,
      shouldRetry: false,
      code,
    };
  }

  // User already exists
  if (
    message.includes('already registered') ||
    message.includes('User already registered') ||
    code === POSTGRES_CODES.UNIQUE_VIOLATION
  ) {
    return {
      type: SupabaseErrorType.CONFLICT,
      userMessage: 'This email is already registered. Please sign in instead or use a different email.',
      logMessage: `User already exists: ${message}`,
      shouldRetry: false,
      code,
    };
  }

  // Weak password
  if (
    message.includes('Password should be') ||
    message.includes('password') && message.includes('weak')
  ) {
    return {
      type: SupabaseErrorType.VALIDATION,
      userMessage: 'Password must be at least 8 characters with uppercase, lowercase, and numbers.',
      logMessage: `Weak password: ${message}`,
      shouldRetry: false,
      code,
    };
  }

  // RLS policy violation (no rows or permission denied)
  if (
    code === SUPABASE_CODES.PGRST116 ||
    code === POSTGRES_CODES.INSUFFICIENT_PRIVILEGE ||
    message.includes('permission denied') ||
    message.includes('row-level security')
  ) {
    return {
      type: SupabaseErrorType.PERMISSION,
      userMessage: 'You do not have permission to access this resource.',
      logMessage: `Permission denied: ${message} (code: ${code}, details: ${details})`,
      shouldRetry: false,
      code,
    };
  }

  // Not found (could be RLS or actual missing data)
  if (
    message.includes('not found') ||
    message.includes('does not exist') ||
    code === POSTGRES_CODES.UNDEFINED_TABLE ||
    code === POSTGRES_CODES.UNDEFINED_COLUMN
  ) {
    return {
      type: SupabaseErrorType.NOT_FOUND,
      userMessage: 'The requested resource was not found.',
      logMessage: `Resource not found: ${message} (code: ${code})`,
      shouldRetry: false,
      code,
    };
  }

  // Foreign key violation
  if (code === POSTGRES_CODES.FOREIGN_KEY_VIOLATION) {
    return {
      type: SupabaseErrorType.VALIDATION,
      userMessage: 'Cannot complete this operation. Related data is missing or has been deleted.',
      logMessage: `Foreign key violation: ${message} (details: ${details}, hint: ${hint})`,
      shouldRetry: false,
      code,
    };
  }

  // Check constraint violation
  if (code === POSTGRES_CODES.CHECK_VIOLATION) {
    return {
      type: SupabaseErrorType.VALIDATION,
      userMessage: 'Invalid data provided. Please check your input and try again.',
      logMessage: `Check constraint violation: ${message} (details: ${details}, hint: ${hint})`,
      shouldRetry: false,
      code,
    };
  }

  // Not null violation
  if (code === POSTGRES_CODES.NOT_NULL_VIOLATION) {
    return {
      type: SupabaseErrorType.VALIDATION,
      userMessage: 'Required information is missing. Please fill in all required fields.',
      logMessage: `Not null violation: ${message} (details: ${details}, hint: ${hint})`,
      shouldRetry: false,
      code,
    };
  }

  // Resource errors (disk/memory)
  if (
    code === POSTGRES_CODES.DISK_FULL ||
    code === POSTGRES_CODES.OUT_OF_MEMORY
  ) {
    return {
      type: SupabaseErrorType.DATABASE,
      userMessage: 'The server is experiencing high load. Please try again in a few moments.',
      logMessage: `Resource error: ${message} (code: ${code})`,
      shouldRetry: true,
      code,
    };
  }

  // Generic database error
  if (code && code.startsWith('P')) {
    return {
      type: SupabaseErrorType.DATABASE,
      userMessage: 'A database error occurred. Please try again or contact support if the problem persists.',
      logMessage: `Database error: ${message} (code: ${code}, details: ${details}, hint: ${hint})`,
      shouldRetry: false,
      code,
    };
  }

  // Unknown error
  return {
    type: SupabaseErrorType.UNKNOWN,
    userMessage: 'An unexpected error occurred. Please try again or contact support.',
    logMessage: `Unknown error: ${JSON.stringify({ message, code, details, hint })}`,
    shouldRetry: false,
    code,
  };
}

/**
 * Log an error with proper context (for server-side logging)
 */
export function logSupabaseError(
  error: any,
  context: {
    operation: string;
    table?: string;
    userId?: string;
    additionalInfo?: Record<string, any>;
  }
): void {
  const classified = classifySupabaseError(error);

  // Create structured log
  const logEntry = {
    timestamp: new Date().toISOString(),
    type: classified.type,
    operation: context.operation,
    table: context.table,
    userId: context.userId,
    code: classified.code,
    message: classified.logMessage,
    shouldRetry: classified.shouldRetry,
    additionalInfo: context.additionalInfo,
  };

  // Log to console (in production, this would go to Sentry/LogRocket)
  console.error('[Supabase Error]', logEntry);

  // In production, send to error tracking service:
  // if (import.meta.env.PROD) {
  //   Sentry.captureException(error, {
  //     tags: {
  //       errorType: classified.type,
  //       operation: context.operation,
  //       table: context.table,
  //     },
  //     extra: logEntry,
  //   });
  // }
}

/**
 * Handle a Supabase error with proper logging and user messaging
 *
 * Usage:
 * ```typescript
 * const { data, error } = await supabase.from('products').select('*');
 * if (error) {
 *   const handled = handleSupabaseError(error, {
 *     operation: 'fetch_products',
 *     table: 'products',
 *     userId: user?.id,
 *   });
 *   toast.error(handled.userMessage);
 *   if (handled.shouldRetry) {
 *     // Implement retry logic
 *   }
 *   throw new Error(handled.userMessage);
 * }
 * ```
 */
export function handleSupabaseError(
  error: any,
  context: {
    operation: string;
    table?: string;
    userId?: string;
    additionalInfo?: Record<string, any>;
  }
): ClassifiedError {
  const classified = classifySupabaseError(error);
  logSupabaseError(error, context);
  return classified;
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: any): boolean {
  const classified = classifySupabaseError(error);
  return classified.shouldRetry;
}

/**
 * Extract user-friendly message from any error
 */
export function getUserErrorMessage(error: any): string {
  const classified = classifySupabaseError(error);
  return classified.userMessage;
}

/**
 * Check if error is a specific type
 */
export function isErrorType(error: any, type: SupabaseErrorType): boolean {
  const classified = classifySupabaseError(error);
  return classified.type === type;
}
