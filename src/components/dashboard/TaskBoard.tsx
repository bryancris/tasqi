
import { useIsMobile } from "@/hooks/use-mobile";
import { DesktopTaskView } from "./DesktopTaskView";
import { MobileTaskView } from "./MobileTaskView";
import { useTasks } from "@/hooks/use-tasks";
import { useTaskReorder } from "@/hooks/use-task-reorder";
import { useCallback, useMemo } from 'react';
import { Subtask } from "./subtasks/SubtaskList";

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
  status: 'completed' | 'scheduled' | 'unscheduled' | 'in_progress' | 'stuck';
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
}

interface TaskBoardProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export function TaskBoard({ selectedDate, onDateChange }: TaskBoardProps) {
  const isMobile = useIsMobile();
  const { tasks, refetch } = useTasks();
  const { handleDragEnd } = useTaskReorder(tasks, refetch);

  const memoizedRefetch = useCallback(() => {
    return refetch();
  }, [refetch]);

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
    <div className="transition-all duration-300 transform hover:translate-y-[-2px]">
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
