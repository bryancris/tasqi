
import { createContext, useContext, ReactNode } from 'react';
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

  // Determine the current view based on the route
  const getCurrentView = (): CalendarView => {
    const path = location.pathname;
    if (path.includes('/weekly')) return 'weekly';
    if (path.includes('/calendar')) return 'calendar';
    if (path.includes('/yearly')) return 'yearly';
    return 'tasks';
  };

  const view = getCurrentView();

  const changeView = (newView: CalendarView) => {
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
  };

  return (
    <CalendarViewContext.Provider value={{ view, changeView }}>
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
