import { useIsMobile } from "@/hooks/use-mobile";
import { DesktopTaskView } from "./DesktopTaskView";
import { MobileTaskView } from "./MobileTaskView";
import { useTasks } from "@/hooks/use-tasks";
import { useTaskReorder } from "@/hooks/use-task-reorder";
import { useCallback, useMemo } from 'react';

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

export interface Task {
  id: number;
  title: string;
  description: string | null;
  status: "scheduled" | "unscheduled";
  date: string | null;
  start_time: string | null;
  end_time: string | null;
  priority: TaskPriority;
  reminder_enabled: boolean;
  position: number;
  subtasks?: Subtask[];
  user_id: string;
  owner_id: string;
  created_at?: string;
  updated_at?: string;
  reschedule_count?: number;
  shared?: boolean;
  assignees?: string[];
  assignments?: TaskAssignment[];
  sharedBy?: string;
}

interface TaskBoardProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export function TaskBoard({ selectedDate, onDateChange }: TaskBoardProps) {
  const isMobile = useIsMobile();
  const { tasks, refetch } = useTasks();
  const { handleDragEnd } = useTaskReorder(tasks, refetch);

  // Memoize refetch function and preserve its return type
  const memoizedRefetch = useCallback(() => {
    return refetch();
  }, [refetch]);

  // Memoize tasks array to prevent unnecessary re-renders
  const memoizedTasks = useMemo(() => tasks, [tasks]);

  if (isMobile) {
    return (
      <MobileTaskView 
        tasks={memoizedTasks}
        selectedDate={selectedDate} 
        onDateChange={onDateChange}
        onDragEnd={handleDragEnd}
        onComplete={memoizedRefetch}
      />
    );
  }

  return (
    <DesktopTaskView 
      tasks={memoizedTasks}
      selectedDate={selectedDate} 
      onDateChange={onDateChange}
      onDragEnd={handleDragEnd}
      onComplete={memoizedRefetch}
    />
  );
}
