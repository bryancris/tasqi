
import { createContext, useContext, ReactNode, useState, useCallback, useMemo, useEffect } from 'react';
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
  
  const getCurrentView = useCallback((): CalendarView => {
    const path = location.pathname;
    if (path === '/' || path === '/dashboard' || path === '/dashboard/tasks') return 'tasks';
    if (path.includes('/weekly')) return 'weekly';
    if (path.includes('/monthly')) return 'monthly';
    if (path.includes('/yearly')) return 'yearly';
    return 'tasks';  // Default to tasks view
  }, [location.pathname]);

  const [view, setInternalView] = useState<CalendarView>(getCurrentView());

  // Update view when location changes
  useEffect(() => {
    setInternalView(getCurrentView());
  }, [location.pathname, getCurrentView]);

  const setView = useCallback((newView: CalendarView) => {
    setInternalView(newView);
    if (location.pathname === '/') {
      navigate('/dashboard/tasks', { replace: true });
    } else {
      const path = `/dashboard/${newView === 'tasks' ? '' : newView}`;
      navigate(path, { replace: true });
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
  const context = useContext(CalendarViewContext);
  if (!context) {
    throw new Error('useCalendarView must be used within a CalendarViewProvider');
  }
  return context;
}
