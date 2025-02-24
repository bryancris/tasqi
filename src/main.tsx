
import { createRoot } from 'react-dom/client'
import React from 'react'
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationsProvider } from "@/components/notifications/NotificationsManager";
import { CalendarViewProvider } from "@/contexts/CalendarViewContext";
import App from './App.tsx'
import './index.css'

// Initialize QueryClient with stable configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 300000, // 5 minutes
      gcTime: 3600000, // 1 hour
      refetchOnMount: false,  // Prevent refetching on mount
      refetchOnReconnect: false, // Prevent refetching on reconnect
    },
  },
});

// Create root and render app with proper provider nesting
const root = document.getElementById("root");
if (!root) throw new Error('Root element not found');

createRoot(root).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider defaultTheme="system" enableSystem>
          <TooltipProvider>
            <AuthProvider>
              <NotificationsProvider>
                <CalendarViewProvider>
                  <App />
                </CalendarViewProvider>
              </NotificationsProvider>
            </AuthProvider>
          </TooltipProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
