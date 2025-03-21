
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

  // Array of soft gradient backgrounds with border colors
  const gradients = [
    'bg-gradient-to-br from-[#F2FCE2] to-[#E5F7D3] border-[#C8C8C9]',
    'bg-gradient-to-br from-[#FEF7CD] to-[#FDF2B8] border-[#9F9EA1]',
    'bg-gradient-to-br from-[#FEC6A1] to-[#FDB892] border-[#C8C8C9]',
    'bg-gradient-to-br from-[#E5DEFF] to-[#D3CCFA] border-[#aaadb0]',
    'bg-gradient-to-br from-[#FFDEE2] to-[#FFD0D6] border-[#C8C8C9]',
    'bg-gradient-to-br from-[#FDE1D3] to-[#FCD3C4] border-[#9F9EA1]',
    'bg-gradient-to-br from-[#D3E4FD] to-[#C4D9FA] border-[#aaadb0]',
    'bg-gradient-to-br from-[#F1F0FB] to-[#E5E4F5] border-[#C8C8C9]',
    'bg-gradient-to-br from-[#F2FCE2] to-[#E5F7D3] border-[#9F9EA1]',
    'bg-gradient-to-br from-[#FEF7CD] to-[#FDF2B8] border-[#aaadb0]',
    'bg-gradient-to-br from-[#E5DEFF] to-[#D3CCFA] border-[#C8C8C9]',
    'bg-gradient-to-br from-[#D3E4FD] to-[#C4D9FA] border-[#9F9EA1]'
  ];

  return (
    <Card className="w-full h-full mx-auto shadow-sm">
      <CardHeader className="pb-0 text-center">
        <h2 className="text-3xl font-bold text-gray-800">
          {currentYear} Calendar
        </h2>
        <p className="text-gray-600 mt-2">
          Yearly overview of your schedule
        </p>
      </CardHeader>
      
      <CardContent className="pt-6 h-[calc(100%-120px)] overflow-auto">
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
  );
}
