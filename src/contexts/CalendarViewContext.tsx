
import { createContext, useContext, ReactNode, useState, useCallback, useMemo, useEffect } from 'react';
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
  
  const getCurrentView = useCallback((): CalendarView => {
    const path = location.pathname;
    if (path === '/dashboard' || path === '/dashboard/tasks') return 'tasks';
    if (path.includes('/weekly')) return 'weekly';
    if (path.includes('/monthly')) return 'monthly';
    if (path.includes('/yearly')) return 'yearly';
    return 'tasks';
  }, [location.pathname]);

  const [view, setInternalView] = useState<CalendarView>('tasks');

  // Update view when location changes
  useEffect(() => {
    const newView = getCurrentView();
    if (view !== newView) {
      setInternalView(newView);
    }
  }, [location.pathname, getCurrentView, view]);

  const setView = useCallback((newView: CalendarView) => {
    setInternalView(newView);
    const targetPath = `/dashboard/${newView === 'tasks' ? 'tasks' : newView}`;
    
    if (location.pathname !== targetPath) {
      navigate(targetPath, { replace: true });
    }
  }, [navigate, location.pathname]);

  const contextValue = useMemo(() => ({
    view,
    setView
  }), [view, setView]);

  return (
    <CalendarViewContext.Provider value={contextValue}>
      {children}
    </CalendarViewContext.Provider>
  );
}

export function useCalendarView() {
  return useContext(CalendarViewContext);
}
