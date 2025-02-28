
import { Task } from "../TaskBoard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskCard } from "../TaskCard";
import { DndContext, MouseSensor, TouchSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { startOfDay, isAfter } from "date-fns";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { TimelineSection } from "../timeline/MobileTimelineSection";

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

  return (
    <div className="h-[calc(100vh-144px)] overflow-hidden">
      <Card className="h-full border-none shadow-none bg-transparent">
        <CardHeader className="pb-3 px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-semibold">
              {view === 'board' ? 'Task Board' : 'Timeline'}
            </CardTitle>
            <Button
              variant="ghost"
              onClick={() => setView(view === 'board' ? 'timeline' : 'board')}
              className="text-base font-medium text-gray-600"
            >
              Switch to {view === 'board' ? 'Timeline' : 'Board'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="overflow-y-auto h-[calc(100%-5rem)] px-4">
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
                      onComplete={onComplete}
                    />
                  ))}
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
