import { useIsMobile } from "@/hooks/use-mobile";
import { DesktopTaskView } from "./DesktopTaskView";
import { MobileTaskView } from "./MobileTaskView";
import { useTasks } from "@/hooks/use-tasks";
import { useTaskReorder } from "@/hooks/use-task-reorder";
import { useCallback, useMemo, useEffect } from 'react';
import { Subtask } from "./subtasks/SubtaskList";
import { Skeleton } from "@/components/ui/skeleton";
import { TaskAttachment } from "./form/types";

export type TaskPriority = "low" | "medium" | "high";

export interface TaskAssignment {
  id: number;
  task_id: number;
  assignee_id: string;
  assigned_by_id: string;
  status: "pending" | "accepted" | "declined" | "completed";
  created_at: string;
  updated_at: string;
}

export interface SharedTask {
  id: number;
  task_id: number;
  shared_by_user_id: string;
  shared_with_user_id: string;
  sharing_type: string;
  status: string;
  created_at: string;
  updated_at: string;
  group_id?: number | null;
}

export interface Task {
  id: number;
  title: string;
  description: string | null;
  status: 'completed' | 'scheduled' | 'unscheduled' | 'in_progress' | 'stuck' | 'event';
  date: string | null;
  start_time: string | null;
  end_time: string | null;
  priority: TaskPriority;
  position: number;
  user_id: string;
  owner_id: string;
  created_at?: string;
  updated_at?: string;
  completed_at?: string | null;
  reminder_enabled?: boolean;
  reminder_time?: number;
  reschedule_count?: number;
  shared?: boolean;
  assignees?: string[];
  assignments?: TaskAssignment[];
  is_tracking?: boolean;
  time_spent?: number;
  subtasks?: Subtask[];
  task_attachments?: TaskAttachment[];
  shared_tasks?: SharedTask[];
  is_all_day?: boolean;
}

interface TaskBoardProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export function TaskBoard({ selectedDate, onDateChange }: TaskBoardProps) {
  const isMobile = useIsMobile();
  const { tasks, refetch, isLoading } = useTasks();
  const { handleDragEnd } = useTaskReorder(tasks, refetch);

  useEffect(() => {
    console.log("TaskBoard mounted");
    console.log("Is mobile:", isMobile);
    console.log("Is loading:", isLoading);
    console.log("Tasks count:", tasks.length);
  }, [isMobile, isLoading, tasks.length]);

  const memoizedRefetch = useCallback(() => {
    return refetch();
  }, [refetch]);

  const memoizedTasks = useMemo(() => tasks, [tasks]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
        <Skeleton className="h-full w-full rounded-lg" />
        <Skeleton className="h-full w-full hidden md:block rounded-lg" />
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="h-full">
        <MobileTaskView 
          tasks={memoizedTasks}
          selectedDate={selectedDate} 
          onDateChange={onDateChange}
          onDragEnd={handleDragEnd}
          onComplete={memoizedRefetch}
        />
      </div>
    );
  }

  return (
    <div className="h-full">
      <DesktopTaskView 
        tasks={memoizedTasks}
        selectedDate={selectedDate} 
        onDateChange={onDateChange}
        onDragEnd={handleDragEnd}
        onComplete={memoizedRefetch}
      />
    </div>
  );
}
