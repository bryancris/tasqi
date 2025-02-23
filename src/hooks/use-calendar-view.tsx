
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

    // Handle URL parameters without triggering navigation
    const viewParam = searchParams.get('view') as CalendarView;
    if (viewParam && ['tasks', 'calendar', 'yearly', 'weekly'].includes(viewParam)) {
      setView(viewParam);
    } else if (!viewParam) {
      setView('tasks');
    }
  }, [location.pathname, searchParams]);

  const changeView = (newView: CalendarView) => {
    setView(newView);
    // Update URL without causing a refresh
    const params = new URLSearchParams(searchParams);
    if (newView === 'tasks') {
      params.delete('view');
      navigate('/dashboard', { replace: true });
    } else {
      params.set('view', newView);
      navigate(`/dashboard?${params.toString()}`, { replace: true });
    }
  };

  return { view, changeView };
}
