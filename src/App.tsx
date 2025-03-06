
import { BrowserRouter } from 'react-router-dom';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
import { useAuth } from './contexts/auth';
import { Spinner } from './components/ui/spinner';
import { memo } from 'react';
import { DevAuthTools } from './components/dev/DevAuthTools';

// Check if we're in dev mode and if auth bypass is enabled
const isDevBypassEnabled = () => {
  try {
    return process.env.NODE_ENV === 'development' && 
           sessionStorage.getItem('dev_bypass_auth') === 'true';
  } catch (e) {
    return false;
  }
};

const ProtectedRoute = memo(({ children }: { children: React.ReactNode }) => {
  const { session, loading, initialized } = useAuth();
  const location = useLocation();
  
  // Dev mode bypass
  if (isDevBypassEnabled()) {
    return <>{children}</>;
  }
  
  // Show loading state if not yet fully initialized
  if (loading && !initialized) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#1a1b3b]">
        <Spinner className="h-8 w-8 text-primary" />
        <p className="mt-4 text-sm text-gray-300">Loading your account...</p>
        <DevAuthTools />
      </div>
    );
  }
  
  if (!session) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  return <>{children}</>;
});

const AuthRoute = memo(({ children }: { children: React.ReactNode }) => {
  const { session, loading, initialized } = useAuth();
  
  // Dev mode bypass - if enabled, auth pages redirect to dashboard
  if (isDevBypassEnabled()) {
    return <Navigate to="/dashboard" replace />;
  }
  
  // Show loading state if not yet fully initialized
  if (loading && !initialized) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#1a1b3b]">
        <Spinner className="h-8 w-8 text-primary" />
        <p className="mt-4 text-sm text-gray-300">Checking authentication...</p>
        <DevAuthTools />
      </div>
    );
  }
  
  // Redirect if session exists and initialization is complete
  if (session && initialized) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
});

const MemoizedDashboardLayout = memo(DashboardLayout);

function App() {
  const onDragEnd = (result: any) => {
    console.log('Drag ended:', result);
  };

  return (
    <BrowserRouter>
      <CalendarViewProvider>
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="app">
            <Routes>
              <Route path="/" element={<Index />} />
              
              <Route path="/auth" element={
                <AuthRoute>
                  <Auth />
                </AuthRoute>
              } />
              
              <Route path="/auth/update-password" element={
                <Auth />
              } />
              
              <Route path="/notes" element={
                <ProtectedRoute>
                  <MemoizedDashboardLayout>
                    <Notes />
                  </MemoizedDashboardLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/chat" element={
                <ProtectedRoute>
                  <Chat />
                </ProtectedRoute>
              } />
              
              <Route path="/dashboard/*" element={
                <ProtectedRoute>
                  <MemoizedDashboardLayout>
                    <Routes>
                      <Route path="notes" element={<Notes />} />
                      <Route path="settings" element={<Settings />} />
                      <Route path="analytics" element={<Analytics />} />
                      <Route path="self-care" element={<SelfCare />} />
                      <Route path="chat" element={<Chat />} />
                      
                      <Route path="tasks" element={<Dashboard />} />
                      <Route path="week" element={<Dashboard />} />
                      <Route path="monthly" element={<Dashboard />} />
                      <Route path="yearly" element={<Dashboard />} />
                      
                      <Route index element={<Dashboard />} />
                      <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                  </MemoizedDashboardLayout>
                </ProtectedRoute>
              } />
              
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <DevAuthTools />
          </div>
        </DragDropContext>
      </CalendarViewProvider>
    </BrowserRouter>
  );
}

export default App;
