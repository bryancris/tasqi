
import React, { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { UpdatePrompt } from "@/components/pwa/UpdatePrompt";
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

const UpdatePasswordPage = () => {
  React.useEffect(() => {
    const handlePasswordReset = async () => {
      const hash = window.location.hash;
      if (hash && hash.includes('type=recovery')) {
        const accessToken = hash
          .substring(1)
          .split('&')
          .find(param => param.startsWith('access_token='))
          ?.split('=')[1];

        if (accessToken) {
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: '',
          });
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

// Separate routes component to prevent unnecessary re-renders
const AppRoutes = React.memo(() => (
  <Routes>
    <Route path="/" element={<Index />} />
    <Route path="/auth" element={<Auth />} />
    <Route path="/auth/update-password" element={<UpdatePasswordPage />} />
    <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
      <Route path="/dashboard">
        <Route index element={<Navigate to="/dashboard/tasks" replace />} />
        <Route path="tasks" element={<Dashboard />} />
        <Route path="weekly" element={<Dashboard />} />
        <Route path="monthly" element={<Dashboard />} />
        <Route path="yearly" element={<Dashboard />} />
      </Route>
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
));

AppRoutes.displayName = 'AppRoutes';

// Main app component with stable configuration
const App = () => {
  return (
    <Suspense fallback={null}>
      <AppRoutes />
      <Toaster />
      <Sonner />
      <UpdatePrompt />
    </Suspense>
  );
};

export default App;
