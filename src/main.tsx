
import React from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import { Toaster } from "@/components/ui/toaster";
import { NotificationsProvider } from '@/components/notifications/NotificationsManager';
import { CalendarViewProvider } from '@/contexts/CalendarViewContext';

// Initialize the query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false
    }
  }
});

// Track if we're in development mode to tune performance
const isDev = process.env.NODE_ENV === 'development';
console.log(`Application running in ${isDev ? 'development' : 'production'} mode`);

// Create the root element and render the application
const rootElement = document.getElementById("root");
if (!rootElement) throw new Error('Root element not found');

createRoot(rootElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <NotificationsProvider>
        <BrowserRouter>
          <CalendarViewProvider>
            <App />
          </CalendarViewProvider>
        </BrowserRouter>
        <Toaster />
      </NotificationsProvider>
    </QueryClientProvider>
  </React.StrictMode>
);

// Let the PWA plugin handle service worker registration
// This approach avoids manual registration that can cause issues
