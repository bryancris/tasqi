
interface TimeSlot {
  hour: number;
  display: string;
}

interface TimeColumnProps {
  timeSlots: TimeSlot[];
}

export function TimeColumn({ timeSlots }: TimeColumnProps) {
  return (
    <div className="sticky left-0 z-10 w-16 flex-none bg-[#2EBDAE]">
      <div className="h-[42px] border-b bg-[#2EBDAE]" /> {/* Updated bg-white to bg-[#2EBDAE] */}
      <div className="relative h-full">
        {timeSlots.map((slot, idx) => (
          <div
            key={slot.hour}
            className="flex items-center justify-center border-r border-t border-gray-100 text-xs h-[60px] -mt-[1px] first:mt-0"
          >
            <span className="text-white font-medium">{slot.display}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
