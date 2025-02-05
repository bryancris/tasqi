import React from 'react';
import { format } from "date-fns";

interface HeaderCellProps {
  day: Date;
}

export function HeaderCell({ day }: HeaderCellProps) {
  return (
    <div className="h-[100px] bg-[#E3F2F6] p-2 text-center relative z-10 border-b border-gray-200">
      <div className="font-semibold uppercase text-sm text-gray-600">
        {format(day, 'EEE')}
      </div>
      <div className="text-2xl font-bold text-gray-900">
        {format(day, 'd')}
      </div>
      <div className="text-sm text-gray-500">
        {format(day, 'MMM')}
      </div>
    </div>
  );
}