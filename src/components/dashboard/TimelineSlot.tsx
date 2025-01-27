interface TimelineSlotProps {
  time: string;
  task?: {
    id: number;
    title: string;
    time: string;
    color: string;
  };
}

export function TimelineSlot({ time, task }: TimelineSlotProps) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-16 text-sm text-gray-500">{time}</div>
      {task && (
        <div
          className={`flex-1 p-2 rounded-lg ${task.color}`}
        >
          <p className="font-medium">{task.title}</p>
          <p className="text-sm">{task.time}</p>
        </div>
      )}
    </div>
  );
}