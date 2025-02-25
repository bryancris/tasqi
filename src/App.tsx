
import React from "react";
import { Routes, Route } from "react-router-dom";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import Dashboard from "@/pages/Dashboard";
import { ThemeProvider } from "next-themes";
import { CalendarViewProvider } from "@/contexts/CalendarViewContext";

const App = () => {
  return (
    <div className="min-h-screen bg-background">
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <CalendarViewProvider>
          <Routes>
            <Route path="/" element={<div>Home Page</div>} />
            <Route path="/dashboard" element={<DashboardLayout><Dashboard /></DashboardLayout>} />
          </Routes>
        </CalendarViewProvider>
      </ThemeProvider>
    </div>
  );
};

export default App;
