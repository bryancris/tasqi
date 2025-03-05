
import { Message } from "@/components/chat/types";

export interface SubmissionHelpers {
  addUserMessage: (content: string) => Message;
  setMessage: (message: string) => void;
  setIsLoading: (isLoading: boolean) => void;
  addLoadingMessage: () => void;
  processMessage: (userMessage: Message) => Promise<{ response?: string; timer?: any; taskCreated?: boolean; task?: any }>;
  removeLastMessage: () => void;
  addAIMessage: (content: string) => Message;
  handleTimerResponse: (timerData: any) => Promise<void>;
  handleTimerRelatedResponse: (response: string) => Promise<void>;
  refreshLists: () => Promise<void>;
  toast?: any;
  resetMessages?: () => void; // Add this optional function to reset messages
}
