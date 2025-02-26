
interface TimeSlot {
  hour: number;
  display: string;
}

interface TimeColumnProps {
  timeSlots: TimeSlot[];
}

export function TimeColumn({ timeSlots }: TimeColumnProps) {
  return (
    <div className="sticky left-0 z-10 w-14 flex-none bg-[#E5F6FF]">
      <div className="relative h-full">
        {timeSlots.map((slot, idx) => (
          <div
            key={slot.hour}
            className={`flex items-center justify-center border-r border-t border-gray-200 text-xs h-[60px] -mt-[1px] first:mt-0 ${
              idx === timeSlots.length - 1 ? 'border-b' : ''
            }`}
          >
            <span className="text-gray-600">{slot.display}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
