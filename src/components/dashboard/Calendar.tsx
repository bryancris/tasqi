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

  // Mock events data - in a real app this would come from your backend
  const events = [
    { id: 1, title: "Monday Morning Meeting", time: "09:00", date: new Date(2024, 11, 2) },
    { id: 2, title: "Call Deb", time: "08:00", date: new Date(2024, 11, 10) },
    { id: 3, title: "Montpelier hill", time: "16:00", date: new Date(2024, 11, 27) },
    { id: 4, title: "Cleaners In", time: "13:30", date: new Date(2024, 11, 29) },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <h1 className="text-xl font-semibold">TasqiAI</h1>
          <span className="text-sm">{currentTime}</span>
          <span className="text-sm">{currentDate}</span>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="icon"
            onClick={previousMonth}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-2xl font-bold min-w-[200px] text-center">
            {monthYear}
          </h2>
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

      <div className="border rounded-lg bg-white shadow-sm overflow-hidden">
        <div className="grid grid-cols-7 gap-px bg-gray-200 border-b">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
            <div key={day} className="bg-white p-2 text-sm font-medium text-gray-500 text-center">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-px bg-gray-200">
          {Array.from({ length: 42 }, (_, i) => {
            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i - currentMonth.getDay() + 2);
            const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
            const isToday = new Date().toDateString() === date.toDateString();
            const dayEvents = events.filter(event => event.date.toDateString() === date.toDateString());

            return (
              <div
                key={i}
                className={`min-h-[120px] bg-white p-2 ${
                  !isCurrentMonth ? 'text-gray-400' : ''
                } ${isToday ? 'bg-blue-50' : ''}`}
              >
                <div className="flex justify-between items-start">
                  <span className={`text-sm font-medium ${
                    isToday ? 'h-6 w-6 bg-blue-600 text-white rounded-full flex items-center justify-center' : ''
                  }`}>
                    {date.getDate()}
                  </span>
                </div>
                <div className="mt-1 space-y-1">
                  {dayEvents.map((event) => (
                    <div
                      key={event.id}
                      className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-700"
                    >
                      <div className="font-medium">{event.time}</div>
                      <div className="truncate">{event.title}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}