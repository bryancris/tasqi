
import { createContext, useContext, ReactNode, useCallback, useEffect } from 'react';
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
  const getCurrentView = useCallback((): CalendarView => {
    const path = location.pathname;
    if (path.includes('/weekly')) return 'weekly';
    if (path.includes('/calendar')) return 'calendar';
    if (path.includes('/yearly')) return 'yearly';
    return 'tasks';
  }, [location.pathname]);

  // Update view based on route changes
  useEffect(() => {
    getCurrentView();
  }, [getCurrentView]);

  const changeView = useCallback((newView: CalendarView) => {
    const currentSearch = new URLSearchParams(location.search).toString();
    const searchSuffix = currentSearch ? `?${currentSearch}` : '';

    switch (newView) {
      case 'tasks':
        navigate(`/dashboard${searchSuffix}`, { replace: true });
        break;
      case 'weekly':
        navigate(`/dashboard/weekly${searchSuffix}`, { replace: true });
        break;
      case 'calendar':
        navigate(`/dashboard/calendar${searchSuffix}`, { replace: true });
        break;
      case 'yearly':
        navigate(`/dashboard/yearly${searchSuffix}`, { replace: true });
        break;
    }
  }, [navigate, location.search]);

  return (
    <CalendarViewContext.Provider value={{ view: getCurrentView(), changeView }}>
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
