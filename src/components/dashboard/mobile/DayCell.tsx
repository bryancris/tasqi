
import { useDroppable } from "@dnd-kit/core";
import { format, parseISO } from "date-fns";
import { Task } from "../TaskBoard";
import { DraggableTask } from "./DraggableTask";
import { cn } from "@/lib/utils";

interface DayCellProps {
  day: Date;
  timeSlot: {
    hour: number;
    display: string;
  };
  tasks: Task[];
  isLastRow?: boolean;
  isLastColumn?: boolean;
}

export const DayCell = ({ day, timeSlot, tasks, isLastRow, isLastColumn }: DayCellProps) => {
  const formattedDate = format(day, 'yyyy-MM-dd');
  
  const { setNodeRef, isOver } = useDroppable({
    id: `${formattedDate}-${timeSlot.hour}`,
    data: {
      date: formattedDate,
      hour: timeSlot.hour
    }
  });

  // Filter tasks for this specific day and time slot
  const dayTasks = tasks.filter(task => {
    if (!task.date || !task.start_time) return false;
    
    const taskDate = format(parseISO(task.date), 'yyyy-MM-dd');
    const taskHour = parseInt(task.start_time.split(':')[0]);
    
    return taskDate === formattedDate && taskHour === timeSlot.hour;
  });

  return (
    <div 
      ref={setNodeRef}
      className={cn(
        "pl-0.5 pr-1 py-1",
        "relative",
        "transition-colors",
        "border-r border-gray-300 last:border-r-0",
        isOver ? "bg-blue-50" : "hover:bg-gray-50/50",
        isLastRow && isLastColumn ? "rounded-br-lg" : "",
        isLastRow ? "border-b-0" : ""
      )}
    >
      {dayTasks.map((task) => (
        <DraggableTask key={task.id} task={task} />
      ))}
    </div>
  );
};
