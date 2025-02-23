
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

    // Explicitly handle view state based on URL parameters
    const viewParam = searchParams.get('view');
    
    // Reset to tasks view when no view parameter is present
    if (!viewParam) {
      setView('tasks');
      return;
    }

    // Set view only for valid view parameters
    if (['tasks', 'calendar', 'yearly', 'weekly'].includes(viewParam)) {
      setView(viewParam as CalendarView);
    }
  }, [searchParams, location.pathname]);

  const changeView = (newView: CalendarView) => {
    if (newView === 'tasks') {
      // For tasks view, clear all parameters
      navigate('/dashboard');
    } else {
      // For other views, set the view parameter
      const params = new URLSearchParams(searchParams);
      params.set('view', newView);
      navigate(`/dashboard?${params.toString()}`);
    }
    setView(newView);
  };

  return { view, changeView };
}
