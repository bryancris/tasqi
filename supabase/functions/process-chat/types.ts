
export interface ChatRequest {
  message: string;
  userId: string;
}

export interface TaskDetails {
  title: string;
  description?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  isScheduled: boolean;
  priority?: "low" | "medium" | "high";
}

export interface OpenAIResponse {
  task?: {
    should_create: boolean;
    should_complete?: boolean;
    task_title?: string;
    title: string;
    description?: string;
    is_scheduled: boolean;
    date?: string;
    start_time?: string;
    end_time?: string;
    priority?: "low" | "medium" | "high";
  };
  response: string;
}

