
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
  
  // Simple direct path to view mapping
  const getViewFromPath = useCallback((): CalendarView => {
    if (location.pathname.includes('/weekly')) return 'weekly';
    if (location.pathname.includes('/monthly')) return 'monthly';
    if (location.pathname.includes('/yearly')) return 'yearly';
    return 'tasks';
  }, [location.pathname]);

  const [view, setInternalView] = useState<CalendarView>(getViewFromPath);

  const setView = useCallback((newView: CalendarView) => {
    const targetPath = `/dashboard/${newView}`;
    setInternalView(newView);
    if (location.pathname !== targetPath) {
      navigate(targetPath, { replace: true });
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
  return useContext(CalendarViewContext);
}
