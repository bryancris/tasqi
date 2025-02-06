import React from 'react';

interface TimeColumnProps {
  timeSlot: {
    hour: number;
    display: string;
  };
}

export function TimeColumn({ timeSlot }: TimeColumnProps) {
  return (
    <div className="bg-[#E3F2F6] h-[80px] flex items-center justify-center border-t-2 border-gray-600 relative z-10">
      <div className="text-sm text-gray-600 font-medium">
        {timeSlot.hour.toString().padStart(2, '0')}:00
      </div>
    </div>
  );
}