import { Button } from "@/components/ui/button";
import { CalendarDays } from "lucide-react";
import { useState } from "react";

interface CalendarSectionProps {
  onViewChange?: (view: 'tasks' | 'calendar') => void;
}

export function CalendarSection({ onViewChange }: CalendarSectionProps) {
  const [view, setView] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');

  const handleViewChange = (newView: 'daily' | 'weekly' | 'monthly' | 'yearly') => {
    setView(newView);
    if (onViewChange) {
      onViewChange(newView === 'monthly' || newView === 'yearly' ? 'calendar' : 'tasks');
    }
  };

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