import React from 'react';
import { cn } from "@/lib/utils";

interface TimeColumnProps {
  timeSlot: {
    hour: number;
    display: string;
  };
  isLastRow?: boolean;
}

export function TimeColumn({ timeSlot, isLastRow }: TimeColumnProps) {
  return (
    <div className={cn(
      "bg-[#E3F2F6] h-[60px] min-h-[60px]",
      "flex items-center justify-center",
      "border-t-2 border-gray-600",
      isLastRow && "border-b-2",
      "relative z-10"
    )}>
      <div className="text-sm text-gray-600 font-medium">
        {timeSlot.hour.toString().padStart(2, '0')}:00
      </div>
    </div>
  );
}