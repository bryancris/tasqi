import { Task } from "./TaskBoard";
import { getPriorityColor } from "@/utils/taskColors";

interface TimelineSlotProps {
  time: string;
  tasks: Task[];
}

export function TimelineSlot({ time, tasks }: TimelineSlotProps) {
  const tasksToShow = tasks.filter(task => 
    task.status === 'scheduled' && 
    task.start_time && 
    task.start_time.startsWith(time.split(':')[0])
  );

  if (tasksToShow.length === 0) {
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
        {tasksToShow.map((task) => (
          <div
            key={task.id}
            className={`p-2 rounded-lg text-white ${getPriorityColor(task.priority)}`}
          >
            <p className="font-medium">{task.title}</p>
            {task.start_time && task.end_time && (
              <p className="text-sm">{`${task.start_time} - ${task.end_time}`}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}