
import React from 'react';
import { Task } from "../TaskBoard";
import { format, parseISO } from "date-fns";
import { useDroppable } from "@dnd-kit/core";
import { WeeklyTaskCard } from "../task-card/WeeklyTaskCard";
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

const getTaskPosition = (task: Task, timeSlot: { hour: number }) => {
  if (!task.start_time || !task.end_time) return null;

  const [startHour, startMinute] = task.start_time.split(':').map(Number);
  const [endHour, endMinute] = task.end_time.split(':').map(Number);

  // Calculate position and height
  const startMinuteOffset = startHour === timeSlot.hour ? startMinute : 0;
  const endMinuteOffset = endHour === timeSlot.hour ? endMinute : 60;
  
  const height = ((endMinuteOffset - startMinuteOffset) / 60) * 100;
  const top = (startMinuteOffset / 60) * 100;

  return {
    height: `${height}%`,
    top: `${top}%`,
    position: 'absolute' as const,
    left: '1px',
    right: '1px',
  };
};

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

  // Filter tasks that start or end in this hour slot
  const tasksForThisSlot = tasks.filter(task => {
    if (!task.date || !task.start_time || task.status !== 'scheduled') return false;
    
    const taskDate = format(parseISO(task.date), 'yyyy-MM-dd');
    if (taskDate !== formattedDate) return false;

    const [taskStartHour] = task.start_time.split(':').map(Number);
    return taskStartHour === timeSlot.hour;
  });

  console.log('Tasks for slot:', {
    date: formattedDate,
    hour: timeSlot.hour,
    count: tasksForThisSlot.length,
    tasks: tasksForThisSlot
  });

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
      
      {tasksForThisSlot.map((task, index) => {
        const position = getTaskPosition(task, timeSlot);
        if (!position) return null;

        return (
          <div 
            key={task.id} 
            style={{
              ...position,
              zIndex: index + 1
            }}
          >
            <WeeklyTaskCard
              task={task}
              dragHandleProps={{
                'data-dnd-draggable': true,
                'data-dnd-draggable-id': task.id
              }}
            />
          </div>
        );
      })}
    </div>
  );
};

export function WeeklyCalendarGrid({ weekDays, timeSlots, scheduledTasks, showFullWeek }: WeeklyCalendarGridProps) {
  const displayDays = showFullWeek ? weekDays : weekDays.slice(0, 5);
  
  console.log('WeeklyCalendarGrid - Scheduled tasks:', scheduledTasks);

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
        {timeSlots.map((timeSlot, rowIndex) => {
          const rowKey = `row-${timeSlot.hour}`;
          return (
            <div key={rowKey} className="contents">
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
            </div>
          );
        })}
      </div>
    </div>
  );
}
