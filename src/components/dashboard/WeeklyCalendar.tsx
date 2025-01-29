import { format, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";
import { CalendarHeader } from "./calendar/CalendarHeader";
import { cn } from "@/lib/utils";

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
  const timeSlots = Array.from({ length: 12 }, (_, i) => {
    const hour = 8 + i;
    return `${hour}:00`;
  });

  // Mock data for visits (you can replace this with real data later)
  const mockVisits = {
    0: "1 Visit",
    1: "7 Visits",
    2: "6 Visits",
    3: "4 Visits",
    4: "7 Visits",
    5: "8 Visits",
    6: "1 Visit"
  };

  // Mock tasks (you can replace this with real data later)
  const mockTasks = [
    { 
      time: "10:00", 
      day: 0, 
      title: "Pick up materials",
      type: "material",
      completed: false
    },
    {
      time: "8:00",
      day: 1,
      title: "Robin Schneider - Edmonton",
      type: "appointment",
      completed: false
    },
    // Add more mock tasks as needed
  ];

  const monthYear = format(currentDate, 'MMMM yyyy');

  return (
    <div className="w-full max-w-[95%] mx-auto">
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
              <div className="font-semibold uppercase text-sm text-gray-600">
                {format(day, 'EEE')}
              </div>
              <div className="text-lg font-medium">
                {format(day, 'd')}
              </div>
              <div className="text-xs text-gray-500">
                {mockVisits[index as keyof typeof mockVisits]}
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
                  className={cn(
                    "p-2 border-r last:border-r-0 min-h-[80px] relative",
                    "hover:bg-gray-50 transition-colors"
                  )}
                >
                  {/* Task blocks would go here */}
                  {mockTasks
                    .filter(task => task.time === time && task.day === dayIndex)
                    .map((task, taskIndex) => (
                      <div
                        key={taskIndex}
                        className={cn(
                          "p-2 rounded-md mb-1 text-sm",
                          task.type === "appointment" && "bg-green-100 border border-green-200",
                          task.type === "material" && "bg-blue-100 border border-blue-200",
                          task.completed && "line-through opacity-50"
                        )}
                      >
                        <div className="font-medium">
                          {task.title}
                        </div>
                      </div>
                    ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}