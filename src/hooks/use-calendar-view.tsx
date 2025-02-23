
import { useNavigate } from 'react-router-dom';
import { CalendarView } from '@/contexts/CalendarViewContext';

export type { CalendarView };

export function useCalendarView(initialView: CalendarView = 'tasks') {
  const navigate = useNavigate();

  const changeView = (newView: CalendarView) => {
    // Use replace instead of push to prevent building up history
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

  return { view: initialView, changeView };
}
