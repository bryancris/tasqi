
import { Message } from "@/components/chat/types";

export interface SubmissionHelpers {
  addUserMessage: (content: string) => Message;
  setMessage: (message: string) => void;
  setIsLoading: (isLoading: boolean) => void;
  addLoadingMessage: () => void;
  processMessage: (userMessage: Message) => Promise<{ 
    response?: string; 
    timer?: any; 
    taskCreated?: boolean; 
    task?: any 
  }>;
  removeLastMessage: () => void;
  addAIMessage: (content: string) => Message;
  handleTimerResponse: (timerData: any) => Promise<void>;
  handleTimerRelatedResponse: (response: string) => Promise<void>;
  refreshLists: () => Promise<void>;
  toast: any;
}

export interface TaskCreationHelpers {
  processMessage: SubmissionHelpers['processMessage'];
  removeLastMessage: SubmissionHelpers['removeLastMessage'];
  addAIMessage: SubmissionHelpers['addAIMessage'];
  refreshLists: SubmissionHelpers['refreshLists'];
}

export interface TimerHandlingHelpers {
  processMessage: SubmissionHelpers['processMessage'];
  removeLastMessage: SubmissionHelpers['removeLastMessage'];
  addAIMessage: SubmissionHelpers['addAIMessage'];
  handleTimerResponse: SubmissionHelpers['handleTimerResponse'];
  handleTimerRelatedResponse: SubmissionHelpers['handleTimerRelatedResponse'];
  refreshLists: SubmissionHelpers['refreshLists'];
}

export interface ErrorHandlingHelpers {
  removeLastMessage: SubmissionHelpers['removeLastMessage'];
  addAIMessage: SubmissionHelpers['addAIMessage'];
}
