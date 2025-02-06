import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  const queryClient = useQueryClient();

  const { data: tasks = [], refetch } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      console.log('Fetching tasks...');
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('position', { ascending: true });
      
      if (error) {
        console.error('Error fetching tasks:', error);
        throw error;
      }
      
      console.log('Fetched tasks:', data);
      return data as Task[];
    },
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true
  });

  // Set up real-time subscription for task updates
  useEffect(() => {
    console.log('Setting up real-time subscription...');
    
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
          console.log('Received task change:', payload);
          // Immediately invalidate and refetch
          queryClient.invalidateQueries({ queryKey: ['tasks'] });
          refetch();
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    return () => {
      console.log('Cleaning up subscription...');
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

      // Force a refetch to get the updated order
      await refetch();

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