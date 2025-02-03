import { cn } from "@/lib/utils";

interface TimeSlot {
  hour: number;
  display: string;
}

interface WeeklyTimeGridProps {
  timeSlots: TimeSlot[];
  weekDays: Date[];
  showFullWeek: boolean;
}

export function WeeklyTimeGrid({ timeSlots, weekDays, showFullWeek }: WeeklyTimeGridProps) {
  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide">
      <div className="divide-y divide-gray-300">
        {timeSlots.map((time, timeIndex) => (
          <div 
            key={timeIndex} 
            className={cn(
              "grid",
              showFullWeek ? "grid-cols-8" : "grid-cols-6",
              "min-h-[80px]"
            )}
          >
            {/* Time column */}
            <div className={cn(
              "p-2 border-r border-gray-300 relative",
              "transition-colors",
              timeIndex % 2 === 0 ? "bg-[#F8F8FC]" : "bg-white"
            )}>
              <div className="text-xs text-[#6B7280] whitespace-pre-line">
                {time.display}
              </div>
            </div>
            {/* Day columns */}
            {weekDays.map((_, dayIndex) => (
              <div 
                key={dayIndex}
                className={cn(
                  "p-2 relative",
                  "transition-colors",
                  timeIndex % 2 === 0 ? "bg-[#F8F8FC]" : "bg-white",
                  "border-r border-gray-300 last:border-r-0",
                  "hover:bg-gray-50/50"
                )}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}