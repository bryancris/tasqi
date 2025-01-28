import { Task } from "./TaskBoard";
import { getPriorityColor } from "@/utils/taskColors";

interface TimelineSlotProps {
  time: string;
  task?: Task;
}

export function TimelineSlot({ time, task }: TimelineSlotProps) {
  const isTaskInTimeSlot = (task?: Task) => {
    if (!task || !task.start_time) return false;
    
    // Format the time slot to match the task time format (HH:00)
    const hour = time.split(':')[0].padStart(2, '0');
    const formattedSlotTime = `${hour}:00`;
    
    // Compare with task start time
    return task.start_time === formattedSlotTime;
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