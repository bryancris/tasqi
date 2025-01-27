import { useIsMobile } from "@/hooks/use-mobile";
import { MobileTaskView } from "./MobileTaskView";
import { DesktopTaskView } from "./DesktopTaskView";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: number;
  title: string;
  date: string;
  status: 'scheduled' | 'unscheduled';
  time: string;
  priority?: TaskPriority;
  position: number;
}

const fetchTasks = async () => {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('position', { ascending: true });

  if (error) throw error;

  return data.map((task) => ({
    id: task.id,
    title: task.title,
    date: task.date || '',
    status: task.status,
    time: task.start_time ? `${task.start_time} - ${task.end_time}` : '',
    priority: task.priority,
    position: task.position,
  }));
};

export function TaskBoard() {
  const isMobile = useIsMobile();
  
  const { data: tasks = [], isLoading, error } = useQuery({
    queryKey: ['tasks'],
    queryFn: fetchTasks,
  });

  if (isLoading) {
    return <div>Loading tasks...</div>;
  }

  if (error) {
    return <div>Error loading tasks</div>;
  }

  if (isMobile) {
    return <MobileTaskView tasks={tasks} />;
  }

  return <DesktopTaskView tasks={tasks} />;
}