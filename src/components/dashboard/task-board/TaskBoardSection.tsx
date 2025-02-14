
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Task } from "../TaskBoard";
import { DndContext, MouseSensor, TouchSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { startOfDay, isAfter, isSameDay, parseISO } from "date-fns";
import { TaskCard } from "../TaskCard";
import { NotificationTest } from "../notifications/NotificationTest";
import { TaskLegend } from "../TaskLegend";
import { QueryObserverResult } from "@tanstack/react-query";

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

  const todayStart = startOfDay(new Date());

  const shouldShowCompletedTask = (task: Task) => {
    return task.completed_at && isAfter(new Date(task.completed_at), todayStart);
  };

  const shouldShowTask = (task: Task) => {
    // Always show unscheduled tasks
    if (task.status === 'unscheduled') {
      console.log('Showing unscheduled task:', task.title);
      return true;
    }
    
    // For completed tasks, check if they were completed today
    if (task.status === 'completed') {
      const shouldShow = shouldShowCompletedTask(task);
      console.log('Completed task check:', task.title, shouldShow);
      return shouldShow;
    }
    
    // For scheduled tasks, check if they're scheduled for today
    if (task.status === 'scheduled' && task.date) {
      const taskDate = parseISO(task.date);
      const isToday = isSameDay(taskDate, todayStart);
      console.log('Scheduled task check:', {
        taskTitle: task.title,
        taskDate: task.date,
        parsedTaskDate: taskDate,
        today: todayStart,
        isToday
      });
      return isToday;
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

  console.log('All tasks:', tasks);
  console.log('Filtered tasks:', sortedTasks);

  const draggableTaskIds = sortedTasks
    .filter(task => task.status !== 'completed')
    .map(task => task.id);

  return (
    <Card className="flex flex-col h-full overflow-hidden">
      <CardHeader className="flex-none pb-4 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-semibold">Task Board</CardTitle>
          <NotificationTest />
        </div>
        <TaskLegend />
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto">
        <DndContext sensors={sensors} onDragEnd={onDragEnd}>
          <SortableContext items={draggableTaskIds} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-4 min-h-[600px] pb-40 relative">
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
  );
}
