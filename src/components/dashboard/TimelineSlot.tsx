import { Task } from "./TaskBoard";
import { getPriorityColor } from "@/utils/taskColors";

interface TimelineSlotProps {
  time: string;
  task?: Task;
}

export function TimelineSlot({ time, task }: TimelineSlotProps) {
  const isTaskInTimeSlot = (task?: Task) => {
    if (!task || !task.start_time) return false;
    
    // Convert time strings to comparable format (HH:mm)
    const slotTime = time.padStart(5, '0'); // e.g., "9:00" -> "09:00"
    const taskTime = task.start_time;
    
    return slotTime === taskTime;
  };

  if (!isTaskInTimeSlot(task) || task?.status !== 'scheduled') {
    return (
      <div className="flex items-start gap-4">
        <div className="w-16 text-sm text-gray-500">{time}</div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-4">
      <div className="w-16 text-sm text-gray-500">{time}</div>
      <div
        className={`flex-1 p-2 rounded-lg text-white ${getPriorityColor(task.priority)}`}
      >
        <p className="font-medium">{task.title}</p>
        <p className="text-sm">{task.time}</p>
      </div>
    </div>
  );
}