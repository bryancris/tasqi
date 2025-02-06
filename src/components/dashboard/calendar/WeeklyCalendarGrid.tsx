import { Task } from "../TaskBoard";
import { format } from "date-fns";
import { DayCell } from "../mobile/DayCell";

interface WeeklyCalendarGridProps {
  weekDays: Date[];
  timeSlots: {
    hour: number;
    display: string;
  }[];
  scheduledTasks: Task[];
  showFullWeek: boolean;
}

export function WeeklyCalendarGrid({ weekDays, timeSlots, scheduledTasks, showFullWeek }: WeeklyCalendarGridProps) {
  return (
    <div className="relative">
      <div className="grid grid-cols-[auto_repeat(7,1fr)]">
        <div className="w-16" /> {/* Time column header spacer */}
        {weekDays.map((day, index) => (
          <div
            key={day.toISOString()}
            className="px-2 py-3 text-center border-b border-gray-200 bg-gray-50"
          >
            <div className="font-medium">{format(day, 'EEE')}</div>
            <div className="text-sm text-gray-500">{format(day, 'd')}</div>
          </div>
        ))}

        {timeSlots.map((timeSlot, rowIndex) => (
          <React.Fragment key={timeSlot.hour}>
            <div className="w-16 px-2 py-3 text-right text-sm text-gray-500 border-r border-gray-200">
              {timeSlot.display}
            </div>
            {weekDays.map((day, colIndex) => (
              <DayCell
                key={`${day.toISOString()}-${timeSlot.hour}`}
                day={day}
                timeSlot={timeSlot}
                tasks={scheduledTasks}
                isLastRow={rowIndex === timeSlots.length - 1}
                isLastColumn={colIndex === weekDays.length - 1}
              />
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}