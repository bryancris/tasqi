
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
  };
  response: string;
}

