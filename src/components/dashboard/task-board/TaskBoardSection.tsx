import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskCard } from "../TaskCard";
import { Task } from "../TaskBoard";
import { DndContext, MouseSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useTaskReorder } from "@/hooks/use-task-reorder";
import { startOfDay, isAfter } from "date-fns";

interface TaskBoardSectionProps {
  tasks: Task[];
}

export function TaskBoardSection({ tasks }: TaskBoardSectionProps) {
  const { handleDragEnd: handleReorder } = useTaskReorder(tasks);
  const todayStart = startOfDay(new Date());

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  const shouldShowCompletedTask = (task: Task) => {
    return task.completed_at && isAfter(new Date(task.completed_at), todayStart);
  };

  const sortedTasks = [...tasks]
    .filter(task => task.status !== 'completed' || shouldShowCompletedTask(task))
    .sort((a, b) => {
      if (a.status === 'completed' && b.status !== 'completed') return 1;
      if (a.status !== 'completed' && b.status === 'completed') return -1;
      return (a.position || 0) - (b.position || 0);
    });

  const draggableTaskIds = sortedTasks
    .filter(task => task.status !== 'completed')
    .map(task => task.id);

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl font-semibold">Task Board</CardTitle>
      </CardHeader>
      <CardContent>
        <DndContext sensors={sensors} onDragEnd={handleReorder}>
          <SortableContext items={draggableTaskIds} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-4 min-h-[600px] pb-40 relative">
              {sortedTasks.map((task, index) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  index={index}
                  isDraggable={task.status !== 'completed'}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </CardContent>
    </Card>
  );
}