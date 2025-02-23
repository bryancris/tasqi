
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export type CalendarView = 'tasks' | 'calendar' | 'yearly' | 'weekly';

export function useCalendarView(initialView: CalendarView = 'tasks') {
  const [view, setView] = useState<CalendarView>(initialView);
  const navigate = useNavigate();

  const changeView = (newView: CalendarView) => {
    setView(newView);
    // Use proper route-based navigation instead of URL parameters
    switch (newView) {
      case 'tasks':
        navigate('/dashboard', { replace: true });
        break;
      case 'weekly':
        navigate('/dashboard/weekly', { replace: true });
        break;
      case 'calendar':
        navigate('/dashboard/calendar', { replace: true });
        break;
      case 'yearly':
        navigate('/dashboard/yearly', { replace: true });
        break;
    }
  };

  // Handle initial route matching
  useEffect(() => {
    const path = window.location.pathname;
    if (path.includes('/weekly')) {
      setView('weekly');
    } else if (path.includes('/calendar')) {
      setView('calendar');
    } else if (path.includes('/yearly')) {
      setView('yearly');
    } else {
      setView('tasks');
    }
  }, []);

  return { view, changeView };
}
