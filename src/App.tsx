
import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
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
import Pricing from '@/pages/Pricing';
import { useAuth } from '@/contexts/auth';
import { DevAuthTools } from '@/components/dev/DevAuthTools';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import Notes from '@/pages/Notes';
import Analytics from '@/pages/Analytics';
import SelfCare from '@/pages/SelfCare';
import PhysicalWellness from '@/pages/PhysicalWellness';

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
        <Route path="/pricing" element={<Pricing />} />
        
        {/* Protected routes wrapped in DashboardLayout */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout><Outlet /></DashboardLayout>}>
            <Route path="/dashboard/*" element={<Dashboard />} />
            <Route path="/dashboard/notes" element={<Notes />} />
            <Route path="/dashboard/analytics" element={<Analytics />} />
            <Route path="/dashboard/self-care" element={<SelfCare />} />
            <Route path="/self-care/physical-wellness" element={<PhysicalWellness />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/chat" element={<Chat />} />
          </Route>
        </Route>
        
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
      {/* DevAuthTools component is still included, but it now returns null */}
      {process.env.NODE_ENV === 'development' && <DevAuthTools />}
    </div>
  );
}

export default App;
