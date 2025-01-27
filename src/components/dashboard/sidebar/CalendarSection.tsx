import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { CalendarDays } from "lucide-react";
import { useState } from "react";

type ViewType = 'daily' | 'weekly' | 'monthly' | 'yearly';

interface CalendarSectionProps {
  onViewChange?: (view: 'tasks' | 'calendar') => void;
}

export function CalendarSection({ onViewChange }: CalendarSectionProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [view, setView] = useState<ViewType>('daily');

  const handleViewChange = (newView: ViewType) => {
    setView(newView);
    if (onViewChange) {
      onViewChange(newView === 'monthly' || newView === 'yearly' ? 'calendar' : 'tasks');
    }
  };

  const getCalendarView = () => {
    switch (view) {
      case 'monthly':
        return (
          <div className="mt-4 -mx-2">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              numberOfMonths={1}
              className="rounded-md border-[1.5px] border-gray-300 scale-75 origin-top"
            />
          </div>
        );
      case 'yearly':
        return (
          <div className="mt-4 -mx-2 grid grid-cols-3 gap-1">
            {Array.from({ length: 12 }, (_, i) => {
              const monthDate = new Date(date?.getFullYear() || new Date().getFullYear(), i, 1);
              return (
                <Calendar
                  key={i}
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  defaultMonth={monthDate}
                  numberOfMonths={1}
                  className="rounded-md border-[1.5px] border-gray-300 scale-[0.4] origin-top"
                  showOutsideDays={false}
                />
              );
            })}
          </div>
        );
      default:
        return (
          <div className="mt-4 -mx-2">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border-[1.5px] border-gray-300 scale-75 origin-top"
            />
          </div>
        );
    }
  };

  return (
    <div className="space-y-2">
      <Button 
        variant="ghost" 
        className="w-full justify-start text-[#6B7280] hover:text-[#374151] hover:bg-[#E5E7EB]"
      >
        <CalendarDays className="mr-2 h-4 w-4" />
        Calendar View
      </Button>

      <div className="pl-8 space-y-1">
        <Button 
          variant="ghost" 
          className={`w-full justify-start text-sm ${
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
          className={`w-full justify-start text-sm ${
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
          className={`w-full justify-start text-sm ${
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
          className={`w-full justify-start text-sm ${
            view === 'yearly' 
              ? 'bg-[#D1FAE5] text-[#059669] hover:bg-[#A7F3D0]' 
              : 'text-[#6B7280] hover:bg-[#E5E7EB]'
          }`}
          onClick={() => handleViewChange('yearly')}
        >
          Yearly
        </Button>
      </div>

      {getCalendarView()}
    </div>
  );
}