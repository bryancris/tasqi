import { useState } from "react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addDays, addWeeks, subWeeks } from "date-fns";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { WeeklyTaskCard } from "../task-card/WeeklyTaskCard";
import { cn } from "@/lib/utils";
import { useTasks } from "@/hooks/use-tasks";
import { DragDropContext, DropResult } from "react-beautiful-dnd";
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function MobileWeeklyView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showFullWeek, setShowFullWeek] = useState(true);
  const { tasks } = useTasks();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const weekStart = startOfWeek(currentDate, { weekStartsOn: showFullWeek ? 0 : 1 });
  const weekEnd = showFullWeek 
    ? endOfWeek(currentDate, { weekStartsOn: 0 })
    : addDays(weekStart, 4);
  
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const timeSlots = Array.from({ length: 12 }, (_, i) => {
    const hour = 8 + i;
    return {
      hour,
      display: `${hour}:00`
    };
  });

  const scheduledTasks = tasks?.filter(task => task.date && task.start_time) || [];

  const calculateTaskHeight = (startTime: string, endTime: string): number => {
    if (!startTime || !endTime) return 40;
    
    const startHour = parseInt(startTime.split(':')[0]);
    const startMinute = parseInt(startTime.split(':')[1]);
    
    const endHour = parseInt(endTime.split(':')[0]);
    const endMinute = parseInt(endTime.split(':')[1]);
    
    const durationMinutes = (endHour - startHour) * 60 + (endMinute - startMinute);
    
    return Math.max(20, (durationMinutes / 60) * 40);
  };

  const calculateTopOffset = (startTime: string): number => {
    if (!startTime) return 0;
    
    const minutes = parseInt(startTime.split(':')[1]);
    return (minutes / 60) * 40;
  };

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;
    
    if (!destination) return;
    
    try {
      const taskId = parseInt(draggableId, 10);
      
      const [dateStr, hourStr] = destination.droppableId.split('-');
      const hour = parseInt(hourStr);
      
      const { error } = await supabase
        .from('tasks')
        .update({
          date: dateStr,
          start_time: `${hour}:00`,
          end_time: `${hour + 1}:00`,
          status: 'scheduled'
        })
        .eq('id', taskId);
        
      if (error) throw error;
      
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
      
      toast({
        title: "Task updated",
        description: "The task has been successfully moved.",
      });
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Error updating task",
        description: "There was a problem updating the task.",
        variant: "destructive"
      });
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex flex-col h-full bg-white">
        <div className="flex items-center justify-between px-4 py-3 border-b bg-white sticky top-0 z-10">
          <h2 className="text-base font-semibold text-gray-700 truncate">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setShowFullWeek(!showFullWeek)}
              className="h-8 text-xs px-2 font-medium text-white bg-gradient-to-r from-[#0EA5E9] to-[#2A9BB5] border-2 border-[#0EA5E9]/50 hover:from-[#0990D3] hover:to-[#248A9F] hover:border-[#0EA5E9]/70"
            >
              {showFullWeek ? '7 Day' : '5 Day'}
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 bg-gradient-to-r from-[#B2E3EA] to-[#83C5D2] border border-[#83C5D2] hover:bg-[#EA384C] hover:border-[#EA384C] hover:from-transparent hover:to-transparent"
              onClick={() => setCurrentDate(prev => subWeeks(prev, 1))}
            >
              <ChevronLeft className="h-4 w-4 text-black hover:text-white" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 bg-gradient-to-r from-[#B2E3EA] to-[#83C5D2] border border-[#83C5D2] hover:bg-[#EA384C] hover:border-[#EA384C] hover:from-transparent hover:to-transparent"
              onClick={() => setCurrentDate(prev => addWeeks(prev, 1))}
            >
              <ChevronRight className="h-4 w-4 text-black hover:text-white" />
            </Button>
          </div>
        </div>

        <div className="grid border-b border-gray-300 bg-[#2A9BB5] rounded-t-lg" 
          style={{ 
            gridTemplateColumns: `40px repeat(${weekDays.length}, 1fr)` 
          }}>
          <div className="p-1 text-center border-r border-gray-300 bg-[#2EBDAE]" />
          {weekDays.map((day) => (
            <div key={day.toISOString()} className="p-1 text-center border-r border-gray-300 last:border-r-0">
              <div className="text-xs font-medium text-white/80">
                {format(day, 'EEE')}
              </div>
              <div className="text-xs font-medium text-white">
                {format(day, 'd')}
              </div>
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="min-w-full">
            <div className="grid" style={{ 
              gridTemplateColumns: `40px repeat(${weekDays.length}, 1fr)` 
            }}>
              <div className="sticky left-0 z-10 bg-[#2EBDAE]">
                {timeSlots.map((slot, idx) => (
                  <div
                    key={slot.hour}
                    className={cn(
                      "flex items-center justify-center border-r border-t border-gray-300 h-[40px] -mt-[1px] first:mt-0",
                      idx === timeSlots.length - 1 && "border-b border-gray-300"
                    )}
                  >
                    <span className="text-[10px] text-white font-medium">{slot.display}</span>
                  </div>
                ))}
              </div>

              {weekDays.map((day) => (
                <div key={day.toISOString()} className="relative border-r border-gray-300 last:border-r-0">
                  {timeSlots.map((slot, idx) => (
                    <div
                      key={`${day.toISOString()}-${slot.hour}`}
                      className={cn(
                        "relative border-t border-gray-300 h-[40px] -mt-[1px] first:mt-0",
                        idx === timeSlots.length - 1 && "border-b border-gray-300"
                      )}
                    >
                      {scheduledTasks
                        .filter(
                          (task) =>
                            task.date &&
                            format(new Date(task.date), "yyyy-MM-dd") ===
                              format(day, "yyyy-MM-dd") &&
                            task.start_time &&
                            parseInt(task.start_time.split(':')[0]) === slot.hour
                        )
                        .map((task) => {
                          const taskHeight = task.end_time ? 
                            calculateTaskHeight(task.start_time || '', task.end_time) : 40;
                          
                          const topOffset = calculateTopOffset(task.start_time || '');
                          
                          return (
                            <div 
                              key={task.id} 
                              className="absolute inset-x-0 p-0.5"
                              style={{
                                height: `${taskHeight}px`,
                                top: `${topOffset}px`,
                                zIndex: 10
                              }}
                            >
                              <WeeklyTaskCard task={task} />
                            </div>
                          );
                        })}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DragDropContext>
  );
}
