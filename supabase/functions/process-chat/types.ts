
export interface ChatRequest {
  message: string;
  userId: string;
}

export interface SubtaskDetails {
  title: string;
  status: 'pending' | 'completed';
  position: number;
}

export interface TaskDetails {
  title: string;
  description?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  isScheduled: boolean;
  priority?: "low" | "medium" | "high";
  subtasks?: SubtaskDetails[];
}

export interface OpenAIResponse {
  task?: {
    should_create: boolean;
    title: string;
    description?: string;
    is_scheduled: boolean;
    date?: string;
    start_time?: string;
    end_time?: string;
    priority?: "low" | "medium" | "high";
    subtasks?: (SubtaskDetails | string)[];
  };
  response: string;
}
