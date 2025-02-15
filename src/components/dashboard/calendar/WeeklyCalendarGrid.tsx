
import React from 'react';
import { Task } from "../TaskBoard";
import { format, parseISO } from "date-fns";
import { useDroppable } from "@dnd-kit/core";
import { TaskCard } from "../TaskCard";
import { cn } from "@/lib/utils";

interface WeeklyCalendarGridProps {
  weekDays: Date[];
  timeSlots: {
    hour: number;
    display: string;
  }[];
  scheduledTasks: Task[];
  showFullWeek: boolean;
}

const CalendarCell = ({ 
  day, 
  timeSlot, 
  tasks,
  isLastRow,
  isLastColumn,
  isFirstColumn
}: { 
  day: Date;
  timeSlot: { hour: number; display: string };
  tasks: Task[];
  isLastRow: boolean;
  isLastColumn: boolean;
  isFirstColumn: boolean;
}) => {
  const formattedDate = format(day, 'yyyy-MM-dd');
  const { setNodeRef, isOver } = useDroppable({
    id: `${formattedDate}-${timeSlot.hour}`,
    data: {
      date: formattedDate,
      hour: timeSlot.hour
    }
  });

  const tasksForThisSlot = tasks.filter(task => {
    if (!task.date || !task.start_time) return false;
    
    const taskDate = format(parseISO(task.date), 'yyyy-MM-dd');
    if (taskDate !== formattedDate) return false;

    const [taskStartHour] = task.start_time.split(':').map(Number);
    return taskStartHour === timeSlot.hour;
  });

  console.log(`Checking tasks for ${formattedDate} at ${timeSlot.hour}:00 -`, tasksForThisSlot);

  const getTaskPosition = (task: Task) => {
    if (!task.start_time || !task.end_time) return null;

    const [startHour, startMinute] = task.start_time.split(':').map(Number);
    const [endHour, endMinute] = task.end_time.split(':').map(Number);

    // Calculate duration in minutes
    const durationInMinutes = ((endHour - startHour) * 60) + (endMinute - startMinute);
    
    // Only show task in its starting cell
    if (startHour !== timeSlot.hour) {
      return null;
    }

    // For tasks less than 30 minutes
    if (durationInMinutes <= 30) {
      return { 
        top: startMinute < 30 ? '1px' : '31px', 
        height: '28px',
        position: 'absolute' as const,
        left: '1px',
        right: '1px',
        zIndex: 10
      };
    }
    
    // For tasks that span the full hour
    if (durationInMinutes <= 60) {
      return { 
        top: '1px',
        height: '58px',
        position: 'absolute' as const,
        left: '1px',
        right: '1px',
        zIndex: 10
      };
    }
    
    // For tasks longer than an hour
    return {
      top: '1px',
      height: '58px', // Only show within the hour slot
      position: 'absolute' as const,
      left: '1px',
      right: '1px',
      zIndex: 10
    };
  };

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "relative h-[60px] min-h-[60px]",
        "border-[#403E43]",
        {
          "border-l": !isFirstColumn,
          "border-r": true,
          "border-t": true,
          "border-b": isLastRow,
        },
        isOver && "bg-blue-50/50",
        "transition-colors duration-200"
      )}
    >
      {/* 30-minute marker */}
      <div className="absolute left-0 right-0 top-1/2 border-t border-[#403E43]/30" />
      
      {tasksForThisSlot.map((task) => {
        const position = getTaskPosition(task);
        if (!position) return null;

        return (
          <div 
            key={task.id} 
            style={position}
          >
            <TaskCard
              task={task}
              index={0}
              isDraggable={true}
              view="weekly"
            />
          </div>
        );
      })}
    </div>
  );
}

export function WeeklyCalendarGrid({ weekDays, timeSlots, scheduledTasks, showFullWeek }: WeeklyCalendarGridProps) {
  console.log('Scheduled tasks received:', scheduledTasks);
  const displayDays = showFullWeek ? weekDays : weekDays.slice(0, 5);

  return (
    <div className="relative bg-white rounded-lg shadow-sm overflow-hidden">
      <div className={cn(
        "grid",
        showFullWeek ? "grid-cols-[auto_repeat(7,1fr)]" : "grid-cols-[auto_repeat(5,1fr)]",
        "border border-[#403E43]"
      )}>
        {/* Header */}
        <div className="bg-[#B2E3EA] p-4 border-r border-[#403E43]" /> {/* Time column header spacer */}
        {displayDays.map((day, index) => (
          <div
            key={day.toISOString()}
            className={cn(
              "px-2 py-4 text-center",
              "bg-[#B2E3EA]",
              "border-r border-[#403E43]",
              index === displayDays.length - 1 ? "" : "border-r"
            )}
          >
            <div className="font-medium text-slate-900">{format(day, 'EEE')}</div>
            <div className="text-sm text-slate-500">{format(day, 'd')}</div>
          </div>
        ))}

        {/* Time slots and cells */}
        {timeSlots.map((timeSlot, rowIndex) => (
          <React.Fragment key={timeSlot.hour}>
            <div className="w-20 px-4 py-3 text-right text-sm text-slate-500 bg-[#B2E3EA] border-r border-[#403E43]">
              {timeSlot.display}
            </div>
            {displayDays.map((day, colIndex) => (
              <CalendarCell
                key={`${day.toISOString()}-${timeSlot.hour}`}
                day={day}
                timeSlot={timeSlot}
                tasks={scheduledTasks}
                isLastRow={rowIndex === timeSlots.length - 1}
                isLastColumn={colIndex === displayDays.length - 1}
                isFirstColumn={colIndex === 0}
              />
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
