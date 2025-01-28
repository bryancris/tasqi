import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useClock } from "@/hooks/use-clock";

export function Calendar() {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const { currentTime, currentDate } = useClock();

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const monthYear = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <h1 className="text-xl font-semibold">TasqiAI</h1>
          <span className="text-sm">{currentTime}</span>
          <span className="text-sm">{currentDate}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={previousMonth}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold min-w-[200px] text-center">
            {monthYear}
          </h2>
          <Button
            variant="outline"
            size="icon"
            onClick={nextMonth}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="border rounded-lg p-4">
        <CalendarComponent
          mode="single"
          selected={currentMonth}
          onSelect={(date) => date && setCurrentMonth(date)}
          className="rounded-md"
        />
      </div>
    </div>
  );
}