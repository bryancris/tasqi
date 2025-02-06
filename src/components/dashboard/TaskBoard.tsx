import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DesktopTaskView } from "./DesktopTaskView";
import { MobileTaskView } from "./MobileTaskView";
import { useIsMobile } from "@/hooks/use-mobile";
import { DragEndEvent } from "@dnd-kit/core";

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
  completed_at?: string;
  position: number;
  reminder_enabled?: boolean;
}

interface TaskBoardProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export function TaskBoard({ selectedDate, onDateChange }: TaskBoardProps) {
  const isMobile = useIsMobile();

  const { data: tasks = [], refetch } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('position', { ascending: true });
      
      if (error) throw error;
      console.log('Found tasks:', data);
      return data as Task[];
    },
  });

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;

    const activeTask = tasks.find(task => task.id === active.id);
    const overTask = tasks.find(task => task.id === over.id);

    if (!activeTask || !overTask || activeTask.id === overTask.id) return;

    const activePosition = activeTask.position;
    const overPosition = overTask.position;

    // Calculate new positions
    const updatedTasks = tasks.map(task => {
      if (task.id === activeTask.id) {
        return { ...task, position: overPosition };
      }
      if (activePosition < overPosition) {
        if (task.position <= overPosition && task.position > activePosition) {
          return { ...task, position: task.position - 1000 };
        }
      } else {
        if (task.position >= overPosition && task.position < activePosition) {
          return { ...task, position: task.position + 1000 };
        }
      }
      return task;
    });

    // Update positions in the database
    const { error } = await supabase.rpc('reorder_tasks', {
      task_positions: updatedTasks.map(task => ({
        task_id: task.id,
        new_position: task.position
      }))
    });

    if (error) {
      console.error('Error reordering tasks:', error);
      return;
    }

    // Refetch tasks to get the updated order
    refetch();
  };

  if (isMobile) {
    return (
      <MobileTaskView 
        tasks={tasks} 
        selectedDate={selectedDate} 
        onDateChange={onDateChange}
        onDragEnd={handleDragEnd}
      />
    );
  }

  return (
    <DesktopTaskView 
      tasks={tasks} 
      selectedDate={selectedDate} 
      onDateChange={onDateChange}
      onDragEnd={handleDragEnd}
    />
  );
}