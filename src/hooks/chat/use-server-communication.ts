
import { useServerCommunicationCore } from "./server/use-server-communication-core";
import { useTaskExtraction } from "./server/use-task-extraction";
import { useResponseProcessing } from "./server/use-response-processing";

export interface ProcessChatResponse {
  response?: string;
  timer?: any;
  error?: Error;
  success?: boolean;
  taskCreated?: boolean;
  task?: any;
}

export function useServerCommunication() {
  const { invokeProcessChat, queryClient } = useServerCommunicationCore();
  const { handleTaskCreation, extractTaskFromResponse } = useTaskExtraction();
  const { processTimerData, refreshTaskLists } = useResponseProcessing();

  const processChat = async (
    content: string, 
    userId: string
  ): Promise<ProcessChatResponse> => {
    try {
      // Core API call
      let responseData = await invokeProcessChat(content, userId);
      
      // Process timer data if present
      responseData = processTimerData(responseData);
      
      // Handle explicit task creation
      responseData = handleTaskCreation(responseData);
      
      // Try to extract tasks from response if not already marked as task
      responseData = await extractTaskFromResponse(responseData, content, userId);
      
      // Always refresh task lists as a fallback
      refreshTaskLists();
      
      return responseData;
    } catch (error) {
      console.error('Error in processChat:', error);
      throw error;
    }
  };

  return {
    invokeProcessChat: processChat
  };
}
