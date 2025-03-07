
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

// Register service worker with improved error handling
const registerServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) {
    console.log('❌ Service workers not supported in this browser');
    return;
  }
  
  if (isDev) {
    console.log('🔨 Development mode: Service Worker disabled');
    return;
  }

  try {
    // Wait for window load event to avoid competing for browser resources
    // during the critical initial page load
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('/registerSW.js');
        console.log('✅ SW registered:', registration.scope);
        
        // Setup update handler
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              // When the new service worker is installed and ready to take over
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('🔄 New content is available. Notifying user...');
                // Dispatch event for the UI to show update notification
                window.dispatchEvent(new CustomEvent('sw-update-found'));
              }
            });
          }
        });
      } catch (error) {
        console.warn('⚠️ SW registration failed:', error);
      }
    });

    // Handle service worker updates and reload
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        console.log('🔄 Service worker controller changed, reloading...');
        window.location.reload();
      }
    });
  } catch (error) {
    console.error('❌ Error during service worker registration:', error);
  }
};

// Call the service worker registration function
registerServiceWorker();

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
