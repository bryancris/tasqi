
import { useCallback } from "react";
import { useChatMessaging } from "./use-chat-messaging";
import { useChatHistory } from "./use-chat-history";
import { useChatNotifications } from "./use-chat-notifications";
import { useChatSubmission } from "./use-chat-submission";

export function useChat() {
  const {
    message,
    messages,
    isLoading,
    setMessage,
    addUserMessage,
    addAIMessage,
    addLoadingMessage,
    removeLastMessage,
    processMessage,
    setIsLoading,
    toast,
    setMessages
  } = useChatMessaging();

  const { fetchChatHistory } = useChatHistory(messages => {
    // Pass the messages to the setMessages function from useChatMessaging
    if (typeof messages === 'function') {
      const messagesArray = messages([]);
      setMessages(messagesArray);
    } else {
      setMessages(messages);
    }
  });

  const {
    handleTimerResponse,
    handleTimerRelatedResponse,
    refreshLists
  } = useChatNotifications();
  
  // Use the extracted submission hook for handling chat submissions
  const handleSubmitCallback = useChatSubmission(
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
  );
  
  // Create a wrapper function that calls the submission hook with the current message
  const handleSubmit = useCallback((e: React.FormEvent) => {
    return handleSubmitCallback(e, message);
  }, [handleSubmitCallback, message]);

  return {
    message,
    messages,
    isLoading,
    setMessage,
    handleSubmit,
    fetchChatHistory
  };
}
