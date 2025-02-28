
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TimelineSlot } from "../TimelineSlot";
import { Task } from "../TaskBoard";
import { supabase } from "@/integrations/supabase/client";
import { format, isSameDay, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { DateSelector } from "../schedule/DateSelector";
import { useTimelineTasks } from "@/hooks/use-timeline-tasks";
import { cn } from "@/lib/utils";

interface DesktopTimelineSectionProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export function DesktopTimelineSection({ selectedDate, onDateChange }: DesktopTimelineSectionProps) {
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
    <Card className="h-full border-none shadow-sm overflow-hidden bg-gradient-to-bl from-[#3E8DE3]/2 to-[#2EBDAE]/2">
      <CardHeader className="bg-gradient-to-r from-[#2EBDAE] to-[#3E8DE3] p-0 border-none">
        <div className="p-4 flex flex-col space-y-3">
          <CardTitle className="text-white text-xl font-semibold tracking-wide">Timeline</CardTitle>
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handlePrevDay}
              className="h-9 w-9 rounded-full text-white hover:bg-white/20 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            
            <div className="relative flex items-center justify-center bg-white/10 backdrop-blur-sm px-4 py-2.5 rounded-full border border-white/20 shadow-sm min-w-[200px]">
              <Calendar className="h-4 w-4 text-white/90 mr-2.5" />
              <DateSelector 
                date={format(selectedDate, 'yyyy-MM-dd')}
                onDateChange={(newDate) => onDateChange(new Date(newDate))}
                className="text-white font-medium text-sm"
              />
            </div>
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleNextDay}
              className="h-9 w-9 rounded-full text-white hover:bg-white/20 transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className={cn(
        "p-0 bg-white/95 backdrop-blur-sm",
        "max-h-[calc(100vh-16rem)]",
        "overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
      )}>
        <div className="space-y-0.5 p-4">
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
