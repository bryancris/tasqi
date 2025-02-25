
import React from "react";
import { Routes, Route } from "react-router-dom";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import Dashboard from "@/pages/Dashboard";

const App = () => {
  return (
    <div className="min-h-screen bg-background">
      <Routes>
        <Route path="/" element={<div>Home Page</div>} />
        <Route path="/dashboard/*" element={
          <DashboardLayout>
            <Routes>
              <Route index element={<Dashboard />} />
            </Routes>
          </DashboardLayout>
        } />
      </Routes>
    </div>
  );
};

export default App;
