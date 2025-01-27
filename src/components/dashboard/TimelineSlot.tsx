import { Task } from "./TaskBoard";

interface TimelineSlotProps {
  time: string;
  task?: Task;
}

const getPriorityColor = (priority?: string) => {
  switch (priority) {
    case 'low':
      return 'bg-emerald-400';
    case 'medium':
      return 'bg-orange-400';
    case 'high':
      return 'bg-red-500';
    default:
      return 'bg-emerald-400';
  }
};

export function TimelineSlot({ time, task }: TimelineSlotProps) {
  if (!task || task.status !== 'scheduled') return (
    <div className="flex items-start gap-4">
      <div className="w-16 text-sm text-gray-500">{time}</div>
    </div>
  );

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