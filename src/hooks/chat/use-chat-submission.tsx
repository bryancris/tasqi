
import { useCallback } from "react";
import { Message } from "@/components/chat/types";
import { useNotifications } from "@/components/notifications/NotificationsManager";
import { useSubmissionCore } from "./submission/use-submission-core";
import { SubmissionHelpers } from "./submission/types";

export function useChatSubmission(
  addUserMessage: (content: string) => Message,
  setMessage: (message: string) => void,
  setIsLoading: (isLoading: boolean) => void,
  addLoadingMessage: () => void,
  processMessage: (userMessage: Message) => Promise<{ response?: string; timer?: any; taskCreated?: boolean; task?: any }>,
  removeLastMessage: () => void,
  addAIMessage: (content: string) => Message,
  handleTimerResponse: (timerData: any) => Promise<void>,
  handleTimerRelatedResponse: (response: string) => Promise<void>,
  refreshLists: () => Promise<void>,
  toast: any // Keep the original toast for backward compatibility but ignore it
) {
  const { showNotification } = useNotifications();
  
  // Create the helpers object to pass to the submission core
  const helpers: SubmissionHelpers = {
    addUserMessage,
    setMessage,
    setIsLoading,
    addLoadingMessage,
    processMessage,
    removeLastMessage,
    addAIMessage,
    handleTimerResponse,
    handleTimerRelatedResponse,
    refreshLists,
    toast
  };
  
  // Use our refactored submission core hook
  return useSubmissionCore(helpers);
}
