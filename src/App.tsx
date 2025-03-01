import { BrowserRouter } from 'react-router-dom';
import { Routes, Route, Navigate } from 'react-router-dom';
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
import { useEffect, useState } from 'react';

// Protected route component with timeout
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();
  const [timedOut, setTimedOut] = useState(false);
  
  // Set a safety timeout to prevent infinite loading
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.warn("Protected route loading timed out after 10 seconds");
        setTimedOut(true);
      }
    }, 10000); // 10 second timeout
    
    return () => clearTimeout(timeoutId);
  }, [loading]);
  
  if (loading && !timedOut) {
    // Show better loading state with spinner
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-white">
        <Spinner className="h-8 w-8 text-primary" />
        <p className="mt-4 text-sm text-gray-500">Loading...</p>
      </div>
    );
  }
  
  // If we timed out but we're still technically loading, we'll check local storage as a fallback
  if (timedOut && loading) {
    // Try to determine auth state from local storage as fallback
    try {
      const hasLocalToken = localStorage.getItem('sb-mcwlzrikidzgxexnccju-auth-token') !== null;
      if (hasLocalToken) {
        console.log("Using local storage token as auth fallback");
        return <>{children}</>;
      }
    } catch (e) {
      console.error("Error checking local storage:", e);
    }
    
    // Otherwise, redirect to auth page
    return <Navigate to="/auth" replace />;
  }
  
  if (!session) {
    // Redirect to auth page if not authenticated
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

// Auth route component (redirects to dashboard if already logged in)
const AuthRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();
  const [timedOut, setTimedOut] = useState(false);
  
  // Set a safety timeout to prevent infinite loading
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.warn("Auth route loading timed out after 10 seconds");
        setTimedOut(true);
      }
    }, 10000); // 10 second timeout
    
    return () => clearTimeout(timeoutId);
  }, [loading]);
  
  if (loading && !timedOut) {
    // Show better loading state with spinner
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-white">
        <Spinner className="h-8 w-8 text-primary" />
        <p className="mt-4 text-sm text-gray-500">Loading...</p>
      </div>
    );
  }
  
  // If we timed out but we're still loading, let the user proceed to auth
  if (timedOut && loading) {
    return <>{children}</>;
  }
  
  if (session) {
    // Redirect to dashboard if already authenticated
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

function App() {
  const onDragEnd = (result: any) => {
    // Handle drag end logic here
    console.log('Drag ended:', result);
  };

  return (
    <BrowserRouter>
      <CalendarViewProvider>
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="app">
            <Routes>
              <Route path="/" element={<Index />} />
              
              {/* Auth route - redirects to dashboard if already logged in */}
              <Route path="/auth" element={
                <AuthRoute>
                  <Auth />
                </AuthRoute>
              } />
              
              {/* Protected routes - require authentication */}
              <Route path="/notes" element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Notes />
                  </DashboardLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/chat" element={
                <ProtectedRoute>
                  <Chat />
                </ProtectedRoute>
              } />
              
              {/* All dashboard routes are protected */}
              <Route path="/dashboard/*" element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Routes>
                      <Route path="notes" element={<Notes />} />
                      <Route path="settings" element={<Settings />} />
                      <Route path="analytics" element={<Analytics />} />
                      <Route path="self-care" element={<SelfCare />} />
                      <Route path="chat" element={<Chat />} />
                      
                      {/* Dashboard should match exact path */}
                      <Route index element={<Dashboard />} />
                      <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                  </DashboardLayout>
                </ProtectedRoute>
              } />
              
              {/* Fallback route - redirect to dashboard */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        </DragDropContext>
      </CalendarViewProvider>
    </BrowserRouter>
  );
}

export default App;
