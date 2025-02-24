
import { useState, useEffect, useCallback } from "react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addDays, addWeeks, subWeeks } from "date-fns";
import { CalendarHeader } from "./calendar/CalendarHeader";
import { WeeklyCalendarGrid } from "./calendar/WeeklyCalendarGrid";
import { UnscheduledTasks } from "./calendar/UnscheduledTasks";
import { useWeeklyCalendar } from "@/hooks/use-weekly-calendar";
import { supabase } from "@/integrations/supabase/client";
import { DndContext, DragEndEvent, MouseSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface WeeklyCalendarProps {
  initialDate?: Date;
}

export function WeeklyCalendar({ initialDate }: WeeklyCalendarProps) {
  const [currentDate, setCurrentDate] = useState(initialDate || new Date());
  const [showFullWeek, setShowFullWeek] = useState(true);
  const [startHour, setStartHour] = useState(8);
  const [endHour, setEndHour] = useState(17);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
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

  const loadUserSettings = useCallback(async () => {
    try {
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
        const start = Math.max(0, Math.min(23, data.start_hour));
        const end = Math.max(start + 1, Math.min(24, data.end_hour));
        setStartHour(start);
        setEndHour(end);
      }
    } catch (error) {
      console.error('Error in loadUserSettings:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load time settings. Using default values."
      });
    }
  }, [toast]);

  useEffect(() => {
    let mounted = true;

    if (mounted) {
      loadUserSettings();
    }

    return () => {
      mounted = false;
    };
  }, [loadUserSettings]);

  const {
    scheduledTasks,
    unscheduledTasks,
    visitsPerDay,
    handleDragEnd
  } = useWeeklyCalendar(weekStart, weekEnd, weekDays);

  const monthYear = format(currentDate, 'MMMM yyyy');

  const handleNextWeek = useCallback(() => {
    setCurrentDate(prev => addWeeks(prev, 1));
  }, []);

  const handlePreviousWeek = useCallback(() => {
    setCurrentDate(prev => subWeeks(prev, 1));
  }, []);

  const handleToggleView = useCallback(() => {
    setShowFullWeek(prev => !prev);
  }, []);

  const timeSlots = Array.from(
    { length: Math.max(1, endHour - startHour + 1) }, 
    (_, i) => {
      const hour = startHour + i;
      return {
        hour,
        display: `${hour}:00`
      };
    }
  );

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
