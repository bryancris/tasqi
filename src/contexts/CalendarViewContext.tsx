
import { createContext, useContext, ReactNode, useCallback, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export type CalendarView = 'tasks' | 'calendar' | 'yearly' | 'weekly';

interface CalendarViewContextType {
  view: CalendarView;
  changeView: (view: CalendarView) => void;
}

const CalendarViewContext = createContext<CalendarViewContextType | undefined>(undefined);

export function CalendarViewProvider({ children }: { children: ReactNode }) {
  const [currentView, setCurrentView] = useState<CalendarView>('tasks');
  const navigate = useNavigate();
  const location = useLocation();

  // Sync route with view state
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/dashboard/weekly')) {
      setCurrentView('weekly');
    } else if (path.includes('/dashboard/calendar')) {
      setCurrentView('calendar');
    } else if (path.includes('/dashboard/yearly')) {
      setCurrentView('yearly');
    } else if (path.includes('/dashboard')) {
      setCurrentView('tasks');
    }
  }, [location.pathname]);

  const changeView = useCallback((newView: CalendarView) => {
    console.log('Changing view to:', newView);
    setCurrentView(newView);
    
    // Navigate to the appropriate route
    switch (newView) {
      case 'weekly':
        navigate('/dashboard/weekly');
        break;
      case 'calendar':
        navigate('/dashboard/calendar');
        break;
      case 'yearly':
        navigate('/dashboard/yearly');
        break;
      case 'tasks':
        navigate('/dashboard');
        break;
    }
  }, [navigate]);

  const value = {
    view: currentView,
    changeView
  };

  return (
    <CalendarViewContext.Provider value={value}>
      {children}
    </CalendarViewContext.Provider>
  );
}

export function useCalendarView() {
  const context = useContext(CalendarViewContext);
  if (!context) {
    throw new Error('useCalendarView must be used within a CalendarViewProvider');
  }
  return context;
}
