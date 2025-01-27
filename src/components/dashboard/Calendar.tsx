import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function Calendar() {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const monthYear = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
  const currentTime = new Date().toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="flex items-center justify-between px-4 py-2 bg-[#6366F1] text-white">
        <div className="flex items-center space-x-2">
          <h1 className="text-xl font-semibold">TasqiAI</h1>
          <span className="text-sm">{currentTime}</span>
          <span className="text-sm">Mon, Jan 27</span>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white hover:bg-white/20"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-4 px-4 pt-4">
          <h2 className="text-xl font-semibold text-gray-800">{monthYear}</h2>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={previousMonth}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={nextMonth}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <CalendarComponent 
          mode="single"
          defaultMonth={currentMonth}
          className="rounded-md"
          showOutsideDays
          classNames={{
            months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
            month: "space-y-4 w-full",
            caption: "hidden",
            table: "w-full border-collapse",
            head_row: "flex w-full",
            head_cell: "text-sm font-medium text-gray-500 w-full text-center py-2",
            row: "flex w-full",
            cell: "text-center relative p-0 h-[120px] border-r border-t border-gray-200 first:border-l last:border-r w-full",
            day: "h-full w-full p-2 font-normal aria-selected:opacity-100 hover:bg-gray-50",
            day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
            day_today: "bg-accent text-accent-foreground",
            day_outside: "text-muted-foreground opacity-50",
            day_disabled: "text-muted-foreground opacity-50",
            day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
            day_hidden: "invisible",
          }}
        />
      </div>
    </div>
  );
}