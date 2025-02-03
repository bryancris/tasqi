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
      <div className="divide-y divide-[#E5DEFF]">
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
              "p-2 border-r relative",
              "transition-colors",
              timeIndex % 2 === 0 ? "bg-[#F1F0FB]" : "bg-white"
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
                  "p-2 border-r last:border-r-0",
                  "transition-colors",
                  timeIndex % 2 === 0 ? "bg-[#F1F0FB]" : "bg-white"
                )}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}