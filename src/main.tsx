
import { createRoot } from 'react-dom/client'
import React from 'react'
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from './App.tsx'
import './index.css'
import { Toaster } from "@/components/ui/toaster";
import { NotificationsProvider } from '@/components/notifications/NotificationsManager';
import { AuthProvider } from '@/contexts/AuthContext';

const queryClient = new QueryClient();

// Register service worker with error handling
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
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
        console.error('❌ SW registration failed:', error);
      });
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
