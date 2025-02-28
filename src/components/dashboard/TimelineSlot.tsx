
import { Task } from "./TaskBoard";
import { format, isSameDay, parseISO } from "date-fns";
import { EditTaskDrawer } from "./EditTaskDrawer";
import { useState } from "react";
import { getPriorityColor } from "@/utils/taskColors";
import { cn } from "@/lib/utils";

interface TimelineSlotProps {
  time: string;
  tasks: Task[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export function TimelineSlot({ time, tasks, selectedDate }: TimelineSlotProps) {
  const [editTask, setEditTask] = useState<Task | null>(null);

  // Filter tasks that match this time slot
  const slotTasks = tasks.filter(task => {
    if (!task.start_time || !task.date) return false;
    
    const taskDate = parseISO(task.date);
    const taskHour = task.start_time.split(':')[0];
    const slotHour = time.split(':')[0];
    
    return taskHour === slotHour && isSameDay(taskDate, selectedDate);
  });

  const hour = parseInt(time.split(':')[0], 10);
  // Determine if this is a current hour (for highlighting)
  const currentHour = new Date().getHours() === hour && isSameDay(selectedDate, new Date());
  
  return (
    <div 
      className={cn(
        "flex items-start gap-4 p-3 border-b border-[#2EBDAE]/10 last:border-0 transition-colors",
        currentHour ? "bg-gradient-to-r from-[#2EBDAE]/5 to-[#3E8DE3]/5" : "hover:bg-white/30",
        "rounded-md"
      )}
    >
      <div className={cn(
        "w-16 text-sm font-medium",
        currentHour ? "text-[#2EBDAE]" : "text-gray-500"
      )}>
        {time}
      </div>
      <div className="flex-1 space-y-2">
        {slotTasks.map((task) => (
          <div
            key={task.id}
            onClick={() => setEditTask(task)}
            className={`${
              task.status === 'completed' 
                ? 'bg-[#8E9196]'
                : getPriorityColor(task.priority)
            } p-3 rounded-lg text-white cursor-pointer transition-all hover:brightness-110 shadow-sm hover:shadow-md hover:-translate-y-0.5`}
          >
            <p className="font-medium">{task.title}</p>
            {task.start_time && task.end_time && (
              <p className="text-sm opacity-90">
                {task.start_time} - {task.end_time}
              </p>
            )}
          </div>
        ))}
        {slotTasks.length === 0 && (
          <div className="h-1 w-full rounded-full bg-gradient-to-r from-[#2EBDAE]/10 to-[#3E8DE3]/10"></div>
        )}
        {editTask && (
          <EditTaskDrawer
            task={editTask}
            open={!!editTask}
            onOpenChange={() => setEditTask(null)}
          />
        )}
      </div>
    </div>
  );
}
