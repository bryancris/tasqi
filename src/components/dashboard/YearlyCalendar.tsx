import { Calendar } from "@/components/ui/calendar";
import { useState } from "react";

export function YearlyCalendar() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const currentYear = new Date().getFullYear();
  
  const months = Array.from({ length: 12 }, (_, i) => {
    const date = new Date(currentYear, i);
    return {
      month: date.toLocaleString('default', { month: 'long' }),
      year: date.getFullYear(),
      date: date
    };
  });

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      <div className="text-xl font-semibold mb-6">
        {currentYear} Calendar
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {months.map(({ month, date }) => (
          <div key={month} className="border rounded-lg p-4">
            <div className="text-lg font-medium mb-2">{month}</div>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              month={date}
              className="w-full"
              disabled
              showOutsideDays={false}
            />
          </div>
        ))}
      </div>
    </div>
  );
}