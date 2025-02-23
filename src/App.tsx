import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "next-themes";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { UpdatePrompt } from "@/components/pwa/UpdatePrompt";
import { NotificationsProvider } from "@/components/notifications/NotificationsManager";
import { CalendarViewProvider } from "@/contexts/CalendarViewContext";
import { useSupabaseSubscription } from "@/hooks/use-supabase-subscription";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Notes from "./pages/Notes";
import Analytics from "./pages/Analytics";
import SelfCare from "./pages/SelfCare";
import PhysicalWellness from "./pages/PhysicalWellness";
import MentalWellbeing from "./pages/MentalWellbeing";
import PersonalGrowth from "./pages/PersonalGrowth";
import SocialConnections from "./pages/SocialConnections";
import DailyRituals from "./pages/DailyRituals";
import EmotionalCare from "./pages/EmotionalCare";
import Settings from "./pages/Settings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UpdatePasswordForm } from "@/components/auth/UpdatePasswordForm";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const UpdatePasswordPage = () => {
  useEffect(() => {
    const handlePasswordReset = async () => {
      const hash = window.location.hash;
      if (hash && hash.includes('type=recovery')) {
        const accessToken = hash
          .substring(1)
          .split('&')
          .find(param => param.startsWith('access_token='))
          ?.split('=')[1];

        if (accessToken) {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: '',
          });

          if (error) {
            console.error('Error setting session:', error);
          }
        }
      }
    };

    handlePasswordReset();
  }, []);

  return (
    <div className="min-h-screen bg-[#1a1b3b] flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/10 border-gray-700">
        <CardHeader>
          <CardTitle className="text-center text-white">Update Password</CardTitle>
        </CardHeader>
        <CardContent>
          <UpdatePasswordForm />
        </CardContent>
      </Card>
    </div>
  );
};

const AppContent = () => {
  useSupabaseSubscription();

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/auth/update-password" element={<UpdatePasswordPage />} />
      
      {/* Protected Routes */}
      <Route path="/dashboard/*" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      }>
        <Route path="settings" element={<Settings />} />
      </Route>
      
      <Route path="/notes" element={
        <ProtectedRoute>
          <Notes />
        </ProtectedRoute>
      } />
      <Route path="/analytics" element={
        <ProtectedRoute>
          <Analytics />
        </ProtectedRoute>
      } />
      <Route path="/self-care" element={
        <ProtectedRoute>
          <SelfCare />
        </ProtectedRoute>
      } />
      <Route path="/self-care/physical-wellness" element={
        <ProtectedRoute>
          <PhysicalWellness />
        </ProtectedRoute>
      } />
      <Route path="/self-care/mental-wellbeing" element={
        <ProtectedRoute>
          <MentalWellbeing />
        </ProtectedRoute>
      } />
      <Route path="/self-care/personal-growth" element={
        <ProtectedRoute>
          <PersonalGrowth />
        </ProtectedRoute>
      } />
      <Route path="/self-care/social-connections" element={
        <ProtectedRoute>
          <SocialConnections />
        </ProtectedRoute>
      } />
      <Route path="/self-care/daily-rituals" element={
        <ProtectedRoute>
          <DailyRituals />
        </ProtectedRoute>
      } />
      <Route path="/self-care/emotional-care" element={
        <ProtectedRoute>
          <EmotionalCare />
        </ProtectedRoute>
      } />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <ThemeProvider defaultTheme="system" enableSystem>
        <TooltipProvider>
          <NotificationsProvider>
            <CalendarViewProvider>
              <AppContent />
              <Toaster />
              <Sonner />
              <UpdatePrompt />
            </CalendarViewProvider>
          </NotificationsProvider>
        </TooltipProvider>
      </ThemeProvider>
    </AuthProvider>
  </BrowserRouter>
);

export default App;
