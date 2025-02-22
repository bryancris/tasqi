
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';

export type CalendarView = 'tasks' | 'calendar' | 'yearly' | 'weekly';

export function useCalendarView(initialView: CalendarView = 'tasks') {
  const [searchParams] = useSearchParams();
  const [view, setView] = useState<CalendarView>(initialView);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Handle path-based routes
    if (location.pathname === '/dashboard/weekly') {
      setView('weekly');
      return;
    }

    // Handle query parameter based routes
    const viewParam = searchParams.get('view');
    if (viewParam && ['tasks', 'calendar', 'yearly', 'weekly'].includes(viewParam)) {
      setView(viewParam as CalendarView);
    }
  }, [searchParams, location.pathname]);

  const changeView = (newView: CalendarView) => {
    // Standardize all navigation to use query parameters
    const params = new URLSearchParams(searchParams);
    params.set('view', newView);
    navigate(`/dashboard?${params.toString()}`);
  };

  return { view, changeView };
}
