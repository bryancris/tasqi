import { Task } from "../TaskBoard";
import { DayCell } from "./DayCell";

interface TimeSlot {
  hour: number;
  display: string;
}

interface WeeklyTimeGridProps {
  timeSlots: TimeSlot[];
  weekDays: Date[];
  scheduledTasks: Task[];
  showFullWeek: boolean;  // Added this prop
}

export function WeeklyTimeGrid({ timeSlots, weekDays, scheduledTasks, showFullWeek }: WeeklyTimeGridProps) {
  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide">
      <div className="divide-y divide-gray-300">
        {timeSlots.map((timeSlot, timeIndex) => (
          <div 
            key={timeIndex} 
            className="grid grid-cols-8 min-h-[80px]"
          >
            <div className="p-1 border-r border-gray-300 relative bg-[#B2E3EA] w-[40px]">
              <div className="text-xs text-[#6B7280] whitespace-pre-line text-center">
                {timeSlot.hour}
              </div>
            </div>
            
            {weekDays.map((day, dayIndex) => (
              <DayCell 
                key={dayIndex}
                day={day}
                timeSlot={timeSlot}
                tasks={scheduledTasks}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}