
interface TimeSlot {
  hour: number;
  display: string;
}

interface TimeColumnProps {
  timeSlots: TimeSlot[];
}

export function TimeColumn({ timeSlots }: TimeColumnProps) {
  return (
    <div className="sticky left-0 z-10 w-16 flex-none bg-[#E5F6FF]">
      <div className="h-[42px] border-b bg-white" /> {/* Header spacer */}
      <div className="relative h-full">
        {timeSlots.map((slot, idx) => (
          <div
            key={slot.hour}
            className="flex items-center justify-center border-r border-t border-gray-100 text-xs h-[60px] -mt-[1px] first:mt-0"
          >
            <span className="text-gray-500 font-medium">{slot.display}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
