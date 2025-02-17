
import { Task } from "./TaskBoard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskCard } from "./TaskCard";
import { DndContext, MouseSensor, TouchSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { startOfDay, isAfter } from "date-fns";
import { AddTaskDrawer } from "./AddTaskDrawer";

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

  // Modified filtering logic to show all unscheduled and today's scheduled tasks
  const sortedTasks = [...tasks]
    .filter(task => {
      // Always show unscheduled tasks
      if (task.status === 'unscheduled') {
        return true;
      }
      
      // For completed tasks, check if they were completed today
      if (task.status === 'completed') {
        return shouldShowCompletedTask(task);
      }
      
      // For scheduled tasks, show all of them
      return task.status === 'scheduled';
    })
    .sort((a, b) => {
      if (a.status === 'completed' && b.status !== 'completed') return 1;
      if (a.status !== 'completed' && b.status === 'completed') return -1;
      return (a.position || 0) - (b.position || 0);
    });

  const draggableTaskIds = sortedTasks
    .filter(task => task.status !== 'completed')
    .map(task => task.id);

  return (
    <div className="flex flex-col h-full">
      {/* Add Task Button - Fixed at the bottom */}
      <div className="fixed bottom-[80px] left-0 right-0 px-4 z-50 pb-2 bg-gradient-to-t from-[#F1F0FB] via-[#F1F0FB] to-transparent pt-4">
        <AddTaskDrawer />
      </div>

      {/* Task List - With padding at the bottom to prevent button overlap */}
      <div className="flex-1 pb-[140px]">
        <Card className="h-full border-none shadow-none bg-transparent">
          <CardHeader className="pb-3 px-1">
            <CardTitle className="text-2xl font-semibold">Task Board</CardTitle>
          </CardHeader>
          <CardContent className="p-1">
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
    </div>
  );
}
