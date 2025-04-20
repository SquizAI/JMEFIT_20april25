import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'; 
import { initializeMonitoring } from './lib/monitoring';
import { initializeAnalytics } from './lib/analytics';
import { queryClient } from './lib/query';
import { Toaster } from 'react-hot-toast';
import App from './App.tsx';
import './index.css';

initializeMonitoring();
initializeAnalytics();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <Toaster position="top-right" toastOptions={{
          // Custom styling based on device type
          className: '',
          style: {
            maxWidth: '500px',
          },
          // Different styling on mobile devices
          success: {
            // Use CSS media query to hide on mobile devices
            className: 'react-hot-toast-success',
          },
        }} />
      </BrowserRouter>
      {import.meta.env.DEV && <ReactQueryDevtools />}
    </QueryClientProvider>
  </StrictMode>
);
