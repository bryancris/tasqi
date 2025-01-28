import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Task } from "../TaskBoard";
import { format } from "date-fns";

interface MonthCardProps {
  month: string;
  date: Date;
  selectedDate: Date;
  onSelect: (date: Date | undefined) => void;
  gradientClass: string;
  tasks: Task[];
}

export function MonthCard({ 
  month, 
  date, 
  selectedDate, 
  onSelect, 
  gradientClass,
  tasks 
}: MonthCardProps) {
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
    if (taskCount >= 7) return '#ea384c';
    if (taskCount >= 4) return '#F97316';
    return '#0FA0CE';
  };

  return (
    <Card className={`${gradientClass} border border-gray-100 shadow-md hover:shadow-lg transition-shadow duration-300`}>
      <CardHeader className="pb-2">
        <h3 className="text-lg font-semibold text-gray-800">{month}</h3>
      </CardHeader>
      <CardContent className="pt-0">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={onSelect}
          month={date}
          className="w-full"
          disabled
          showOutsideDays={false}
          modifiers={{
            taskDay: (date) => getTasksForDate(date).length > 0
          }}
          modifiersStyles={{
            taskDay: {
              borderRadius: '50%',
              border: '2px solid',
              borderColor: getDateColorClass(selectedDate)
            }
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
  );
}