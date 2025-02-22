import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "next-themes";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { UpdatePrompt } from "@/components/pwa/UpdatePrompt";
import { NotificationsProvider } from "@/components/notifications/NotificationsManager";
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
    // Handle the password reset token if present in URL
    const handlePasswordReset = async () => {
      const hash = window.location.hash;
      if (hash && hash.includes('type=recovery')) {
        // Parse the access_token from the URL fragment
        const accessToken = hash
          .substring(1)
          .split('&')
          .find(param => param.startsWith('access_token='))
          ?.split('=')[1];

        if (accessToken) {
          // Set the session with the recovery token
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider defaultTheme="system" enableSystem>
          <TooltipProvider>
            <NotificationsProvider>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/auth/update-password" element={<UpdatePasswordPage />} />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/weekly"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/settings"
                  element={
                    <ProtectedRoute>
                      <Settings />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/notes"
                  element={
                    <ProtectedRoute>
                      <Notes />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/analytics"
                  element={
                    <ProtectedRoute>
                      <Analytics />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/self-care"
                  element={
                    <ProtectedRoute>
                      <SelfCare />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/self-care/physical-wellness"
                  element={
                    <ProtectedRoute>
                      <PhysicalWellness />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/self-care/mental-wellbeing"
                  element={
                    <ProtectedRoute>
                      <MentalWellbeing />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/self-care/personal-growth"
                  element={
                    <ProtectedRoute>
                      <PersonalGrowth />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/self-care/social-connections"
                  element={
                    <ProtectedRoute>
                      <SocialConnections />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/self-care/daily-rituals"
                  element={
                    <ProtectedRoute>
                      <DailyRituals />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/self-care/emotional-care"
                  element={
                    <ProtectedRoute>
                      <EmotionalCare />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
              <Toaster />
              <Sonner />
              <UpdatePrompt />
            </NotificationsProvider>
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
