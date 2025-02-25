
import { createRoot } from 'react-dom/client'
import React from 'react'
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from './App.tsx'
import './index.css'
import { Toaster } from "@/components/ui/toaster";
import { NotificationsProvider } from '@/components/notifications/NotificationsManager';

const queryClient = new QueryClient();

const root = document.getElementById("root");
if (!root) throw new Error('Root element not found');

createRoot(root).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <NotificationsProvider>
          <App />
          <Toaster />
        </NotificationsProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
);
