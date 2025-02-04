import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export type CalendarView = 'tasks' | 'calendar' | 'yearly' | 'weekly';

export function useCalendarView(initialView: CalendarView = 'tasks') {
  const [searchParams] = useSearchParams();
  const [view, setView] = useState<CalendarView>(initialView);
  const navigate = useNavigate();

  useEffect(() => {
    const viewParam = searchParams.get('view');
    if (viewParam && ['tasks', 'calendar', 'yearly', 'weekly'].includes(viewParam)) {
      setView(viewParam as CalendarView);
    }
  }, [searchParams]);

  const changeView = (newView: CalendarView) => {
    const params = new URLSearchParams();
    params.set('view', newView);
    navigate(`/dashboard?${params.toString()}`);
  };

  return { view, changeView };
}