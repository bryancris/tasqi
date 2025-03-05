import { Task } from "../TaskBoard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskCard } from "../TaskCard";
import { DndContext, MouseSensor, TouchSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { startOfDay, isAfter, parseISO, isSameDay } from "date-fns";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { TimelineSection } from "./timeline/TimelineSection";
import { useQueryClient } from "@tanstack/react-query";
import { useDebouncedTaskRefresh } from "@/hooks/use-debounced-task-refresh";

export interface MobileTaskViewProps {
  tasks: Task[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onDragEnd: (event: DragEndEvent) => void;
  onComplete?: () => void;
}

export function MobileTaskView({ tasks, selectedDate, onDateChange, onDragEnd, onComplete }: MobileTaskViewProps) {
  const [view, setView] = useState<'board' | 'timeline'>('board');
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

  const handleComplete = () => {
    console.log("Task completed, refreshing tasks");
    if (onComplete) {
      onComplete();
    }
    invalidateTasks(150);
  };

  const invalidateTasks = (delay: number) => {
    const queryClient = useQueryClient();
    queryClient.invalidateQueries({ queryKey: ['tasks'] }, { exact: true });
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] }, { exact: true });
    }, delay);
  };

  return (
    <div className="h-[calc(100vh-144px)] overflow-hidden px-4">
      <Card className="h-full border-none shadow-none bg-transparent">
        <CardHeader className="pb-3 px-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-semibold">
              {view === 'board' ? (
                <span className="text-gradient">Task Board</span>
              ) : (
                <span className="text-gradient">Timeline</span>
              )}
            </CardTitle>
            <Button
              variant="rainbow"
              onClick={() => setView(view === 'board' ? 'timeline' : 'board')}
              className="text-base font-medium"
            >
              Switch to {view === 'board' ? 'Timeline' : 'Board'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="overflow-y-auto h-[calc(100%-5rem)] p-0">
          {view === 'board' ? (
            <DndContext sensors={sensors} onDragEnd={onDragEnd}>
              <SortableContext items={draggableTaskIds} strategy={verticalListSortingStrategy}>
                <div className="flex flex-col gap-2">
                  {sortedTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task} 
                      onComplete={handleComplete}
                      onClick={() => console.log("Task clicked", task.id)}
                      dragHandleProps={null}
                      view="daily"
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
          ) : (
            <TimelineSection 
              tasks={tasks}
              selectedDate={selectedDate}
              onDateChange={onDateChange}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
