import { format, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";
import { CalendarHeader } from "./calendar/CalendarHeader";

interface WeeklyCalendarProps {
  initialDate?: Date;
}

export function WeeklyCalendar({ initialDate }: WeeklyCalendarProps) {
  const currentDate = initialDate || new Date();
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 }); // Start on Sunday
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
  
  // Get all days in the week
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Generate time slots from 8:00 to 17:00 (5 PM)
  const timeSlots = Array.from({ length: 10 }, (_, i) => {
    const hour = 8 + i;
    return `${hour}:00`;
  });

  const monthYear = format(currentDate, 'MMMM yyyy');

  return (
    <div className="w-full max-w-7xl mx-auto">
      <CalendarHeader 
        monthYear={monthYear}
        onNextMonth={() => {}}
        onPreviousMonth={() => {}}
        showWeekly={true}
      />

      <div className="border rounded-lg bg-white shadow-sm overflow-hidden mt-4">
        {/* Header with days */}
        <div className="grid grid-cols-8 border-b">
          {/* Empty cell for time column */}
          <div className="p-4 border-r bg-gray-50"></div>
          
          {weekDays.map((day, index) => (
            <div 
              key={index}
              className="p-4 text-center border-r last:border-r-0 bg-gray-50"
            >
              <div className="font-semibold uppercase text-sm">
                {format(day, 'EEE')}
              </div>
              <div className="text-lg">
                {format(day, 'd')}
              </div>
              <div className="text-xs text-gray-500">
                0 Visits
              </div>
            </div>
          ))}
        </div>

        {/* Time slots grid */}
        <div className="divide-y">
          {timeSlots.map((time, timeIndex) => (
            <div key={timeIndex} className="grid grid-cols-8">
              {/* Time column */}
              <div className="p-4 border-r text-sm font-medium text-gray-500">
                {time}
              </div>
              
              {/* Day columns */}
              {Array.from({ length: 7 }, (_, dayIndex) => (
                <div 
                  key={dayIndex}
                  className="p-2 border-r last:border-r-0 min-h-[100px]"
                >
                  {/* Empty cell for now - will be populated with tasks later */}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}