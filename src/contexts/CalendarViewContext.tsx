
import { createContext, useContext, useState, ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export type CalendarView = 'tasks' | 'calendar' | 'yearly' | 'weekly';

interface CalendarViewContextType {
  view: CalendarView;
  changeView: (view: CalendarView) => void;
}

const CalendarViewContext = createContext<CalendarViewContextType | undefined>(undefined);

export function CalendarViewProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<CalendarView>('tasks');
  const navigate = useNavigate();
  const location = useLocation();

  const changeView = (newView: CalendarView) => {
    setView(newView);
    
    // Only update URL for weekly view which has a dedicated route
    if (newView === 'weekly' && location.pathname !== '/dashboard/weekly') {
      navigate('/dashboard/weekly', { replace: true });
    } else if (newView !== 'weekly' && location.pathname === '/dashboard/weekly') {
      navigate('/dashboard', { replace: true });
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
