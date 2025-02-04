import { useDroppable } from "@dnd-kit/core";
import { format, isSameDay, parseISO } from "date-fns";
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
}

export const DayCell = ({ day, timeSlot, tasks }: DayCellProps) => {
  const { setNodeRef } = useDroppable({
    id: `${format(day, 'yyyy-MM-dd')}-${timeSlot.hour}`,
  });

  const dayTasks = tasks.filter(task => {
    if (!task.date || !task.start_time) return false;
    const taskDate = parseISO(task.date);
    const taskHour = parseInt(task.start_time.split(':')[0]);
    const isMatchingDay = isSameDay(taskDate, day);
    const isMatchingTime = taskHour === timeSlot.hour;
    return isMatchingDay && isMatchingTime;
  });

  return (
    <div 
      ref={setNodeRef}
      className={cn(
        "pl-0.5 pr-1 py-1",
        "relative",
        "transition-colors",
        "border-r border-gray-300 last:border-r-0",
        "hover:bg-gray-50/50"
      )}
    >
      {dayTasks.map((task) => (
        <DraggableTask key={task.id} task={task} />
      ))}
    </div>
  );
};