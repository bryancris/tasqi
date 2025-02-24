
import React, { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { UpdatePrompt } from "@/components/pwa/UpdatePrompt";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { CalendarViewProvider } from "@/contexts/CalendarViewContext";

// Lazy load pages
const Index = React.lazy(() => import("./pages/Index"));
const Dashboard = React.lazy(() => import("./pages/Dashboard"));
const Auth = React.lazy(() => import("./pages/Auth"));
const NotFound = React.lazy(() => import("./pages/NotFound"));
const Notes = React.lazy(() => import("./pages/Notes"));
const Analytics = React.lazy(() => import("./pages/Analytics"));
const SelfCare = React.lazy(() => import("./pages/SelfCare"));
const PhysicalWellness = React.lazy(() => import("./pages/PhysicalWellness"));
const MentalWellbeing = React.lazy(() => import("./pages/MentalWellbeing"));
const PersonalGrowth = React.lazy(() => import("./pages/PersonalGrowth"));
const SocialConnections = React.lazy(() => import("./pages/SocialConnections"));
const DailyRituals = React.lazy(() => import("./pages/DailyRituals"));
const EmotionalCare = React.lazy(() => import("./pages/EmotionalCare"));
const Settings = React.lazy(() => import("./pages/Settings"));

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

const AppRoutes = React.memo(() => (
  <Routes>
    <Route path="/" element={<Index />} />
    <Route path="/auth" element={<Auth />} />
    <Route path="/auth/update-password" element={<UpdatePasswordPage />} />
    
    <Route element={<ProtectedRoute />}>
      <Route element={
        <CalendarViewProvider>
          <DashboardLayout />
        </CalendarViewProvider>
      }>
        <Route path="dashboard">
          <Route index element={<Navigate to="tasks" replace />} />
          <Route path="tasks" element={<Dashboard />} />
          <Route path="weekly" element={<Dashboard />} />
          <Route path="monthly" element={<Dashboard />} />
          <Route path="yearly" element={<Dashboard />} />
        </Route>
        <Route path="notes" element={<Notes />} />
        <Route path="settings" element={<Settings />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="self-care" element={<SelfCare />} />
        <Route path="physical-wellness" element={<PhysicalWellness />} />
        <Route path="mental-wellbeing" element={<MentalWellbeing />} />
        <Route path="personal-growth" element={<PersonalGrowth />} />
        <Route path="social-connections" element={<SocialConnections />} />
        <Route path="daily-rituals" element={<DailyRituals />} />
        <Route path="emotional-care" element={<EmotionalCare />} />
      </Route>
    </Route>
    <Route path="*" element={<NotFound />} />
  </Routes>
));

AppRoutes.displayName = 'AppRoutes';

const App = () => {
  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        </div>
      }>
        <AppRoutes />
        <Toaster />
        <Sonner />
        <UpdatePrompt />
      </Suspense>
    </div>
  );
};

export default App;
