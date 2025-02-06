import { useState, useEffect } from "react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addDays, addWeeks, subWeeks } from "date-fns";
import { CalendarHeader } from "./calendar/CalendarHeader";
import { WeeklyCalendarGrid } from "./calendar/WeeklyCalendarGrid";
import { UnscheduledTasks } from "./calendar/UnscheduledTasks";
import { useWeeklyCalendar } from "@/hooks/use-weekly-calendar";
import { supabase } from "@/integrations/supabase/client";
import { DndContext, DragEndEvent, MouseSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import { useQueryClient } from "@tanstack/react-query";

interface WeeklyCalendarProps {
  initialDate?: Date;
}

export function WeeklyCalendar({ initialDate }: WeeklyCalendarProps) {
  const [currentDate, setCurrentDate] = useState(initialDate || new Date());
  const [showFullWeek, setShowFullWeek] = useState(true);
  const [startHour, setStartHour] = useState(8);
  const [endHour, setEndHour] = useState(17);
  const queryClient = useQueryClient();
  
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  // Start from Sunday if showing full week, Monday if showing 5 days
  const weekStart = startOfWeek(currentDate, { weekStartsOn: showFullWeek ? 0 : 1 });
  const weekEnd = showFullWeek 
    ? endOfWeek(currentDate, { weekStartsOn: 0 })
    : addDays(weekStart, 4); // Friday
  
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  useEffect(() => {
    const loadUserSettings = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('user_settings')
        .select('start_hour, end_hour')
        .eq('user_id', session.user.id)
        .single();

      if (error) {
        console.error('Error loading settings:', error);
        return;
      }

      if (data) {
        setStartHour(data.start_hour);
        setEndHour(data.end_hour);
      }
    };

    loadUserSettings();
  }, []);

  // Set up real-time subscription for task updates
  useEffect(() => {
    const channel = supabase
      .channel('tasks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks'
        },
        () => {
          // Invalidate and refetch tasks when changes occur
          queryClient.invalidateQueries({ queryKey: ['tasks'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const timeSlots = Array.from({ length: endHour - startHour + 1 }, (_, i) => {
    const hour = startHour + i;
    return {
      hour,
      display: `${hour}:00`
    };
  });

  const {
    scheduledTasks,
    unscheduledTasks,
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

  const handleToggleView = () => {
    setShowFullWeek(!showFullWeek);
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex gap-6 w-full max-w-[98%] mx-auto">
        <div className="flex-1">
          <CalendarHeader 
            monthYear={monthYear}
            onNextMonth={handleNextWeek}
            onPreviousMonth={handlePreviousWeek}
            showWeekly={true}
            showFullWeek={showFullWeek}
            onToggleView={handleToggleView}
          />

          <div className="border rounded-lg bg-white shadow-sm overflow-hidden mt-4">
            <WeeklyCalendarGrid 
              weekDays={weekDays}
              timeSlots={timeSlots}
              scheduledTasks={scheduledTasks}
              showFullWeek={showFullWeek}
            />
          </div>
        </div>

        <div className="flex-none">
          <UnscheduledTasks tasks={unscheduledTasks} />
        </div>
      </div>
    </DndContext>
  );
}