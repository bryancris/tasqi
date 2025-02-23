
import { createContext, useContext, ReactNode, useCallback, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export type CalendarView = 'tasks' | 'calendar' | 'yearly' | 'weekly';

interface CalendarViewContextType {
  view: CalendarView;
  changeView: (view: CalendarView) => void;
}

const CalendarViewContext = createContext<CalendarViewContextType | undefined>(undefined);

export function CalendarViewProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentView, setCurrentView] = useState<CalendarView>(() => {
    const path = location.pathname;
    if (path.includes('/weekly')) return 'weekly';
    if (path.includes('/calendar')) return 'calendar';
    if (path.includes('/yearly')) return 'yearly';
    return 'tasks';
  });

  useEffect(() => {
    console.log('Location changed:', location.pathname);
    const path = location.pathname;
    if (path.includes('/weekly')) {
      setCurrentView('weekly');
    } else if (path.includes('/calendar')) {
      setCurrentView('calendar');
    } else if (path.includes('/yearly')) {
      setCurrentView('yearly');
    } else if (path === '/dashboard' || path === '/dashboard/') {
      setCurrentView('tasks');
    }
  }, [location.pathname]);

  const changeView = useCallback((newView: CalendarView) => {
    console.log('Changing view to:', newView);
    setCurrentView(newView);
    
    let path = '/dashboard';
    switch (newView) {
      case 'tasks':
        path = '/dashboard';
        break;
      case 'weekly':
        path = '/dashboard/weekly';
        break;
      case 'calendar':
        path = '/dashboard/calendar';
        break;
      case 'yearly':
        path = '/dashboard/yearly';
        break;
    }
    
    // Use navigate without replace to maintain history
    navigate(path, { 
      replace: false,
      state: { view: newView }
    });
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
