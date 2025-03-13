
import { BrowserRouter } from 'react-router-dom';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { CalendarViewProvider } from './contexts/CalendarViewContext';
import Dashboard from './pages/Dashboard';
import { DashboardLayout } from './components/layouts/DashboardLayout';
import { DragDropContext } from 'react-beautiful-dnd';
import Index from './pages/Index';
import Auth from './pages/Auth';
import Settings from './pages/Settings';
import Notes from './pages/Notes';
import Analytics from './pages/Analytics';
import SelfCare from './pages/SelfCare';
import Chat from './pages/Chat';
import Pricing from './pages/Pricing';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Toaster } from './components/ui/sonner';
import { memo } from 'react';
import { AuthProvider } from './contexts/auth';

// Memoize the DashboardLayout component to prevent unnecessary re-renders
const MemoizedDashboardLayout = memo(DashboardLayout);

function App() {
  const onDragEnd = (result: any) => {
    console.log('Drag ended:', result);
  };

  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster />
        <CalendarViewProvider>
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="app">
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/auth/update-password" element={<Auth />} />
                <Route path="/pricing" element={<Pricing />} />
                
                {/* All protected routes use the ProtectedRoute component */}
                <Route element={<ProtectedRoute />}>
                  {/* Routes with DashboardLayout */}
                  <Route 
                    element={
                      <MemoizedDashboardLayout>
                        <Outlet />
                      </MemoizedDashboardLayout>
                    }
                  >
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/dashboard/notes" element={<Notes />} />
                    <Route path="/dashboard/settings" element={<Settings />} />
                    <Route path="/dashboard/analytics" element={<Analytics />} />
                    <Route path="/dashboard/self-care" element={<SelfCare />} />
                    <Route path="/dashboard/tasks" element={<Dashboard />} />
                    <Route path="/dashboard/week" element={<Dashboard />} />
                    <Route path="/dashboard/monthly" element={<Dashboard />} />
                    <Route path="/dashboard/yearly" element={<Dashboard />} />
                  </Route>
                  
                  {/* Standalone protected routes */}
                  <Route path="/chat" element={<Chat />} />
                  <Route path="/dashboard/chat" element={<Chat />} />
                  
                  {/* Redirect old /notes path to /dashboard/notes */}
                  <Route path="/notes" element={<Navigate to="/dashboard/notes" replace />} />
                </Route>
                
                {/* Fallback route */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </DragDropContext>
        </CalendarViewProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
