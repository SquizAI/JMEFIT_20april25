import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

declare global {
  interface Window {
    gtag: (command: string, ...args: any[]) => void;
    dataLayer: any[];
  }
}

export function initializeAnalytics() {
  if (import.meta.env.PROD) {
    // Initialize Google Analytics
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${import.meta.env.VITE_GA_MEASUREMENT_ID}`;
    document.head.appendChild(script);

    // Initialize dataLayer
    window.dataLayer = window.dataLayer || [];
    window.gtag = function(...args) {
      window.dataLayer.push(args);
    };
    window.gtag('js', new Date());
    window.gtag('config', import.meta.env.VITE_GA_MEASUREMENT_ID);

    // Initialize Sentry
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      integrations: [
        new BrowserTracing({
          tracePropagationTargets: ['localhost', 'jmefit.com'],
        }),
      ],
      tracesSampleRate: 1.0,
      environment: import.meta.env.MODE,
    });
  }
}

export function trackPageView(path: string) {
  if (import.meta.env.PROD) {
    // Google Analytics
    window.gtag('event', 'page_view', {
      page_path: path,
    });

    // Sentry
    Sentry.addBreadcrumb({
      category: 'navigation',
      message: `Page view: ${path}`,
      level: 'info',
    });
  }
}

export function trackEvent(category: string, action: string, label?: string) {
  if (import.meta.env.PROD) {
    // Google Analytics
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
    });

    // Sentry
    Sentry.addBreadcrumb({
      category,
      message: `${action}${label ? `: ${label}` : ''}`,
      level: 'info',
    });
  }
}

export function startTransaction(name: string, op: string): any {
  if (import.meta.env.PROD) {
    return Sentry.startTransaction({ name, op });
  }
}