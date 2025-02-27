
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TimelineSlot } from "../TimelineSlot";
import { Task } from "../TaskBoard";
import { supabase } from "@/integrations/supabase/client";
import { format, isSameDay, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DateSelector } from "../schedule/DateSelector";
import { useTimelineTasks } from "@/hooks/use-timeline-tasks";

interface TimelineSectionProps {
  tasks: Task[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export function TimelineSection({ selectedDate, onDateChange }: TimelineSectionProps) {
  const [startHour, setStartHour] = useState(8);
  const [endHour, setEndHour] = useState(17);
  const { tasks } = useTimelineTasks();

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

  const timeSlots = Array.from(
    { length: endHour - startHour + 1 },
    (_, i) => {
      const hour = startHour + i;
      return hour.toString().padStart(2, '0') + ':00';
    }
  );

  // Filter tasks for the selected date
  const scheduledTasks = tasks.filter(task => {
    if (!task.date) return false;
    const taskDate = parseISO(task.date);
    return isSameDay(taskDate, selectedDate);
  });

  const handlePrevDay = () => {
    const prevDay = new Date(selectedDate);
    prevDay.setDate(prevDay.getDate() - 1);
    onDateChange(prevDay);
  };

  const handleNextDay = () => {
    const nextDay = new Date(selectedDate);
    nextDay.setDate(nextDay.getDate() + 1);
    onDateChange(nextDay);
  };

  return (
    <Card className="bg-gradient-to-t from-[#E6E9F0] to-[#EEF1F5] border-none shadow-sm">
      <CardHeader className="bg-white/70 border-b">
        <CardTitle>Timeline</CardTitle>
        <div className="flex items-center justify-between mt-2">
          <Button variant="ghost" size="icon" onClick={handlePrevDay}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <DateSelector 
            date={format(selectedDate, 'yyyy-MM-dd')}
            onDateChange={(newDate) => onDateChange(new Date(newDate))}
          />
          <Button variant="ghost" size="icon" onClick={handleNextDay}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="bg-white/50">
        <div className="space-y-4">
          {timeSlots.map((timeSlot) => (
            <TimelineSlot 
              key={timeSlot} 
              time={timeSlot} 
              tasks={scheduledTasks}
              selectedDate={selectedDate}
              onDateChange={onDateChange}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
