
import { createRoot } from 'react-dom/client'
import React from 'react'
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from './App.tsx'
import './index.css'
import { Toaster } from "@/components/ui/toaster";
import { NotificationsProvider } from '@/components/notifications/NotificationsManager';
import { AuthProvider } from '@/contexts/AuthContext';

const queryClient = new QueryClient();

// Track if we're in development mode to tune performance
const isDev = process.env.NODE_ENV === 'development';

// Handle service worker registration in a non-blocking way
if ('serviceWorker' in navigator) {
  // Delay service worker registration in development to prioritize app loading
  const registerDelay = isDev ? 2000 : 0;
  
  window.addEventListener('load', () => {
    setTimeout(() => {
      // Register service worker but don't block app rendering
      navigator.serviceWorker.register('/registerSW.js')
        .then(registration => {
          console.log('✅ SW registered:', registration);
          
          // Handle updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New content is available
                  const event = new CustomEvent('updateAvailable');
                  window.dispatchEvent(event);
                }
              });
            }
          });
        })
        .catch(error => {
          // Log error but don't block app functionality
          console.warn('⚠️ SW registration failed, app will work without offline capabilities:', error);
        });
    }, registerDelay);
  });

  // Handle service worker updates
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });
}

const root = document.getElementById("root");
if (!root) throw new Error('Root element not found');

createRoot(root).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationsProvider>
          <App />
          <Toaster />
        </NotificationsProvider>
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
