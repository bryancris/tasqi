
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Task } from "../TaskBoard";
import { DndContext, MouseSensor, TouchSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { startOfDay, parseISO, isSameDay } from "date-fns";
import { TaskCard } from "../TaskCard";
import { TaskLegend } from "../TaskLegend";
import { QueryObserverResult } from "@tanstack/react-query";
import { useEffect } from "react";

interface TaskBoardSectionProps {
  tasks: Task[];
  onDragEnd: (event: DragEndEvent) => void;
  onComplete?: () => void | Promise<QueryObserverResult<Task[], Error>>;
}

export function TaskBoardSection({ tasks, onDragEnd, onComplete }: TaskBoardSectionProps) {
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

  const filterTasks = (task: Task) => {
    try {
      if (task.status === 'unscheduled') return true;
      if (task.status === 'completed' && task.completed_at) {
        const completedDate = parseISO(task.completed_at);
        return isSameDay(startOfDay(completedDate), today);
      }
      if (task.date) {
        const taskDate = parseISO(task.date);
        return isSameDay(startOfDay(taskDate), today) && 
               ['scheduled', 'in_progress', 'stuck'].includes(task.status);
      }
      return false;
    } catch (error) {
      console.error("Error filtering task:", error);
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
    <Card className="flex flex-col h-full overflow-hidden bg-white shadow-none border-none">
      <CardHeader className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold">Task Board</CardTitle>
        </div>
        <TaskLegend />
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-6">
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
