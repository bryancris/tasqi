
import { createContext, useContext, ReactNode, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export type CalendarView = 'tasks' | 'monthly' | 'yearly' | 'weekly';

interface CalendarViewContextType {
  view: CalendarView;
  setView: (view: CalendarView) => void;
}

const CalendarViewContext = createContext<CalendarViewContextType | undefined>(undefined);

export function CalendarViewProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();

  const getCurrentView = (): CalendarView => {
    const path = location.pathname;
    if (path.includes('/weekly')) return 'weekly';
    if (path.includes('/monthly')) return 'monthly';
    if (path.includes('/yearly')) return 'yearly';
    return 'tasks';
  };

  const [view, setInternalView] = useState<CalendarView>(getCurrentView());

  const setView = useCallback((newView: CalendarView) => {
    setInternalView(newView);
    const path = newView === 'tasks' ? '/dashboard/tasks' : `/dashboard/${newView}`;
    navigate(path, { replace: true, state: { preserveScroll: true } });
  }, [navigate]);

  return (
    <CalendarViewContext.Provider value={{ view, setView }}>
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
