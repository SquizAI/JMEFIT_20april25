/**
 * Retry Logic Utility
 *
 * Implements exponential backoff retry for transient failures.
 * Never retries client errors (4xx), only server errors and network issues.
 *
 * Features:
 * - Exponential backoff: 1s, 2s, 4s
 * - Configurable max retries
 * - Smart error detection (don't retry client errors)
 * - Async/await compatible
 */

import { isRetryableError } from './supabase-errors';

/**
 * Retry configuration options
 */
export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  onRetry?: (attempt: number, error: any) => void;
}

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelayMs: 1000, // 1 second
  maxDelayMs: 10000, // 10 seconds
  backoffMultiplier: 2, // Exponential: 1s, 2s, 4s, 8s (capped at maxDelayMs)
  onRetry: () => {}, // No-op by default
};

/**
 * Sleep/delay utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate delay for exponential backoff
 */
function calculateDelay(
  attempt: number,
  initialDelay: number,
  backoffMultiplier: number,
  maxDelay: number
): number {
  const delay = initialDelay * Math.pow(backoffMultiplier, attempt);
  return Math.min(delay, maxDelay);
}

/**
 * Execute a function with retry logic
 *
 * @param fn - Async function to execute
 * @param options - Retry configuration
 * @returns Promise resolving to the function result
 *
 * @example
 * ```typescript
 * const products = await withRetry(
 *   async () => {
 *     const { data, error } = await supabase.from('products').select('*');
 *     if (error) throw error;
 *     return data;
 *   },
 *   {
 *     maxRetries: 3,
 *     onRetry: (attempt, error) => {
 *       console.log(`Retry attempt ${attempt} after error:`, error.message);
 *     }
 *   }
 * );
 * ```
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: RetryOptions
): Promise<T> {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: any;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      // Execute the function
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if this error is retryable
      if (!isRetryableError(error)) {
        // Don't retry client errors, auth errors, validation errors, etc.
        throw error;
      }

      // If we've exhausted retries, throw the error
      if (attempt >= config.maxRetries) {
        throw error;
      }

      // Calculate delay for this attempt
      const delay = calculateDelay(
        attempt,
        config.initialDelayMs,
        config.backoffMultiplier,
        config.maxDelayMs
      );

      // Call onRetry callback
      config.onRetry(attempt + 1, error);

      // Log the retry attempt
      console.warn(
        `Retry attempt ${attempt + 1}/${config.maxRetries} after ${delay}ms`,
        { error: error.message || error }
      );

      // Wait before retrying
      await sleep(delay);
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError;
}

/**
 * Retry a Supabase query operation
 *
 * Convenience wrapper for Supabase operations that automatically
 * extracts data/error and throws on error.
 *
 * @example
 * ```typescript
 * const products = await retrySupabaseQuery(
 *   () => supabase.from('products').select('*')
 * );
 * ```
 */
export async function retrySupabaseQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  options?: RetryOptions
): Promise<T> {
  return withRetry(async () => {
    const { data, error } = await queryFn();

    if (error) {
      throw error;
    }

    if (data === null || data === undefined) {
      throw new Error('No data returned from query');
    }

    return data;
  }, options);
}

/**
 * Retry a Supabase mutation operation (insert/update/delete)
 *
 * Similar to retrySupabaseQuery but optimized for mutations.
 *
 * @example
 * ```typescript
 * const result = await retrySupabaseMutation(
 *   () => supabase.from('orders').insert({ user_id: '123', total: 99.99 })
 * );
 * ```
 */
export async function retrySupabaseMutation<T>(
  mutationFn: () => Promise<{ data: T | null; error: any }>,
  options?: RetryOptions
): Promise<T> {
  // For mutations, we typically want fewer retries to avoid duplicate operations
  const mutationOptions: RetryOptions = {
    maxRetries: 1, // Only retry once for mutations
    ...options,
  };

  return retrySupabaseQuery(mutationFn, mutationOptions);
}

/**
 * Create a retryable version of a function
 *
 * Returns a new function that automatically retries on failure.
 *
 * @example
 * ```typescript
 * const fetchProducts = createRetryable(
 *   async () => {
 *     const { data, error } = await supabase.from('products').select('*');
 *     if (error) throw error;
 *     return data;
 *   },
 *   { maxRetries: 3 }
 * );
 *
 * // Later, call it normally - retries are automatic
 * const products = await fetchProducts();
 * ```
 */
export function createRetryable<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options?: RetryOptions
): T {
  return (async (...args: any[]) => {
    return withRetry(() => fn(...args), options);
  }) as T;
}

/**
 * Batch retry - retry multiple operations with exponential backoff
 *
 * Useful for batch operations where you want to retry all failed operations.
 *
 * @example
 * ```typescript
 * const results = await batchRetry([
 *   () => supabase.from('products').select('*'),
 *   () => supabase.from('orders').select('*'),
 *   () => supabase.from('users').select('*'),
 * ]);
 * ```
 */
export async function batchRetry<T>(
  operations: Array<() => Promise<T>>,
  options?: RetryOptions
): Promise<T[]> {
  return Promise.all(
    operations.map(op => withRetry(op, options))
  );
}

/**
 * Retry with timeout
 *
 * Adds a timeout to the retry logic. If the operation takes longer than
 * the timeout, it will fail even if retries are available.
 *
 * @param fn - Function to execute
 * @param timeoutMs - Timeout in milliseconds
 * @param options - Retry options
 *
 * @example
 * ```typescript
 * const products = await withRetryTimeout(
 *   async () => {
 *     const { data, error } = await supabase.from('products').select('*');
 *     if (error) throw error;
 *     return data;
 *   },
 *   5000, // 5 second timeout
 *   { maxRetries: 3 }
 * );
 * ```
 */
export async function withRetryTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  options?: RetryOptions
): Promise<T> {
  return Promise.race([
    withRetry(fn, options),
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error(`Operation timed out after ${timeoutMs}ms`)),
        timeoutMs
      )
    ),
  ]);
}

/**
 * Check if an operation should be retried based on attempt number
 *
 * Utility function for manual retry logic.
 */
export function shouldRetry(
  attempt: number,
  maxRetries: number,
  error: any
): boolean {
  if (attempt >= maxRetries) {
    return false;
  }

  return isRetryableError(error);
}

/**
 * Get the next retry delay
 *
 * Utility function for manual retry logic.
 */
export function getRetryDelay(
  attempt: number,
  options?: Pick<RetryOptions, 'initialDelayMs' | 'backoffMultiplier' | 'maxDelayMs'>
): number {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options };
  return calculateDelay(
    attempt,
    config.initialDelayMs,
    config.backoffMultiplier,
    config.maxDelayMs
  );
}
