
import React, { useEffect, useState } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import Auth from '@/pages/Auth';
import Index from '@/pages/Index';
import Dashboard from '@/pages/Dashboard';
import Settings from '@/pages/Settings';
import NotFound from '@/pages/NotFound';
import { supabase } from './integrations/supabase/client';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import Chat from '@/pages/Chat';
import Waitlist from '@/pages/Waitlist';

function App() {
  const [session, setSession] = useState(null);
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthPage = location.pathname === '/auth';
  const isMobile = useIsMobile();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) {
        console.log("Auth session", session);
        // Redirect to dashboard after successful authentication, but not if already on /auth
        if (isAuthPage) {
          navigate('/dashboard');
        }
      } else {
        // Optionally redirect to /auth if the user logs out and isn't already there
        if (!isAuthPage && location.pathname !== '/') {
          navigate('/auth');
        }
      }
    })
  }, [isAuthPage, navigate, location.pathname])

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
    </div>
  );
}

export default App;
