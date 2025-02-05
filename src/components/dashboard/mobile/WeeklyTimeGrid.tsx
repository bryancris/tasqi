
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
  showFullWeek: boolean;
}

export function WeeklyTimeGrid({ timeSlots, weekDays, scheduledTasks, showFullWeek }: WeeklyTimeGridProps) {
  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide">
      <div className="divide-y divide-gray-300">
        {timeSlots.map((timeSlot, timeIndex) => (
          <div 
            key={timeIndex} 
            className={`grid ${showFullWeek ? 'grid-cols-8' : 'grid-cols-6'} min-h-[80px]`}
          >
            <div className="p-1 border-r border-gray-300 relative bg-[#2A9BB5] w-[40px]">
              <div className="text-xs text-white whitespace-pre-line text-center">
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
