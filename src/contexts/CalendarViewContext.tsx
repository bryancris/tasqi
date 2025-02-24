
import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
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
  const [view, setCurrentView] = useState<CalendarView>('tasks');

  // Update view based on current route
  useEffect(() => {
    const path = location.pathname;
    let newView: CalendarView = 'tasks';

    if (path.includes('/weekly')) newView = 'weekly';
    else if (path.includes('/monthly')) newView = 'monthly';
    else if (path.includes('/yearly')) newView = 'yearly';
    else if (path.includes('/tasks') || path === '/dashboard') newView = 'tasks';

    setCurrentView(newView);
  }, [location.pathname]);

  const setView = (newView: CalendarView) => {
    const targetPath = `/dashboard/${newView}`;
    if (location.pathname !== targetPath) {
      navigate(targetPath);
    }
  };

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
