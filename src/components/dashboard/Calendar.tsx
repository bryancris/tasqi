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

  return (
    <div className="w-full max-w-7xl mx-auto bg-white">
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

      <div className="border-b">
        <div className="grid grid-cols-7">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
            <div key={day} className="text-sm font-medium text-gray-500 text-center py-2">
              {day}
            </div>
          ))}
        </div>
      </div>

      <CalendarComponent 
        mode="single"
        defaultMonth={currentMonth}
        className="rounded-md border-0"
        showOutsideDays
        classNames={{
          months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
          month: "space-y-4",
          caption: "hidden",
          table: "w-full border-collapse",
          head_row: "hidden",
          head_cell: "hidden",
          row: "grid grid-cols-7",
          cell: "relative p-0 text-center focus-within:relative focus-within:z-20",
          day: "h-32 w-full p-2 font-normal aria-selected:opacity-100 hover:bg-gray-50 border border-gray-100 text-left",
          day_selected: "bg-white text-primary-foreground hover:bg-accent hover:text-primary-foreground focus:bg-accent focus:text-primary-foreground",
          day_today: "bg-accent text-accent-foreground",
          day_outside: "text-muted-foreground opacity-50 bg-gray-50",
          day_disabled: "text-muted-foreground opacity-50",
          day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
          day_hidden: "invisible",
        }}
      />
    </div>
  );
}