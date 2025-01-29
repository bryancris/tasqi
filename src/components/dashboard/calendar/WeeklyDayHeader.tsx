import { format } from "date-fns";

interface WeeklyDayHeaderProps {
  weekDays: Date[];
  visitsPerDay: string[];
}

export function WeeklyDayHeader({ weekDays, visitsPerDay }: WeeklyDayHeaderProps) {
  return (
    <div className="grid grid-cols-8 border-b">
      {/* Empty cell for time column */}
      <div className="p-4 border-r bg-gray-50"></div>
      
      {weekDays.map((day, index) => (
        <div 
          key={index}
          className="p-4 text-center border-r last:border-r-0 bg-gray-50"
        >
          <div className="font-semibold uppercase text-sm text-gray-600">
            {format(day, 'EEE')}
          </div>
          <div className="text-lg font-medium">
            {format(day, 'd')}
          </div>
          <div className="text-xs text-gray-500">
            {visitsPerDay[index]}
          </div>
        </div>
      ))}
    </div>
  );
}