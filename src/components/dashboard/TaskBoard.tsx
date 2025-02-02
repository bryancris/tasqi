import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DesktopTaskView } from "./DesktopTaskView";
import { MobileTaskView } from "./MobileTaskView";
import { useIsMobile } from "@/hooks/use-mobile";

export interface Task {
  id: number;
  title: string;
  description?: string;
  date?: string;
  status: 'unscheduled' | 'scheduled' | 'completed';
  start_time?: string;
  end_time?: string;
  priority?: 'low' | 'medium' | 'high';
  user_id: string;
  created_at?: string;
  updated_at?: string;
  position: number;
}

interface TaskBoardProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export function TaskBoard({ selectedDate, onDateChange }: TaskBoardProps) {
  const isMobile = useIsMobile();

  const { data: tasks = [] } = useQuery({
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

  if (isMobile) {
    return <MobileTaskView tasks={tasks} selectedDate={selectedDate} />;
  }

  return <DesktopTaskView tasks={tasks} selectedDate={selectedDate} onDateChange={onDateChange} />;
}