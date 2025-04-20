import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppError, ErrorCodes } from '../lib/error';

export function useErrorHandler() {
  const navigate = useNavigate();

  const handleError = useCallback((error: unknown) => {
    const appError = error instanceof AppError ? error : new AppError(
      'An unexpected error occurred',
      ErrorCodes.SERVER_ERROR
    );

    switch (appError.code) {
      case ErrorCodes.UNAUTHORIZED:
        navigate('/auth');
        break;
      case ErrorCodes.FORBIDDEN:
        navigate('/');
        break;
      case ErrorCodes.NOT_FOUND:
        navigate('/404');
        break;
      case ErrorCodes.SUBSCRIPTION_ERROR:
        navigate('/pricing');
        break;
      default:
        // Log error to error tracking service in production
        console.error(appError);
    }

    return appError;
  }, [navigate]);

  return { handleError };
}