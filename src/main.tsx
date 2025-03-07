
import { createRoot } from 'react-dom/client'
import React from 'react'
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from './App.tsx'
import './index.css'
import { Toaster } from "@/components/ui/toaster";
import { NotificationsProvider } from '@/components/notifications/NotificationsManager';

const queryClient = new QueryClient();

// Track if we're in development mode to tune performance
const isDev = process.env.NODE_ENV === 'development';

// Service worker refresh flag - prevents multiple reloads
let isRefreshing = false;

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
        // Check if a registration is already active to prevent duplicate registrations
        const existingRegistration = await navigator.serviceWorker.getRegistration();
        if (existingRegistration?.active) {
          console.log('✅ Using existing SW registration:', existingRegistration.scope);
          return;
        }
        
        const registration = await navigator.serviceWorker.register('/registerSW.js');
        console.log('✅ SW registered:', registration.scope);
        
        // Setup update handler - only after initial registration is complete
        setTimeout(() => {
          if (registration.waiting) {
            // If there's already a waiting service worker, notify user
            console.log('🔄 New update ready and waiting');
            window.dispatchEvent(new CustomEvent('sw-update-found'));
          }
        
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              console.log('🔄 Service worker update found, installing...');
              
              newWorker.addEventListener('statechange', () => {
                // When the new service worker is installed and waiting to take over
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('🔄 New content is available and waiting. Notifying user...');
                  // Dispatch event for the UI to show update notification
                  window.dispatchEvent(new CustomEvent('sw-update-found'));
                }
              });
            }
          });
        }, 1000);
      } catch (error) {
        console.warn('⚠️ SW registration failed:', error);
      }
    });

    // Handle service worker updates and reload - with safeguards to prevent loops
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('🔄 Service worker controller changed');
      
      // Prevent multiple reloads
      if (!isRefreshing) {
        isRefreshing = true;
        
        // Store a flag to detect reload loops
        const now = Date.now();
        const lastReload = parseInt(sessionStorage.getItem('sw_last_reload') || '0', 10);
        
        // If we've reloaded recently (within 10 seconds), don't reload again
        if (now - lastReload < 10000) {
          console.warn('⚠️ Detected potential reload loop, suppressing reload');
          isRefreshing = false;
          return;
        }
        
        // Store the current time as the last reload time
        sessionStorage.setItem('sw_last_reload', now.toString());
        
        // Add a slight delay to prevent immediate reloads
        setTimeout(() => {
          console.log('🔄 Reloading page to activate new service worker...');
          window.location.reload();
        }, 500);
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
      <NotificationsProvider>
        <App />
        <Toaster />
      </NotificationsProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
