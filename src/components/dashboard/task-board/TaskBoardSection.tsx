
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Task } from "../TaskBoard";
import { DndContext, MouseSensor, TouchSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { startOfDay, endOfDay, parseISO, isSameDay } from "date-fns";
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

  // Get today's date in user's timezone
  const today = startOfDay(new Date());
  
  // Add debugging
  useEffect(() => {
    console.log("TaskBoardSection mounted");
    console.log("Total tasks:", tasks.length);
    console.log("Today (ISO):", today.toISOString());
    console.log("Today (Local):", today.toString());
  }, [tasks, today]);

  const filterTasks = (task: Task) => {
    try {
      // Debug each task
      console.log("Filtering task:", {
        title: task.title,
        status: task.status,
        date: task.date,
        completed_at: task.completed_at
      });

      // Always show unscheduled tasks
      if (task.status === 'unscheduled') {
        console.log("Unscheduled task included:", task.title);
        return true;
      }

      // For completed tasks, check if completed today
      if (task.status === 'completed' && task.completed_at) {
        const completedDate = startOfDay(parseISO(task.completed_at));
        const isCompletedToday = isSameDay(completedDate, today);
        console.log("Completed task check:", {
          task: task.title,
          completedDate: completedDate.toISOString(),
          today: today.toISOString(),
          isCompletedToday
        });
        return isCompletedToday;
      }

      // For scheduled tasks, check if scheduled for today
      if (task.date) {
        const taskDate = startOfDay(parseISO(task.date));
        const isTaskForToday = isSameDay(taskDate, today);
        console.log("Scheduled task check:", {
          task: task.title,
          taskDate: taskDate.toISOString(),
          today: today.toISOString(),
          isTaskForToday
        });
        
        // Include if it's for today and either scheduled, in_progress, or stuck
        if (isTaskForToday && ['scheduled', 'in_progress', 'stuck'].includes(task.status)) {
          return true;
        }
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
      // Put completed tasks at the bottom
      if (a.status === 'completed' && b.status !== 'completed') return 1;
      if (a.status !== 'completed' && b.status === 'completed') return -1;
      
      // Sort by position for non-completed tasks
      return (a.position || 0) - (b.position || 0);
    });

  // Debug sorted tasks
  useEffect(() => {
    console.log("Filtered and sorted tasks:", {
      total: sortedTasks.length,
      tasks: sortedTasks.map(t => ({
        title: t.title,
        status: t.status,
        date: t.date,
        completed_at: t.completed_at
      }))
    });
  }, [sortedTasks]);

  const draggableTaskIds = sortedTasks
    .filter(task => task.status !== 'completed')
    .map(task => task.id);

  return (
    <Card className="flex flex-col h-full overflow-hidden bg-white">
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
