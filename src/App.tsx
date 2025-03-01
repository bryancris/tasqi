
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
import { useAuth } from './contexts/AuthContext';
import { Spinner } from './components/ui/spinner';
import { useEffect, useState, memo } from 'react';

const ProtectedRoute = memo(({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();
  const location = useLocation();
  const [showFallback, setShowFallback] = useState(false);
  
  // Show fallback UI after a reasonable delay if still loading
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (loading) {
        setShowFallback(true);
      }
    }, 3000);
    
    return () => clearTimeout(timeoutId);
  }, [loading]);
  
  // During initial load, don't redirect yet
  if (loading && !showFallback) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#1a1b3b]">
        <Spinner className="h-8 w-8 text-primary" />
        <p className="mt-4 text-sm text-gray-300">Loading your account...</p>
      </div>
    );
  }
  
  // If still loading after timeout, check local storage as fallback
  if (loading && showFallback) {
    try {
      const hasLocalSession = localStorage.getItem('sb-session') !== null;
      if (hasLocalSession) {
        console.log("Using local session as auth fallback");
        return <>{children}</>;
      }
    } catch (e) {
      console.error("Error checking local storage:", e);
    }
    
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }
  
  // If not authenticated, redirect to auth page
  if (!session) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  // If authenticated, render children
  return <>{children}</>;
});

const AuthRoute = memo(({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();
  
  // For auth routes, simpler loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#1a1b3b]">
        <Spinner className="h-8 w-8 text-primary" />
        <p className="mt-4 text-sm text-gray-300">Checking authentication...</p>
      </div>
    );
  }
  
  // If already authenticated, redirect to dashboard
  if (session) {
    return <Navigate to="/dashboard" replace />;
  }

  // If not authenticated, render auth page
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
                      
                      <Route index element={<Dashboard />} />
                      <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                  </MemoizedDashboardLayout>
                </ProtectedRoute>
              } />
              
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        </DragDropContext>
      </CalendarViewProvider>
    </BrowserRouter>
  );
}

export default App;
