import { useIsMobile } from "@/hooks/use-mobile";
import { DesktopTaskView } from "./DesktopTaskView";
import { MobileTaskView } from "./MobileTaskView";
import { useTasks } from "@/hooks/use-tasks";
import { useTaskReorder } from "@/hooks/use-task-reorder";
import { useCallback, useMemo } from 'react';

export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: number;
  title: string;
  description?: string;
  date?: string;
  status: 'unscheduled' | 'scheduled' | 'completed';
  start_time?: string;
  end_time?: string;
  priority?: TaskPriority;
  user_id: string;
  owner_id: string;
  created_at?: string;
  updated_at?: string;
  position: number;
  reminder_enabled?: boolean;
  completed_at?: string;
  reschedule_count?: number;
  shared?: boolean;
  assignees?: string[];
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

  // Memoize the refetch callback
  const memoizedRefetch = useCallback(() => {
    void refetch();
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
