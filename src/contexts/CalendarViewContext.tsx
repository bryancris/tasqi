
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

// Check if we're in a router context
const useRouterOrFallback = () => {
  // Try to access router
  let isRouterAvailable = true;
  let location = { pathname: '/dashboard' };
  let navigate = (path: string) => {
    console.warn('Navigation attempted outside Router context to:', path);
  };

  try {
    // This will throw if outside router
    location = useLocation();
    navigate = useNavigate();
  } catch (e) {
    isRouterAvailable = false;
    console.warn('Router context not available, using fallback navigation');
  }

  return { location, navigate, isRouterAvailable };
};

export function CalendarViewProvider({ children }: { children: ReactNode }) {
  const { location, navigate, isRouterAvailable } = useRouterOrFallback();
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // List of non-calendar routes
  const nonCalendarRoutes = ['notes', 'settings', 'analytics', 'self-care', 'chat'];
  
  // Check if current path is a non-calendar route
  const isNonCalendarRoute = () => {
    return nonCalendarRoutes.some(route => location.pathname.includes(`/dashboard/${route}`));
  };

  // Initialize view based on the current path
  const [view, setCurrentView] = useState<CalendarView>(() => {
    // Only process if router is available
    if (!isRouterAvailable) return 'tasks';
    
    // Initialize with the correct view based on the current path
    const path = location.pathname;
    // Don't process view for non-calendar routes
    if (isNonCalendarRoute()) return 'tasks';
    
    if (path.includes('/week')) return 'weekly';
    if (path.includes('/monthly')) return 'monthly';
    if (path.includes('/yearly')) return 'yearly';
    return 'tasks';
  });

  // Update view based on current route, but only for calendar routes
  useEffect(() => {
    // Skip if router isn't available
    if (!isRouterAvailable) return;
    
    const path = location.pathname;
    if (!path.startsWith('/dashboard')) return;
    if (isNonCalendarRoute()) return;
    
    let newView: CalendarView = 'tasks';
    
    // Use exact path matching instead of includes
    if (path === '/dashboard/week') newView = 'weekly';
    else if (path === '/dashboard/monthly') newView = 'monthly';
    else if (path === '/dashboard/yearly') newView = 'yearly';
    else if (path === '/dashboard' || path === '/dashboard/tasks') newView = 'tasks';
    
    console.log("CalendarViewContext: path changed to", path, "setting view to", newView);
    setCurrentView(newView);
  }, [location.pathname, isRouterAvailable]);

  const setView = (newView: CalendarView) => {
    if (view === newView) return; // Prevent unnecessary navigation
    
    const viewToPathMap = {
      tasks: '/dashboard/tasks',
      weekly: '/dashboard/week',
      monthly: '/dashboard/monthly',
      yearly: '/dashboard/yearly'
    };
    
    const targetPath = viewToPathMap[newView];
    console.log("CalendarViewContext: navigating to", targetPath, "for view", newView);
    
    if (isRouterAvailable && location.pathname !== targetPath) {
      navigate(targetPath);
    }
    
    // Also manually update the view state to ensure immediate UI update
    setCurrentView(newView);
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
