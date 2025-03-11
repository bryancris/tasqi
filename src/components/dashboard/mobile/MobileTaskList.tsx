
import { DndContext, MouseSensor, TouchSensor, useSensor, useSensors, DragEndEvent, pointerWithin } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Task } from "../TaskBoard";
import { TaskCard } from "../TaskCard";

interface MobileTaskListProps {
  tasks: Task[];
  onDragEnd: (event: DragEndEvent) => void;
  onComplete: () => void;
}

export function MobileTaskList({ tasks, onDragEnd, onComplete }: MobileTaskListProps) {
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 8,
        distance: 5,
      },
    })
  );

  const draggableTaskIds = tasks
    .filter(task => task.status !== 'completed')
    .map(task => task.id);

  return (
    <DndContext 
      sensors={sensors} 
      onDragEnd={onDragEnd}
      collisionDetection={pointerWithin}
    >
      <SortableContext items={draggableTaskIds} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2 pb-4 pt-1">
          {tasks.map((task, index) => (
            <TaskCard
              key={task.id}
              task={task}
              index={index}
              isDraggable={task.status !== 'completed'}
              onComplete={onComplete}
            />
          ))}
          {tasks.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              No tasks available
            </div>
          )}
        </div>
      </SortableContext>
    </DndContext>
  );
}
