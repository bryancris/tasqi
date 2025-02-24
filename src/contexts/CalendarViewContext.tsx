
import { createContext, useContext, ReactNode, useCallback, useState } from 'react';

export type CalendarView = 'tasks' | 'calendar' | 'yearly' | 'weekly';

interface CalendarViewContextType {
  view: CalendarView;
  changeView: (view: CalendarView) => void;
}

const CalendarViewContext = createContext<CalendarViewContextType | undefined>(undefined);

export function CalendarViewProvider({ children }: { children: ReactNode }) {
  const [currentView, setCurrentView] = useState<CalendarView>('tasks');

  const changeView = useCallback((newView: CalendarView) => {
    console.log('Changing view to:', newView);
    setCurrentView(newView);
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
