import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useClock } from "@/hooks/use-clock";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Task } from "./TaskBoard";

export function Calendar() {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const { currentTime, currentDate } = useClock();

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const monthYear = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Fetch tasks from Supabase
  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('status', 'scheduled');
      
      if (error) throw error;
      return data as Task[];
    },
  });

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-2xl font-bold">{monthYear}</h2>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={previousMonth}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={nextMonth}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="border rounded-lg bg-white shadow-sm overflow-hidden">
        <div className="grid grid-cols-7 gap-px bg-gray-200 border-b">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
            <div key={day} className="bg-white p-2 text-sm font-medium text-gray-500 text-center">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-px bg-gray-200">
          {Array.from({ length: 42 }, (_, i) => {
            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i - currentMonth.getDay() + 2);
            const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
            const isToday = new Date().toDateString() === date.toDateString();
            
            // Filter tasks for this day
            const dayTasks = tasks.filter(task => {
              if (!task.date) return false;
              const taskDate = new Date(task.date);
              return taskDate.toDateString() === date.toDateString();
            });

            return (
              <div
                key={i}
                className={`min-h-[120px] bg-white p-2 ${
                  !isCurrentMonth ? 'text-gray-400' : ''
                } ${isToday ? 'bg-blue-50' : ''}`}
              >
                <div className="flex justify-between items-start">
                  <span className={`text-sm font-medium ${
                    isToday ? 'h-6 w-6 bg-blue-600 text-white rounded-full flex items-center justify-center' : ''
                  }`}>
                    {date.getDate()}
                  </span>
                </div>
                <div className="mt-1 space-y-1">
                  {dayTasks.slice(0, 3).map((task) => (
                    <div
                      key={task.id}
                      className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-700 truncate"
                    >
                      {task.start_time && (
                        <span className="font-medium">
                          {new Date(`2000-01-01T${task.start_time}`).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit',
                            hour12: true 
                          })}
                        </span>
                      )}
                      <span className="ml-1">{task.title}</span>
                    </div>
                  ))}
                  {dayTasks.length > 3 && (
                    <div className="text-xs text-gray-500">
                      +{dayTasks.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}