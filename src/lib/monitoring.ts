import React from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';
import { createRoutesFromChildren, matchRoutes } from 'react-router-dom';
import * as Sentry from '@sentry/react';
import { Integrations } from '@sentry/tracing';
import { AppError } from './error';

export function initializeMonitoring() {
  if (import.meta.env.PROD) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      environment: import.meta.env.MODE,
      release: '1.0.0',
      integrations: [
        new Integrations.BrowserTracing({
          tracePropagationTargets: ['localhost', 'jmefit.com'],
          routingInstrumentation: Sentry.reactRouterV6Instrumentation(
            React.useEffect,
            useLocation,
            useNavigationType,
            createRoutesFromChildren,
            matchRoutes
          )
        }),
        new Sentry.Replay(),
      ],
      tracesSampleRate: 1.0,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0
    });
  }
}

export function captureError(error: unknown) {
  if (error instanceof AppError) {
    Sentry.captureException(error, {
      tags: {
        code: error.code,
        statusCode: error.statusCode,
      },
    });
  } else {
    Sentry.captureException(error);
  }
}