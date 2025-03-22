
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import Auth from '@/pages/Auth';
import Index from '@/pages/Index';
import Dashboard from '@/pages/Dashboard';
import Settings from '@/pages/Settings';
import NotFound from '@/pages/NotFound';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import Chat from '@/pages/Chat';
import Waitlist from '@/pages/Waitlist';
import { useAuth } from '@/contexts/auth';
import { DevAuthTools } from '@/components/dev/DevAuthTools';

function App() {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { initialized } = useAuth();

  return (
    <div>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/waitlist" element={<Waitlist />} />
        
        {/* Protected routes below */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/chat" element={<Chat />} />
        </Route>
        
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
      {/* Show DevAuthTools in development mode */}
      {process.env.NODE_ENV === 'development' && <DevAuthTools />}
    </div>
  );
}

export default App;
