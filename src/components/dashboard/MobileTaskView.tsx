import { Task } from "./TaskBoard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskCard } from "./TaskCard";
import { DndContext, MouseSensor, TouchSensor, useSensor, useSensors, DragEndEvent, pointerWithin } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { startOfDay, isAfter, parseISO, isSameDay } from "date-fns";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import { TimelineSection } from "./timeline/TimelineSection";
import { useQueryClient } from "@tanstack/react-query";
import { useDebouncedTaskRefresh } from "@/hooks/use-debounced-task-refresh";
import { isIOSPWA } from "@/utils/platform-detection";

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
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const isIOSPwaApp = isIOSPWA();
  
  useEffect(() => {
    console.log("Setting up mobile view task subscription");
    
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event.type === 'updated' || event.type === 'added' || event.type === 'removed') {
        if (Array.isArray(event.query?.queryKey) && 
            event.query?.queryKey[0] === 'tasks') {
          console.log('Task query updated in MobileTaskView, refreshing');
          invalidateTasks(200);
        }
      }
    });

    return () => {
      console.log("Cleaning up mobile view task subscription");
      unsubscribe();
      cleanup();
    };
  }, [queryClient, invalidateTasks, cleanup]);

  useEffect(() => {
    if (isIOSPwaApp && contentRef.current) {
      const handleScroll = () => {
        if (contentRef.current && contentRef.current.scrollTop <= 5) {
          contentRef.current.style.paddingTop = '0px';
        }
      };
      
      const currentContent = contentRef.current;
      currentContent.addEventListener('scroll', handleScroll, { passive: true });
      
      currentContent.style.paddingTop = '0px';
      
      return () => {
        currentContent?.removeEventListener('scroll', handleScroll);
      };
    }
  }, [isIOSPwaApp]);

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

  const shouldShowCompletedTask = (task: Task) => {
    return task.completed_at && isAfter(new Date(task.completed_at), todayStart);
  };

  const filterTasks = (task: Task) => {
    try {
      if (task.status === 'unscheduled') {
        return true;
      }
      
      if (task.status === 'completed') {
        return shouldShowCompletedTask(task);
      }
      
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
      if (a.status === 'event' && b.status !== 'event') return -1;
      if (a.status !== 'event' && b.status === 'event') return 1;
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

  const containerStyle = isIOSPwaApp 
    ? { height: '100%' }
    : { height: 'calc(100vh - 144px)' };

  return (
    <div 
      ref={containerRef}
      className={`px-4 ${isIOSPwaApp ? 'ios-pwa-container' : ''}`}
      style={containerStyle}
    >
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
        <CardContent 
          ref={contentRef}
          className={`overflow-y-auto p-0 pb-8 ${isIOSPwaApp 
            ? 'ios-pwa-content' 
            : 'ios-momentum-scroll h-[calc(100%-5rem)]'}`}
        >
          {view === 'board' ? (
            <DndContext 
              sensors={sensors} 
              onDragEnd={onDragEnd}
              collisionDetection={pointerWithin}
            >
              <SortableContext items={draggableTaskIds} strategy={verticalListSortingStrategy}>
                <div className="flex flex-col gap-2 pb-4 pt-1">
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
          
          <div className={`w-full ${isIOSPwaApp ? 'h-[calc(env(safe-area-inset-bottom)+1rem)]' : 'h-8'}`}></div>
        </CardContent>
      </Card>
    </div>
  );
}
