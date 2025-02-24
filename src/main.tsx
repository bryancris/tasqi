
import { createRoot } from 'react-dom/client'
import React, { useState, useEffect } from 'react'
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from './App.tsx'
import './index.css'
import { supabase } from "@/integrations/supabase/client";

// Initialize QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Create a stable auth provider at the root level
const RootProvider = () => {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      // Get initial session once
      await supabase.auth.getSession();
      setInitialized(true);
    };

    initializeAuth();
  }, []);

  if (!initialized) {
    return null;
  }

  return (
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </React.StrictMode>
  );
};

// Create root and render app
const root = document.getElementById("root");
if (!root) throw new Error('Root element not found');

createRoot(root).render(<RootProvider />);
