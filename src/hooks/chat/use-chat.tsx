
import { useCallback } from "react";
import { useChatMessaging } from "./use-chat-messaging";
import { useChatHistory } from "./use-chat-history";
import { useChatNotifications } from "./use-chat-notifications";
import { supabase } from "@/integrations/supabase/client";
import { playNotificationSound } from "@/utils/notifications/soundUtils";
import { useNotifications } from "@/components/notifications/NotificationsManager";

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
  
  // Properly use the notifications hook inside the component
  const { showNotification } = useNotifications();

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
        // Check for timer commands in the user message before sending to the server
        // This is a client-side fallback for when the server is unavailable
        const timerRegex = /set a (\d+)\s*(min|minute|hour|second|sec)s?\s*timer/i;
        const match = message.match(timerRegex);
        
        if (match && navigator.onLine) {
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
              console.log('⏰ Timer data received:', data.timer);
              await handleTimerResponse(data.timer);
              
              // Force immediate update of notifications for timers
              await refreshLists();
            } 
            // Still check general timer-related responses for backward compatibility
            else if (data?.response) {
              console.log('🔍 Checking response for timer references:', data.response.substring(0, 50) + '...');
              await handleTimerRelatedResponse(data.response);
            }
            
            // Refresh tasks and notifications
            await refreshLists();
          } catch (fetchError) {
            console.error('Error with server, using client-side timer fallback:', fetchError);
            
            // Remove the loading indicator message
            removeLastMessage();
            
            // Create a timer locally when server can't be reached
            const duration = parseInt(match[1]);
            const unit = match[2].toLowerCase();
            
            let milliseconds = 0;
            if (unit.startsWith('sec')) milliseconds = duration * 1000;
            else if (unit.startsWith('min')) milliseconds = duration * 60 * 1000;
            else if (unit.startsWith('hour')) milliseconds = duration * 60 * 60 * 1000;
            
            const timerLabel = `${duration} ${unit}${duration > 1 && !unit.endsWith('s') ? 's' : ''}`;
            
            // Add a success message
            addAIMessage(`I've set a timer for ${timerLabel}.`);
            
            // Play notification sound to confirm timer creation
            await playNotificationSound();
            
            // Use the hook from the component context
            if (showNotification) {
              await showNotification({
                title: `Timer Set: ${timerLabel}`,
                message: `I'll notify you when your ${timerLabel} timer is complete.`,
                type: "info",
                persistent: true
              });
            }
            
            // Set up timer to notify when complete
            setTimeout(async () => {
              await playNotificationSound();
              if (showNotification) {
                await showNotification({
                  title: "Timer Complete",
                  message: `Your ${timerLabel} timer is complete!`,
                  type: "info",
                  persistent: true
                });
              }
            }, milliseconds);
          }
        } else {
          // If the message doesn't match timer regex or we're offline, use regular flow
          try {
            // Handle the case when we're offline but not a timer request
            if (!navigator.onLine) {
              removeLastMessage();
              addAIMessage("Sorry, I'm having trouble connecting to the server. Please check your internet connection and try again.");
              return;
            }
            
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
              console.log('⏰ Timer data received:', data.timer);
              await handleTimerResponse(data.timer);
              
              // Force immediate update of notifications for timers
              await refreshLists();
            } 
            // Still check general timer-related responses for backward compatibility
            else if (data?.response) {
              console.log('🔍 Checking response for timer references:', data.response.substring(0, 50) + '...');
              await handleTimerRelatedResponse(data.response);
            }
            
            // Refresh tasks and notifications
            await refreshLists();
          } catch (err) {
            // Error occurred, but wasn't a timer request
            console.error('Error processing message:', err);
            removeLastMessage();
            addAIMessage("Sorry, I'm having trouble connecting to the server. Please check your internet connection and try again.");
          }
        }
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
  }, [message, addUserMessage, setMessage, setIsLoading, addLoadingMessage, processMessage, removeLastMessage, addAIMessage, handleTimerResponse, handleTimerRelatedResponse, refreshLists, toast, showNotification]);

  return {
    message,
    messages,
    isLoading,
    setMessage,
    handleSubmit,
    fetchChatHistory
  };
}
