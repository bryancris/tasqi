import { Task } from "../TaskBoard";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface UnscheduledTasksProps {
  tasks: Task[];
}

export function UnscheduledTasks({ tasks }: UnscheduledTasksProps) {
  const getTaskColor = (task: Task) => {
    switch (task.priority) {
      case 'high':
        return 'bg-red-100 border-red-200 text-red-900';
      case 'medium':
        return 'bg-green-100 border-green-200 text-green-900';
      case 'low':
        return 'bg-blue-100 border-blue-200 text-blue-900';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-900';
    }
  };

  return (
    <div className="w-[300px]">
      <div className="bg-white rounded-lg shadow-sm border p-4 mt-[72px]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Unscheduled</h3>
          <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-sm">
            {tasks.length}
          </span>
        </div>
        <div className="space-y-2">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={cn(
                "p-3 rounded-md text-sm border",
                getTaskColor(task)
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-medium">{task.title}</span>
                {task.reminder_enabled && (
                  <X className="w-4 h-4 text-red-500 flex-shrink-0" />
                )}
              </div>
              {task.description && (
                <p className="text-gray-600 text-xs mt-1">{task.description}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}