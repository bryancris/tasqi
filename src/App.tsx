
import { StrictMode } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "next-themes";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { UpdatePrompt } from "@/components/pwa/UpdatePrompt";
import { NotificationsProvider } from "@/components/notifications/NotificationsManager";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CalendarViewProvider } from "@/contexts/CalendarViewContext";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
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
import { supabase } from "@/integrations/supabase/client";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5000,
      gcTime: 300000,
      refetchOnWindowFocus: false,
      refetchInterval: false,
      retry: false
    },
  },
});

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

const App = () => {
  return (
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="system" enableSystem>
          <BrowserRouter>
            <AuthProvider>
              <TooltipProvider>
                <NotificationsProvider>
                  <CalendarViewProvider>
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/auth" element={<Auth />} />
                      <Route path="/auth/update-password" element={<UpdatePasswordPage />} />
                      <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/dashboard/weekly" element={<Dashboard />} />
                        <Route path="/dashboard/monthly" element={<Dashboard />} />
                        <Route path="/dashboard/yearly" element={<Dashboard />} />
                        <Route path="/notes" element={<Notes />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/analytics" element={<Analytics />} />
                        <Route path="/self-care" element={<SelfCare />} />
                        <Route path="/physical-wellness" element={<PhysicalWellness />} />
                        <Route path="/mental-wellbeing" element={<MentalWellbeing />} />
                        <Route path="/personal-growth" element={<PersonalGrowth />} />
                        <Route path="/social-connections" element={<SocialConnections />} />
                        <Route path="/daily-rituals" element={<DailyRituals />} />
                        <Route path="/emotional-care" element={<EmotionalCare />} />
                      </Route>
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                    <Toaster />
                    <Sonner />
                    <UpdatePrompt />
                  </CalendarViewProvider>
                </NotificationsProvider>
              </TooltipProvider>
            </AuthProvider>
          </BrowserRouter>
        </ThemeProvider>
      </QueryClientProvider>
    </StrictMode>
  );
};

export default App;
