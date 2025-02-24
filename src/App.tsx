
import React from "react";
import { Routes, Route } from "react-router-dom";

const Dashboard = () => {
  return <div className="p-4">Dashboard Page</div>;
};

const App = () => {
  return (
    <div className="min-h-screen bg-background">
      <Routes>
        <Route path="/" element={<div>Home Page</div>} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </div>
  );
};

export default App;
