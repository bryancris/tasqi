import { Task } from "../TaskBoard";
import { useDroppable } from "@dnd-kit/core";
import { TaskCard } from "../TaskCard";

interface UnscheduledTasksProps {
  tasks: Task[];
}

export function UnscheduledTasks({ tasks }: UnscheduledTasksProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'unscheduled',
    data: {
      type: 'unscheduled'
    }
  });

  return (
    <div 
      ref={setNodeRef}
      className="w-80 bg-white rounded-lg shadow-sm border border-gray-200 p-4 h-fit"
    >
      <h3 className="font-medium text-gray-900 mb-4">Unscheduled Tasks</h3>
      <div className="space-y-2">
        {tasks && tasks.length > 0 ? (
          tasks.map((task, index) => (
            <div key={task.id} className="bg-[#0EA5E9] bg-opacity-10 hover:bg-opacity-20 transition-colors rounded-lg">
              <TaskCard 
                task={task} 
                index={index}
                isDraggable={true}
              />
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-500">No unscheduled tasks</p>
        )}
      </div>
    </div>
  );
}