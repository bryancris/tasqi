
import { createContext, useContext, ReactNode, useState, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export type CalendarView = 'tasks' | 'monthly' | 'yearly' | 'weekly';

interface CalendarViewContextType {
  view: CalendarView;
  setView: (view: CalendarView) => void;
}

const CalendarViewContext = createContext<CalendarViewContextType>({
  view: 'tasks',
  setView: () => {}
});

export function CalendarViewProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  
  const getViewFromPath = useCallback((): CalendarView => {
    const path = location.pathname;
    if (path === '/dashboard' || path === '/dashboard/tasks') return 'tasks';
    if (path.includes('/weekly')) return 'weekly';
    if (path.includes('/monthly')) return 'monthly';
    if (path.includes('/yearly')) return 'yearly';
    return 'tasks';
  }, [location.pathname]);

  const [view] = useState<CalendarView>(getViewFromPath);

  const setView = useCallback((newView: CalendarView) => {
    const targetPath = `/dashboard/${newView === 'tasks' ? 'tasks' : newView}`;
    if (location.pathname !== targetPath) {
      navigate(targetPath);
    }
  }, [navigate, location.pathname]);

  const value = useMemo(() => ({
    view,
    setView
  }), [view, setView]);

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
