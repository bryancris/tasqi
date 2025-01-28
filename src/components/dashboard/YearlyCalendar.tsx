import { Calendar } from "@/components/ui/calendar";
import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Task } from "./TaskBoard";
import { format } from "date-fns";

export function YearlyCalendar() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const currentYear = new Date().getFullYear();
  
  // Fetch all tasks for the year
  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', currentYear],
    queryFn: async () => {
      const startDate = `${currentYear}-01-01`;
      const endDate = `${currentYear}-12-31`;
      
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate);
      
      if (error) throw error;
      return data as Task[];
    },
  });

  const months = Array.from({ length: 12 }, (_, i) => {
    const date = new Date(currentYear, i);
    return {
      month: date.toLocaleString('default', { month: 'long' }),
      year: date.getFullYear(),
      date: date
    };
  });

  // Function to get tasks for a specific date
  const getTasksForDate = (date: Date) => {
    return tasks.filter(task => {
      if (!task.date) return false;
      return task.date === format(date, 'yyyy-MM-dd');
    });
  };

  // Function to get the color class based on task count
  const getDateColorClass = (date: Date) => {
    const taskCount = getTasksForDate(date).length;
    if (taskCount === 0) return '';
    if (taskCount >= 7) return 'ring-[#ea384c] ring-2';
    if (taskCount >= 4) return 'ring-[#F97316] ring-2';
    return 'ring-[#0FA0CE] ring-2';
  };

  // Array of gradient backgrounds for variety
  const gradients = [
    'bg-gradient-to-br from-rose-50 to-teal-50',
    'bg-gradient-to-br from-purple-50 to-pink-50',
    'bg-gradient-to-br from-blue-50 to-indigo-50',
    'bg-gradient-to-br from-green-50 to-emerald-50',
    'bg-gradient-to-br from-amber-50 to-yellow-50',
    'bg-gradient-to-br from-sky-50 to-cyan-50',
    'bg-gradient-to-br from-violet-50 to-purple-50',
    'bg-gradient-to-br from-pink-50 to-rose-50',
    'bg-gradient-to-br from-teal-50 to-emerald-50',
    'bg-gradient-to-br from-indigo-50 to-violet-50',
    'bg-gradient-to-br from-cyan-50 to-blue-50',
    'bg-gradient-to-br from-emerald-50 to-green-50'
  ];

  return (
    <div className="w-full max-w-7xl mx-auto p-6 bg-white/50 min-h-screen">
      <Card className="border-none shadow-none bg-transparent">
        <CardHeader>
          <h2 className="text-3xl font-bold text-center text-gray-800">
            {currentYear} Calendar
          </h2>
          <p className="text-center text-gray-600 mt-2">
            Yearly overview of your schedule
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {months.map(({ month, date }, index) => (
              <Card 
                key={month} 
                className={`${gradients[index]} border border-gray-100 shadow-md hover:shadow-lg transition-shadow duration-300`}
              >
                <CardHeader className="pb-2">
                  <h3 className="text-lg font-semibold text-gray-800">{month}</h3>
                </CardHeader>
                <CardContent className="pt-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    month={date}
                    className="w-full"
                    disabled
                    showOutsideDays={false}
                    modifiers={{
                      taskDay: (date) => getTasksForDate(date).length > 0
                    }}
                    modifiersStyles={{
                      taskDay: (date) => ({
                        borderRadius: '50%',
                        ...getDateColorClass(date)
                      })
                    }}
                    classNames={{
                      months: "space-y-4",
                      month: "space-y-4",
                      caption: "flex justify-center pt-1 relative items-center",
                      caption_label: "text-sm font-medium",
                      nav: "space-x-1 flex items-center",
                      nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                      nav_button_previous: "absolute left-1",
                      nav_button_next: "absolute right-1",
                      table: "w-full border-collapse space-y-1",
                      head_row: "flex",
                      head_cell: "text-gray-500 rounded-md w-8 font-normal text-[0.8rem] dark:text-gray-400",
                      row: "flex w-full mt-2",
                      cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent dark:[&:has([aria-selected])]:bg-accent",
                      day: "h-8 w-8 p-0 font-normal aria-selected:opacity-100",
                      day_range_end: "day-range-end",
                      day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                      day_today: "bg-accent text-accent-foreground",
                      day_outside: "opacity-50",
                      day_disabled: "text-gray-400",
                      day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                      day_hidden: "invisible",
                    }}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}