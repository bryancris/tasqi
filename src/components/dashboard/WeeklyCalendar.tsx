
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addDays, addWeeks, subWeeks } from "date-fns";
import { CalendarHeader } from "./calendar/CalendarHeader";
import { WeeklyDayHeader } from "./calendar/WeeklyDayHeader";
import { WeeklyCalendarGrid } from "./calendar/WeeklyCalendarGrid";
import { UnscheduledTasks } from "./calendar/UnscheduledTasks";
import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { useWeeklyCalendar } from "@/hooks/use-weekly-calendar";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface WeeklyCalendarProps {
  initialDate?: Date;
}

export function WeeklyCalendar({ initialDate }: WeeklyCalendarProps) {
  const [currentDate, setCurrentDate] = useState(initialDate || new Date());
  const [showFullWeek, setShowFullWeek] = useState(true);
  const queryClient = useQueryClient();
  
  // Start from Sunday if showing full week, Monday if showing 5 days
  const weekStart = startOfWeek(currentDate, { weekStartsOn: showFullWeek ? 0 : 1 });
  const weekEnd = showFullWeek 
    ? endOfWeek(currentDate, { weekStartsOn: 0 })
    : addDays(weekStart, 4); // Friday
  
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const timeSlots = Array.from({ length: 12 }, (_, i) => {
    const hour = 8 + i;
    return `${hour}:00`;
  });

  const {
    unscheduledTasks,
    scheduledTasks,
    visitsPerDay,
    handleDragEnd
  } = useWeeklyCalendar(weekStart, weekEnd, weekDays);

  const monthYear = format(currentDate, 'MMMM yyyy');

  const handleNextWeek = () => {
    setCurrentDate(addWeeks(currentDate, 1));
  };

  const handlePreviousWeek = () => {
    setCurrentDate(subWeeks(currentDate, 1));
  };

  // Subscribe to real-time updates
  useEffect(() => {
    console.log('Setting up real-time subscription in WeeklyCalendar');
    const channel = supabase
      .channel('tasks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks'
        },
        (payload) => {
          console.log('Received real-time update in WeeklyCalendar:', payload);
          // Invalidate and refetch tasks when changes occur
          queryClient.invalidateQueries({ 
            queryKey: ['tasks', format(weekStart, 'yyyy-MM-dd'), format(weekEnd, 'yyyy-MM-dd')] 
          });
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up real-time subscription in WeeklyCalendar');
      supabase.removeChannel(channel);
    };
  }, [queryClient, weekStart, weekEnd]);

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 w-full max-w-[95%] mx-auto">
        <div className="flex-1">
          <CalendarHeader 
            monthYear={monthYear}
            onNextMonth={handleNextWeek}
            onPreviousMonth={handlePreviousWeek}
            showWeekly={true}
          />

          <div className="border rounded-lg bg-white shadow-sm overflow-hidden mt-4">
            <WeeklyDayHeader 
              weekDays={weekDays} 
              visitsPerDay={visitsPerDay}
              showFullWeek={showFullWeek}
              onToggleView={() => setShowFullWeek(!showFullWeek)}
            />
            <WeeklyCalendarGrid 
              weekDays={weekDays}
              timeSlots={timeSlots}
              scheduledTasks={scheduledTasks}
            />
          </div>
        </div>

        <UnscheduledTasks tasks={unscheduledTasks} />
      </div>
    </DndContext>
  );
}
