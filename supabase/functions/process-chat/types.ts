
export interface ChatMessage {
  content: string;
  role: 'user' | 'assistant';
}

export interface TimerData {
  id: number;
  user_id: string;
  label: string | null;
  duration_minutes: number;
  expires_at: string;
  is_active: boolean;
  is_completed: boolean;
  created_at: string;
}

export interface TimerIntent {
  action: 'create' | 'cancel' | 'check';
  minutes?: number;
  label?: string | null;
}

export interface TimerActionResult {
  success: boolean;
  message: string;
  data?: TimerData[];
}

export interface TaskCommandResponse {
  isTaskCommand: boolean;
  response: string;
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  date?: string;
  status: 'scheduled' | 'unscheduled' | 'completed' | 'event';
  priority?: 'low' | 'medium' | 'high';
}
