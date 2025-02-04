
import { Task } from "../TaskBoard";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { getPriorityColor } from "@/utils/taskColors";
import { useDraggable } from "@dnd-kit/core";
import { useState } from "react";
import { EditTaskDrawer } from "../EditTaskDrawer";

interface UnscheduledTasksProps {
  tasks: Task[];
}

function DraggableTask({ task }: { task: Task }) {
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id.toString(),
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    opacity: isDragging ? 0.5 : 1,
  } : undefined;

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...listeners}
        {...attributes}
        onClick={() => setIsEditDrawerOpen(true)}
        className={cn(
          "p-3 rounded-md text-sm text-white cursor-move",
          getPriorityColor(task.priority)
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <span className="font-medium">{task.title}</span>
          {task.reminder_enabled && (
            <X className="w-4 h-4 text-white/90 flex-shrink-0" />
          )}
        </div>
        {task.description && (
          <p className="text-white/90 text-xs mt-1">{task.description}</p>
        )}
      </div>
      <EditTaskDrawer 
        task={task} 
        open={isEditDrawerOpen} 
        onOpenChange={setIsEditDrawerOpen} 
      />
    </>
  );
}

export function UnscheduledTasks({ tasks }: UnscheduledTasksProps) {
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
            <DraggableTask key={task.id} task={task} />
          ))}
        </div>
      </div>
    </div>
  );
}
