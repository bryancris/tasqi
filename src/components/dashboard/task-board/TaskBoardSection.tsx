
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Task } from "../TaskBoard";
import { DndContext, MouseSensor, TouchSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { startOfDay, parseISO, isSameDay, isAfter } from "date-fns";
import { TaskCard } from "../TaskCard";
import { TaskLegend } from "../TaskLegend";
import { QueryObserverResult } from "@tanstack/react-query";

interface TaskBoardSectionProps {
  tasks: Task[];
  selectedDate: Date; // Added selectedDate prop
  onDragEnd: (event: DragEndEvent) => void;
  onComplete?: () => void | Promise<QueryObserverResult<Task[], Error>>;
}

export function TaskBoardSection({ tasks, selectedDate, onDragEnd, onComplete }: TaskBoardSectionProps) {
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

  // Get today's date at start of day in local timezone
  const today = startOfDay(new Date());

  const shouldShowCompletedTask = (task: Task) => {
    return task.completed_at && isAfter(new Date(task.completed_at), today);
  };

  const filterTasks = (task: Task) => {
    try {
      // Always show unscheduled tasks
      if (task.status === 'unscheduled') return true;
      
      // Show completed tasks from today
      if (task.status === 'completed') {
        return shouldShowCompletedTask(task);
      }
      
      // For scheduled, in_progress, and stuck tasks, check the date
      if (task.status === 'scheduled' || task.status === 'in_progress' || task.status === 'stuck') {
        // If task has no date, don't show it (should be handled as unscheduled)
        if (!task.date) return false;
        
        // Show tasks that match the selected date
        return isSameDay(parseISO(task.date), selectedDate);
      }
      
      return false;
    } catch (error) {
      console.error("Error filtering task:", error, task);
      return false;
    }
  };

  const sortedTasks = [...tasks]
    .filter(filterTasks)
    .sort((a, b) => {
      if (a.status === 'completed' && b.status !== 'completed') return 1;
      if (a.status !== 'completed' && b.status === 'completed') return -1;
      return (a.position || 0) - (b.position || 0);
    });

  const draggableTaskIds = sortedTasks
    .filter(task => task.status !== 'completed')
    .map(task => task.id);

  return (
    <Card className="flex flex-col h-full overflow-hidden border-none bg-gradient-to-br from-[#E0EAF5] to-[#F7FAFD] shadow-sm">
      <CardHeader className="border-b px-6 py-4 bg-white/70">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold">Task Board</CardTitle>
        </div>
        <TaskLegend />
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-6 bg-white/50">
        <DndContext sensors={sensors} onDragEnd={onDragEnd}>
          <SortableContext items={draggableTaskIds} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-4">
              {sortedTasks.map((task, index) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  index={index}
                  isDraggable={task.status !== 'completed'}
                  onComplete={onComplete}
                />
              ))}
              {sortedTasks.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  No tasks available
                </div>
              )}
            </div>
          </SortableContext>
        </DndContext>
      </CardContent>
    </Card>
  );
}
