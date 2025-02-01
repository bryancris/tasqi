import { Task } from "../TaskBoard";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { getPriorityColor } from "@/utils/taskColors";
import { Draggable, Droppable } from "react-beautiful-dnd";

interface UnscheduledTasksProps {
  tasks: Task[];
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
        <Droppable droppableId="unscheduled">
          {(provided) => (
            <div 
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="space-y-2"
            >
              {tasks.map((task, index) => (
                <Draggable
                  key={task.id}
                  draggableId={task.id.toString()}
                  index={index}
                >
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={cn(
                        "p-3 rounded-md text-sm text-white bg-[#0EA5E9] hover:bg-[#0284C7] transition-colors"
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
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </div>
    </div>
  );
}