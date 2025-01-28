import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Task } from "./TaskBoard";
import { MonthCard } from "./calendar/MonthCard";

interface YearlyCalendarProps {
  onDateSelect?: (date: Date) => void;
}

export function YearlyCalendar({ onDateSelect }: YearlyCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const currentYear = new Date().getFullYear();
  
  // Generate months array for the calendar grid
  const months = Array.from({ length: 12 }, (_, i) => {
    const date = new Date(currentYear, i);
    return {
      month: date.toLocaleString('default', { month: 'long' }),
      year: date.getFullYear(),
      date: date
    };
  });
  
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

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    if (onDateSelect) {
      onDateSelect(date);
    }
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
              <MonthCard
                key={month}
                month={month}
                date={date}
                selectedDate={selectedDate}
                onSelect={handleDateSelect}
                gradientClass={gradients[index]}
                tasks={tasks}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}