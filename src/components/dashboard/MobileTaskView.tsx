
import { Task } from "./TaskBoard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskCard } from "./TaskCard";
import { DndContext, MouseSensor, TouchSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { startOfDay, isAfter, isSameDay } from "date-fns";

export interface MobileTaskViewProps {
  tasks: Task[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onDragEnd: (event: DragEndEvent) => void;
  onComplete?: () => void;
}

export function MobileTaskView({ tasks, selectedDate, onDateChange, onDragEnd, onComplete }: MobileTaskViewProps) {
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

  const shouldShowTask = (task: Task) => {
    // Always show unscheduled tasks
    if (task.status === 'unscheduled') return true;
    
    // For completed tasks, check if they were completed today
    if (task.status === 'completed') {
      return shouldShowCompletedTask(task);
    }
    
    // For scheduled tasks, check if they're scheduled for today
    if (task.status === 'scheduled' && task.date) {
      return isSameDay(new Date(task.date), todayStart);
    }
    
    return false;
  };

  const sortedTasks = [...tasks]
    .filter(shouldShowTask)
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
          <DndContext sensors={sensors} onDragEnd={onDragEnd}>
            <SortableContext items={draggableTaskIds} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col gap-[1px]">
                {sortedTasks.map((task, index) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    index={index}
                    isDraggable={task.status !== 'completed'}
                    onComplete={onComplete}
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
