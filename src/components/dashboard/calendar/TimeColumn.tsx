
import { cn } from "@/lib/utils";

interface TimeColumnProps {
  timeSlots: Array<{ hour: number; display: string }>;
}

export function TimeColumn({ timeSlots }: TimeColumnProps) {
  const currentHour = new Date().getHours();
  
  return (
    <div className="sticky left-0 z-10 w-14 flex-none bg-gradient-to-b from-[#2EBDAE] to-[#3E8DE3]">
      <div className="sticky top-0 z-10 h-12 flex items-center justify-center border-b border-white/20 px-2">
        <span className="text-sm font-medium text-white">Time</span>
      </div>
      <div className="relative">
        {timeSlots.map((slot, idx) => (
          <div
            key={idx}
            className={cn(
              "flex items-center justify-center border-r border-t border-white/20 h-[60px] -mt-[1px] first:mt-0",
              idx === timeSlots.length - 1 && "border-b",
              currentHour === slot.hour && "bg-white/10"
            )}
          >
            <span className="text-xs text-white font-medium">{slot.display}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
