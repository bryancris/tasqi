import { Task } from "./TaskBoard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskCard } from "./TaskCard";
import { DndContext, MouseSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useTaskReorder } from "@/hooks/use-task-reorder";
import { startOfDay, isAfter } from "date-fns";

export interface MobileTaskViewProps {
  tasks: Task[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export function MobileTaskView({ tasks, selectedDate, onDateChange }: MobileTaskViewProps) {
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
    <div className="h-[calc(100vh-144px)] overflow-hidden">
      <Card className="h-full border-none shadow-none bg-transparent">
        <CardHeader className="pb-3 px-1">
          <CardTitle className="text-2xl font-semibold">Task Board</CardTitle>
        </CardHeader>
        <CardContent className="overflow-y-auto h-[calc(100%-5rem)] p-1">
          <DndContext sensors={sensors} onDragEnd={handleReorder}>
            <SortableContext items={draggableTaskIds} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col gap-[1px]">
                {sortedTasks.map((task, index) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    index={index}
                    isMobile={true}
                    isDraggable={task.status !== 'completed'}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </CardContent>
      </Card>
    </div>
  );
}