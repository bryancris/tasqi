
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

  // Update view based on route changes
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/weekly')) setCurrentView('weekly');
    else if (path.includes('/calendar')) setCurrentView('calendar');
    else if (path.includes('/yearly')) setCurrentView('yearly');
    else if (path.includes('/dashboard')) setCurrentView('tasks');
  }, [location.pathname]);

  const changeView = useCallback((newView: CalendarView) => {
    setCurrentView(newView);
    switch (newView) {
      case 'tasks':
        navigate('/dashboard');
        break;
      case 'weekly':
        navigate('/dashboard/weekly');
        break;
      case 'calendar':
        navigate('/dashboard/calendar');
        break;
      case 'yearly':
        navigate('/dashboard/yearly');
        break;
    }
  }, [navigate]);

  return (
    <CalendarViewContext.Provider value={{ view: currentView, changeView }}>
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
