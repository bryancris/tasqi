import { Button } from "@/components/ui/button";
import { CalendarDays } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

interface CalendarSectionProps {
  onViewChange?: (view: 'tasks' | 'calendar' | 'yearly' | 'weekly') => void;
}

export function CalendarSection({ onViewChange }: CalendarSectionProps) {
  const [view, setView] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');
  const navigate = useNavigate();
  const location = useLocation();

  const handleViewChange = (newView: 'daily' | 'weekly' | 'monthly' | 'yearly') => {
    setView(newView);
    
    if (onViewChange) {
      const mappedView = (() => {
        switch (newView) {
          case 'yearly':
            return 'yearly';
          case 'monthly':
            return 'calendar';
          case 'weekly':
            return 'weekly';
          default:
            return 'tasks';
        }
      })();

      // Navigate to dashboard and update view
      navigate('/dashboard', { 
        state: { targetView: mappedView }
      });

      // Set the view after navigation
      onViewChange(mappedView);
    }
  };

  // Reset view to daily when navigating away from dashboard
  useEffect(() => {
    if (!location.pathname.includes('/dashboard')) {
      setView('daily');
    }
  }, [location.pathname]);

  // Handle initial view when returning to dashboard
  useEffect(() => {
    if (location.pathname === '/dashboard' && location.state?.targetView && onViewChange) {
      onViewChange(location.state.targetView);
    }
  }, [location.pathname, location.state, onViewChange]);

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2 px-2 py-1">
        <CalendarDays className="h-4 w-4 text-[#6366F1]" />
        <span className="text-sm font-medium text-gray-700">Calendar View</span>
      </div>

      <div className="space-y-1">
        <Button 
          variant="ghost" 
          className={`w-full justify-start text-sm pl-8 ${
            view === 'daily' 
              ? 'bg-[#D1FAE5] text-[#059669] hover:bg-[#A7F3D0]' 
              : 'text-[#6B7280] hover:bg-[#E5E7EB]'
          }`}
          onClick={() => handleViewChange('daily')}
        >
          Daily
        </Button>
        <Button 
          variant="ghost" 
          className={`w-full justify-start text-sm pl-8 ${
            view === 'weekly' 
              ? 'bg-[#D1FAE5] text-[#059669] hover:bg-[#A7F3D0]' 
              : 'text-[#6B7280] hover:bg-[#E5E7EB]'
          }`}
          onClick={() => handleViewChange('weekly')}
        >
          Weekly
        </Button>
        <Button 
          variant="ghost" 
          className={`w-full justify-start text-sm pl-8 ${
            view === 'monthly' 
              ? 'bg-[#D1FAE5] text-[#059669] hover:bg-[#A7F3D0]' 
              : 'text-[#6B7280] hover:bg-[#E5E7EB]'
          }`}
          onClick={() => handleViewChange('monthly')}
        >
          Monthly
        </Button>
        <Button 
          variant="ghost" 
          className={`w-full justify-start text-sm pl-8 ${
            view === 'yearly' 
              ? 'bg-[#D1FAE5] text-[#059669] hover:bg-[#A7F3D0]' 
              : 'text-[#6B7280] hover:bg-[#E5E7EB]'
          }`}
          onClick={() => handleViewChange('yearly')}
        >
          Yearly
        </Button>
      </div>
    </div>
  );
}