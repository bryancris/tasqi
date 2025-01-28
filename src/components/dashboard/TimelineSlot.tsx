import { Task } from "./TaskBoard";
import { getPriorityColor } from "@/utils/taskColors";

interface TimelineSlotProps {
  time: string;
  tasks: Task[];
}

export function TimelineSlot({ time, tasks }: TimelineSlotProps) {
  if (tasks.length === 0) {
    return (
      <div className="flex items-start gap-4">
        <div className="w-16 text-sm text-gray-500">{time}</div>
        <div className="flex-1 min-h-[2rem]"></div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-4">
      <div className="w-16 text-sm text-gray-500">{time}</div>
      <div className="flex-1 space-y-2">
        {tasks.map((task) => (
          <div
            key={task.id}
            className={`p-2 rounded-lg text-white ${getPriorityColor(task.priority)}`}
          >
            <p className="font-medium">{task.title}</p>
            <p className="text-sm">{task.time}</p>
          </div>
        ))}
      </div>
    </div>
  );
}