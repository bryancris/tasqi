
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

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();
  
  if (loading) {
    // Show loading state if auth is being checked
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
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
  
  if (loading) {
    // Show loading state if auth is being checked
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
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
                      
                      {/* Calendar routes - must be last to handle all other dashboard paths */}
                      <Route path="*" element={<Dashboard />} />
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
