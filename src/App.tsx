import { BrowserRouter } from 'react-router-dom';
import { Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NotificationsProvider } from './components/notifications/NotificationsManager';
import { CalendarViewProvider } from './contexts/CalendarViewContext';
import Dashboard from './pages/Dashboard';
import { DashboardLayout } from './components/layouts/DashboardLayout';
import { DragDropContext } from 'react-beautiful-dnd';

// Create a client
const queryClient = new QueryClient();

function App() {
  const onDragEnd = (result: any) => {
    // Handle drag end logic here
    console.log('Drag ended:', result);
  };

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <NotificationsProvider>
          <CalendarViewProvider>
            <DragDropContext onDragEnd={onDragEnd}>
              <div className="app">
                <Routes>
                  <Route
                    path="/dashboard/*"
                    element={
                      <DashboardLayout>
                        <Dashboard />
                      </DashboardLayout>
                    }
                  />
                  {/* Add other routes as needed */}
                </Routes>
              </div>
            </DragDropContext>
          </CalendarViewProvider>
        </NotificationsProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}

export default App;
