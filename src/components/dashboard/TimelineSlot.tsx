
import { Task } from "./TaskBoard";
import { format, isSameDay, parseISO } from "date-fns";
import { EditTaskDrawer } from "./EditTaskDrawer";
import { useState } from "react";
import { getPriorityColor } from "@/utils/taskColors";

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

  return (
    <div className="flex items-start gap-4">
      <div className="w-16 text-sm text-gray-500">{time}</div>
      <div className="flex-1 space-y-2">
        {slotTasks.map((task) => (
          <div
            key={task.id}
            onClick={() => setEditTask(task)}
            className={`${
              task.status === 'completed' 
                ? 'bg-[#8E9196]'
                : getPriorityColor(task.priority)
            } p-2 rounded-lg text-white cursor-pointer transition-all hover:brightness-110`}
          >
            <p className="font-medium">{task.title}</p>
            {task.start_time && task.end_time && (
              <p className="text-sm opacity-90">
                {task.start_time} - {task.end_time}
              </p>
            )}
          </div>
        ))}
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
