
import { Task } from "./TaskBoard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskCard } from "./TaskCard";
import { DndContext, MouseSensor, TouchSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { startOfDay, isAfter, parseISO, isSameDay } from "date-fns";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { TimelineSection } from "./timeline/TimelineSection";
import { useQueryClient } from "@tanstack/react-query";
import { useDebouncedTaskRefresh } from "@/hooks/use-debounced-task-refresh";

// iOS PWA detection
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                     (window.navigator as any).standalone === true;
const isIOSPWA = isIOS && isStandalone;

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
  const queryClient = useQueryClient();
  const { invalidateTasks, cleanup } = useDebouncedTaskRefresh();

  // Create a subscription to task updates
  useEffect(() => {
    console.log("Setting up mobile view task subscription");
    
    // Listen for query invalidations
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      // Check if tasks query was modified
      if (event.type === 'updated' || event.type === 'added' || event.type === 'removed') {
        if (Array.isArray(event.query?.queryKey) && 
            event.query?.queryKey[0] === 'tasks') {
          console.log('Task query updated in MobileTaskView, refreshing');
          invalidateTasks(200); // Use a 200ms debounce delay for mobile
        }
      }
    });

    return () => {
      console.log("Cleaning up mobile view task subscription");
      unsubscribe();
      cleanup();
    };
  }, [queryClient, invalidateTasks, cleanup]);

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

  // Filter tasks logic
  const shouldShowCompletedTask = (task: Task) => {
    return task.completed_at && isAfter(new Date(task.completed_at), todayStart);
  };

  const filterTasks = (task: Task) => {
    try {
      // Always show unscheduled tasks
      if (task.status === 'unscheduled') {
        return true;
      }
      
      // Show completed tasks from today
      if (task.status === 'completed') {
        return shouldShowCompletedTask(task);
      }
      
      // For scheduled tasks, check if they match the selected date
      if (task.status === 'scheduled' || task.status === 'in_progress' || 
          task.status === 'stuck' || task.status === 'event') {
        if (!task.date) return false;
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
      // Events should appear at the top
      if (a.status === 'event' && b.status !== 'event') return -1;
      if (a.status !== 'event' && b.status === 'event') return 1;
      return (a.position || 0) - (b.position || 0);
    });

  const draggableTaskIds = sortedTasks
    .filter(task => task.status !== 'completed')
    .map(task => task.id);

  // Enhanced onComplete function with refetch
  const handleComplete = () => {
    console.log("Task completed, refreshing tasks");
    if (onComplete) {
      onComplete();
    }
    // Also trigger a task refresh with shorter delay
    invalidateTasks(150);
  };

  return (
    <div className={`h-[calc(100vh-144px)] overflow-hidden px-4 ${isIOSPWA ? 'ios-pull-to-refresh' : 'ios-momentum-scroll'}`}>
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
        <CardContent className={`overflow-y-auto h-[calc(100%-5rem)] p-0 ${isIOSPWA ? 'ios-pull-to-refresh' : 'ios-momentum-scroll'}`}>
          {view === 'board' ? (
            <DndContext sensors={sensors} onDragEnd={onDragEnd}>
              <SortableContext items={draggableTaskIds} strategy={verticalListSortingStrategy}>
                <div className="flex flex-col gap-2">
                  {sortedTasks.map((task, index) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      index={index}
                      isDraggable={task.status !== 'completed'}
                      onComplete={handleComplete}
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
