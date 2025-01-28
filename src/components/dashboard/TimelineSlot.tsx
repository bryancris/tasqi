import { Task } from "./TaskBoard";
import { getPriorityColor } from "@/utils/taskColors";

interface TimelineSlotProps {
  time: string;
  task?: Task;
}

export function TimelineSlot({ time, task }: TimelineSlotProps) {
  // Convert time string to 24-hour format for comparison
  const timeSlotHour = parseInt(time.split(':')[0]);
  
  const isTaskInTimeSlot = (task?: Task) => {
    if (!task || !task.start_time) return false;
    const taskStartHour = parseInt(task.start_time.split(':')[0]);
    return taskStartHour === timeSlotHour;
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