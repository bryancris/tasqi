
export interface Task {
  id: number;
  title: string;
  description?: string;
  date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  status: 'completed' | 'scheduled' | 'unscheduled' | 'in_progress' | 'stuck';
  position: number;
  assignees?: string[];
  completed_at?: string | null;
  priority?: 'low' | 'medium' | 'high';
  is_tracking?: boolean;
  time_spent?: number;
  assignments?: any[];
  user_id: string;
  owner_id: string;
}
