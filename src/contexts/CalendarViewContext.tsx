
import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export type CalendarView = 'tasks' | 'monthly' | 'yearly' | 'weekly';

interface CalendarViewContextType {
  view: CalendarView;
  setView: (view: CalendarView) => void;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
}

const CalendarViewContext = createContext<CalendarViewContextType>({
  view: 'tasks',
  setView: () => {},
  selectedDate: new Date(),
  setSelectedDate: () => {}
});

export function CalendarViewProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setCurrentView] = useState<CalendarView>(() => {
    // Initialize with the correct view based on the current path
    const path = location.pathname;
    if (path.includes('/weekly')) return 'weekly';
    if (path.includes('/monthly')) return 'monthly';
    if (path.includes('/yearly')) return 'yearly';
    return 'tasks';
  });

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
    if (view === newView) return; // Prevent unnecessary navigation
    
    const targetPath = newView === 'tasks' ? '/dashboard/tasks' : `/dashboard/${newView}`;
    if (location.pathname !== targetPath) {
      navigate(targetPath);
    }
  };

  return (
    <CalendarViewContext.Provider value={{ view, setView, selectedDate, setSelectedDate }}>
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
