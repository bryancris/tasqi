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

  // Array of darker gradient backgrounds with border colors
  const gradients = [
    'bg-gradient-to-br from-[#1A1F2C] to-[#2A2F3C] border-[#C8C8C9]',
    'bg-gradient-to-br from-[#222222] to-[#333333] border-[#9F9EA1]',
    'bg-gradient-to-br from-[#403E43] to-[#504E53] border-[#C8C8C9]',
    'bg-gradient-to-br from-[#1A1F2C] to-[#2A2F3C] border-[#aaadb0]',
    'bg-gradient-to-br from-[#222222] to-[#333333] border-[#C8C8C9]',
    'bg-gradient-to-br from-[#403E43] to-[#504E53] border-[#9F9EA1]',
    'bg-gradient-to-br from-[#1A1F2C] to-[#2A2F3C] border-[#aaadb0]',
    'bg-gradient-to-br from-[#222222] to-[#333333] border-[#C8C8C9]',
    'bg-gradient-to-br from-[#403E43] to-[#504E53] border-[#9F9EA1]',
    'bg-gradient-to-br from-[#1A1F2C] to-[#2A2F3C] border-[#aaadb0]',
    'bg-gradient-to-br from-[#222222] to-[#333333] border-[#C8C8C9]',
    'bg-gradient-to-br from-[#403E43] to-[#504E53] border-[#9F9EA1]'
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
                gradientClass={`${gradients[index]} border-2`}
                tasks={tasks}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}