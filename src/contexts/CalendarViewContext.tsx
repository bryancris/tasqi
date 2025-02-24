
import { createContext, useContext, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

export type CalendarView = 'tasks' | 'calendar' | 'yearly' | 'weekly';

interface CalendarViewContextType {
  view: CalendarView;
}

const CalendarViewContext = createContext<CalendarViewContextType | undefined>(undefined);

export function CalendarViewProvider({ children }: { children: ReactNode }) {
  const location = useLocation();

  const getCurrentView = (): CalendarView => {
    const path = location.pathname;
    if (path.includes('/weekly')) return 'weekly';
    if (path.includes('/monthly')) return 'calendar';
    if (path.includes('/yearly')) return 'yearly';
    return 'tasks';
  };

  const value = {
    view: getCurrentView()
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
