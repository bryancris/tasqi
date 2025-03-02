
import { useCallback } from "react";
import { useChatMessaging } from "./use-chat-messaging";
import { useChatHistory } from "./use-chat-history";
import { useChatNotifications } from "./use-chat-notifications";

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
    toast
  } = useChatMessaging();

  const { fetchChatHistory } = useChatHistory(messages => {
    // We need to use a function here instead of directly using setMessages
    // because useChatHistory doesn't have access to the setMessages from useChatMessaging
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

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const userMessage = addUserMessage(message);
    setMessage("");
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Error",
          description: "Please sign in to send messages",
          variant: "destructive",
        });
        return;
      }

      // Add a loading indicator message while waiting for response
      addLoadingMessage();

      try {
        const data = await processMessage(userMessage);
        
        // Remove the loading indicator message
        removeLastMessage();

        // Add the AI's response
        if (data?.response) {
          addAIMessage(data.response);
        } else {
          addAIMessage("I'm sorry, I couldn't process that request.");
        }
        
        // Handle timer-related response
        if (data?.timer) {
          await handleTimerResponse(data.timer);
        } 
        // Still check general timer-related responses for backward compatibility
        else if (data?.response) {
          await handleTimerRelatedResponse(data.response);
        }
        
        // Refresh tasks and notifications
        await refreshLists();
      } catch (invokeError) {
        console.error('Error invoking function:', invokeError);
        
        // Remove the loading indicator message if it exists
        removeLastMessage();
        
        // Add an error message
        addAIMessage("Sorry, I'm having trouble connecting to the server. Please check your internet connection and try again.");
        
        toast({
          title: "Communication Error",
          description: "Failed to communicate with the AI. Please try again later.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error processing message:', error);
      toast({
        title: "Error",
        description: "Failed to process message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [message, addUserMessage, setMessage, setIsLoading, addLoadingMessage, processMessage, removeLastMessage, addAIMessage, handleTimerResponse, handleTimerRelatedResponse, refreshLists, toast]);

  return {
    message,
    messages,
    isLoading,
    setMessage,
    handleSubmit,
    fetchChatHistory
  };
}

// Add missing import that we're using in the hook
import { supabase } from "@/integrations/supabase/client";
