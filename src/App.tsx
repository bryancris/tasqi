
import React from "react";
import { Routes, Route } from "react-router-dom";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import Dashboard from "@/pages/Dashboard";
import { ThemeProvider } from "next-themes";
import { CalendarViewProvider } from "@/contexts/CalendarViewContext";
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import Notes from "@/pages/Notes";
import Settings from "@/pages/Settings";
import SelfCare from "@/pages/SelfCare";
import Analytics from "@/pages/Analytics";
import NotFound from "@/pages/NotFound";
import DailyRituals from "@/pages/DailyRituals";
import EmotionalCare from "@/pages/EmotionalCare";
import MentalWellbeing from "@/pages/MentalWellbeing";
import PersonalGrowth from "@/pages/PersonalGrowth";
import PhysicalWellness from "@/pages/PhysicalWellness";
import SocialConnections from "@/pages/SocialConnections";

const App = () => {
  return (
    <div className="min-h-screen bg-background">
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <CalendarViewProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="dashboard" element={<DashboardLayout><Dashboard /></DashboardLayout>} />
            <Route path="dashboard/*" element={
              <DashboardLayout>
                <Routes>
                  <Route path="tasks" element={<Dashboard />} />
                  <Route path="weekly" element={<Dashboard />} />
                  <Route path="monthly" element={<Dashboard />} />
                  <Route path="yearly" element={<Dashboard />} />
                </Routes>
              </DashboardLayout>
            } />
            <Route path="/notes" element={<DashboardLayout><Notes /></DashboardLayout>} />
            <Route path="/settings" element={<DashboardLayout><Settings /></DashboardLayout>} />
            <Route path="/self-care" element={<DashboardLayout><SelfCare /></DashboardLayout>} />
            <Route path="/analytics" element={<DashboardLayout><Analytics /></DashboardLayout>} />
            <Route path="/daily-rituals" element={<DashboardLayout><DailyRituals /></DashboardLayout>} />
            <Route path="/emotional-care" element={<DashboardLayout><EmotionalCare /></DashboardLayout>} />
            <Route path="/mental-wellbeing" element={<DashboardLayout><MentalWellbeing /></DashboardLayout>} />
            <Route path="/personal-growth" element={<DashboardLayout><PersonalGrowth /></DashboardLayout>} />
            <Route path="/physical-wellness" element={<DashboardLayout><PhysicalWellness /></DashboardLayout>} />
            <Route path="/social-connections" element={<DashboardLayout><SocialConnections /></DashboardLayout>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </CalendarViewProvider>
      </ThemeProvider>
    </div>
  );
};

export default App;
