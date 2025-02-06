import { useIsMobile } from "@/hooks/use-mobile";
import { DesktopTaskView } from "./DesktopTaskView";
import { MobileTaskView } from "./MobileTaskView";
import { useTasks } from "@/hooks/use-tasks";
import { useTaskReorder } from "@/hooks/use-task-reorder";

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
  created_at?: string;
  updated_at?: string;
  position: number;
  reminder_enabled?: boolean;
  completed_at?: string;
}

interface TaskBoardProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export function TaskBoard({ selectedDate, onDateChange }: TaskBoardProps) {
  const isMobile = useIsMobile();
  const { tasks, refetch } = useTasks();
  const { handleDragEnd } = useTaskReorder(tasks, refetch);

  if (isMobile) {
    return (
      <MobileTaskView 
        tasks={tasks} 
        selectedDate={selectedDate} 
        onDateChange={onDateChange}
        onDragEnd={handleDragEnd}
        onComplete={refetch}
      />
    );
  }

  return (
    <DesktopTaskView 
      tasks={tasks} 
      selectedDate={selectedDate} 
      onDateChange={onDateChange}
      onDragEnd={handleDragEnd}
      onComplete={refetch}
    />
  );
}