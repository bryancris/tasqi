
import { createRoot } from 'react-dom/client'
// Remove explicit React import since it's already injected by Vite config
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from './App.tsx'
import './index.css'
import { Toaster } from "@/components/ui/toaster";
import { NotificationsProvider } from '@/components/notifications/NotificationsManager';

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
        <App />
        <Toaster />
      </NotificationsProvider>
    </QueryClientProvider>
  </React.StrictMode>
);

// Let the PWA plugin handle service worker registration
// This approach avoids manual registration that can cause issues
