
import { createContext, useContext, ReactNode, useCallback, useState, useEffect } from 'react';

export type CalendarView = 'tasks' | 'calendar' | 'yearly' | 'weekly';

interface CalendarViewContextType {
  view: CalendarView;
  changeView: (view: CalendarView) => void;
}

const CalendarViewContext = createContext<CalendarViewContextType | undefined>(undefined);

const STORAGE_KEY = 'calendar-view';

export function CalendarViewProvider({ children }: { children: ReactNode }) {
  const [currentView, setCurrentView] = useState<CalendarView>(() => {
    const savedView = localStorage.getItem(STORAGE_KEY);
    return (savedView as CalendarView) || 'tasks';
  });

  const changeView = useCallback((newView: CalendarView) => {
    console.log('Changing view to:', newView);
    setCurrentView(newView);
    localStorage.setItem(STORAGE_KEY, newView);
  }, []);

  const value = {
    view: currentView,
    changeView
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
