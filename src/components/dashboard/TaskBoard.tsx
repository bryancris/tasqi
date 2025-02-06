import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DesktopTaskView } from "./DesktopTaskView";
import { MobileTaskView } from "./MobileTaskView";
import { useIsMobile } from "@/hooks/use-mobile";
import { DragEndEvent } from "@dnd-kit/core";
import { toast } from "sonner";
import { useEffect } from "react";

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
  const queryClient = useQuery();

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
    staleTime: 0, // Disable caching to always fetch fresh data
    cacheTime: 0  // Remove data from cache immediately
  });

  // Set up real-time subscription for task updates
  useEffect(() => {
    console.log('Setting up real-time subscription for tasks...');
    const channel = supabase
      .channel('tasks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks'
        },
        (payload) => {
          console.log('Task change detected:', payload);
          queryClient.invalidateQueries({ queryKey: ['tasks'] });
          refetch();
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up real-time subscription...');
      supabase.removeChannel(channel);
    };
  }, [queryClient, refetch]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;

    try {
      const oldIndex = tasks.findIndex(task => task.id === active.id);
      const newIndex = tasks.findIndex(task => task.id === over.id);

      if (oldIndex === -1 || newIndex === -1) return;

      const updatedTasks = Array.from(tasks);
      const [movedTask] = updatedTasks.splice(oldIndex, 1);
      updatedTasks.splice(newIndex, 0, movedTask);

      // Calculate new positions with larger intervals
      const positions = updatedTasks.map((task, index) => ({
        task_id: task.id,
        new_position: (index + 1) * 1000
      }));

      const { error } = await supabase.rpc('reorder_tasks', {
        task_positions: positions
      });

      if (error) throw error;

      // Refetch to get the updated order
      refetch();

      toast.success("Task order updated successfully");
    } catch (error) {
      console.error('Error reordering tasks:', error);
      toast.error("Failed to reorder tasks. Please try again.");
    }
  };

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