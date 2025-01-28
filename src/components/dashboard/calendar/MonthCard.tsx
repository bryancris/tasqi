import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Task } from "../TaskBoard";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO } from "date-fns";

interface MonthCardProps {
  month: string;
  date: Date;
  selectedDate: Date;
  onSelect: (date: Date) => void;
  gradientClass?: string;
  tasks?: Task[];
}

export function MonthCard({ month, date, selectedDate, onSelect, gradientClass, tasks = [] }: MonthCardProps) {
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);

  // Get all days in the month
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(monthStart);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Group days into weeks
  const weeks: Date[][] = [];
  let currentWeek: Date[] = [];

  days.forEach((day) => {
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    currentWeek.push(day);
  });

  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  const handleDateClick = (date: Date) => {
    onSelect(date);
  };

  return (
    <Card className={`overflow-hidden ${gradientClass}`}>
      <CardHeader className="p-4">
        <h3 className="text-lg font-semibold text-gray-800">{month}</h3>
      </CardHeader>
      <CardContent className="p-2">
        <div className="grid grid-cols-7 gap-1 text-xs">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day) => (
            <div key={day} className="text-center text-gray-500 font-medium">
              {day}
            </div>
          ))}
        </div>
        <div className="mt-1">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 gap-1">
              {week.map((day, dayIndex) => {
                const dayTasks = tasks.filter(task => {
                  if (!task.date) return false;
                  return isSameDay(parseISO(task.date), day);
                });
                
                const isSelected = isSameDay(day, selectedDate);
                const isHovered = hoveredDate && isSameDay(day, hoveredDate);
                
                return (
                  <button
                    key={dayIndex}
                    onClick={() => handleDateClick(day)}
                    onMouseEnter={() => setHoveredDate(day)}
                    onMouseLeave={() => setHoveredDate(null)}
                    className={`
                      w-6 h-6 text-xs rounded-full flex items-center justify-center
                      transition-colors relative
                      ${isSelected ? 'bg-primary text-primary-foreground' : ''}
                      ${isHovered ? 'bg-primary/10' : ''}
                      ${dayTasks.length > 0 ? 'font-bold' : ''}
                      hover:bg-primary/20
                    `}
                  >
                    {format(day, 'd')}
                    {dayTasks.length > 0 && (
                      <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}