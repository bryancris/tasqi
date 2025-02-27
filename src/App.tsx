
import { BrowserRouter } from 'react-router-dom';
import { Routes, Route } from 'react-router-dom';
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
              <Route path="/auth" element={<Auth />} />
              
              {/* Add a direct route for /notes */}
              <Route path="/notes" element={
                <DashboardLayout>
                  <Notes />
                </DashboardLayout>
              } />
              
              {/* Add a direct route for /chat */}
              <Route path="/chat" element={<Chat />} />
              
              <Route path="/dashboard/*" element={<DashboardLayout>
                <Routes>
                  {/* Non-calendar routes */}
                  <Route path="notes" element={<Notes />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="analytics" element={<Analytics />} />
                  <Route path="self-care" element={<SelfCare />} />
                  <Route path="chat" element={<Chat />} />
                  
                  {/* Calendar routes - must be last to handle all other dashboard paths */}
                  <Route path="*" element={<Dashboard />} />
                </Routes>
              </DashboardLayout>} />
            </Routes>
          </div>
        </DragDropContext>
      </CalendarViewProvider>
    </BrowserRouter>
  );
}

export default App;
