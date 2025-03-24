
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

  const getTaskIndicatorColor = (taskCount: number) => {
    if (taskCount >= 7) return 'bg-[#ea384c]';
    if (taskCount >= 4) return 'bg-[#F97316]';
    if (taskCount >= 1) return 'bg-[#22C55E]';
    return '';
  };

  // Create an array of weekday labels with unique keys
  const weekDayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => ({
    key: `${month}-${day}-${index}`,
    label: day
  }));

  return (
    <Card className={`overflow-hidden ${gradientClass}`}>
      <CardHeader className="p-4">
        <h3 className="text-lg font-semibold text-gray-800">{month}</h3>
      </CardHeader>
      <CardContent className="p-2">
        <div className="grid grid-cols-7 gap-1 text-xs">
          {weekDayLabels.map(({ key, label }) => (
            <div key={key} className="text-center text-gray-500 font-medium">
              {label}
            </div>
          ))}
        </div>
        <div className="mt-1">
          {weeks.map((week, weekIndex) => (
            <div key={`${month}-week-${weekIndex}`} className="grid grid-cols-7 gap-1">
              {week.map((day) => {
                // Safe filtering of tasks for this day
                const dayTasks = tasks.filter(task => {
                  if (!task.date) return false;
                  
                  try {
                    const taskDate = parseISO(task.date);
                    return isSameDay(taskDate, day);
                  } catch (error) {
                    return false;
                  }
                });
                
                const isSelected = isSameDay(day, selectedDate);
                const isHovered = hoveredDate && isSameDay(day, hoveredDate);
                const taskCount = dayTasks.length;
                const taskIndicatorColor = getTaskIndicatorColor(taskCount);
                const dayKey = `${month}-day-${format(day, 'yyyy-MM-dd')}`;
                
                return (
                  <div key={dayKey} className="relative">
                    <button
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
                    </button>
                    {taskCount > 0 && (
                      <div 
                        className={`
                          absolute -bottom-1 left-1/2 transform -translate-x-1/2 
                          w-4 h-0.5 rounded-full transition-all duration-200
                          ${taskIndicatorColor}
                        `} 
                      />
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
