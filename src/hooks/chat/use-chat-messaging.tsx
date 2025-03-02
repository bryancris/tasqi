
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Message } from "@/components/chat/types";
import { useQueryClient } from "@tanstack/react-query";

export function useChatMessaging() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Add user message to messages array
  const addUserMessage = (content: string) => {
    const userMessage = { content, isUser: true };
    setMessages(prev => [...prev, userMessage]);
    return userMessage;
  };

  // Add AI message to messages array
  const addAIMessage = (content: string) => {
    const aiMessage = { content, isUser: false };
    setMessages(prev => [...prev, aiMessage]);
    return aiMessage;
  };

  // Add temporary loading message
  const addLoadingMessage = () => {
    const tempAiMessage = { content: "...", isUser: false };
    setMessages(prev => [...prev, tempAiMessage]);
  };

  // Remove the last message (usually the loading indicator)
  const removeLastMessage = () => {
    setMessages(prev => prev.slice(0, -1));
  };

  // Process the user's message with the AI
  const processMessage = async (userMessage: Message): Promise<{ 
    response?: string; 
    timer?: any;
    error?: Error 
  }> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('Authentication required for processing message');
        throw new Error("Authentication required");
      }

      console.log('🚀 Invoking process-chat function with message:', userMessage.content.substring(0, 50) + '...');
      
      // First, check if the network is even available
      if (!navigator.onLine) {
        throw new Error("You are currently offline. Please check your internet connection.");
      }
      
      // Try to detect if we're setting a timer
      const timerRegex = /set a (\d+)\s*(min|minute|hour|second|sec)s?\s*timer/i;
      const match = userMessage.content.match(timerRegex);
      
      if (match) {
        const duration = parseInt(match[1]);
        const unit = match[2].toLowerCase();
        
        // Construct a direct response
        let timerResponse;
        if (unit.startsWith('sec')) {
          timerResponse = `I've set a ${duration} second timer for you.`;
        } else if (unit.startsWith('min')) {
          timerResponse = `I've set a ${duration} minute timer for you.`;
        } else if (unit.startsWith('hour')) {
          timerResponse = `I've set a ${duration} hour timer for you.`;
        }
        
        // Try the server-side function first
        try {
          const startTime = Date.now();
          const { data, error } = await supabase.functions.invoke('process-chat', {
            body: { message: userMessage.content, userId: user.id }
          });
          const endTime = Date.now();
          
          console.log(`⏱️ Function invocation took ${endTime - startTime}ms`);

          if (error) {
            console.error('❌ Function error:', error);
            throw error;
          }

          console.log('✅ Function returned data:', data);
          
          // Check for timer data
          if (data?.timer) {
            console.log('⏰ Timer data received:', data.timer);
            // Force immediate refresh of timer data
            await queryClient.invalidateQueries({ queryKey: ['timers'] });
          }
          
          return data;
        } catch (serverError: any) {
          console.error('Server-side timer function failed, using client fallback:', serverError);
          
          // Special handling for CORS errors
          if (
            (serverError instanceof TypeError && serverError.message === 'Failed to fetch') ||
            serverError.message?.includes('CORS') ||
            (serverError.cause instanceof TypeError && serverError.cause.message === 'Failed to fetch')
          ) {
            console.error('❌ CORS or network error detected, using client-side fallback');
          }
          
          // Fall back to client-side response for timers
          // Calculate milliseconds properly based on the unit
          let milliseconds = 0;
          if (unit.startsWith('sec')) milliseconds = duration * 1000;
          else if (unit.startsWith('min')) milliseconds = duration * 60 * 1000;
          else if (unit.startsWith('hour')) milliseconds = duration * 60 * 60 * 1000;
          
          const timerLabel = `${duration} ${unit}${duration > 1 && !unit.endsWith('s') ? 's' : ''}`;
          
          return {
            response: timerResponse,
            timer: {
              action: 'created',
              label: timerLabel,
              duration: duration,
              unit: unit,
              milliseconds: milliseconds  // Add milliseconds for accurate timing
            }
          };
        }
      }
      
      // For non-timer messages, always use the server
      try {
        const startTime = Date.now();
        const { data, error } = await supabase.functions.invoke('process-chat', {
          body: { message: userMessage.content, userId: user.id }
        });
        const endTime = Date.now();
        
        console.log(`⏱️ Function invocation took ${endTime - startTime}ms`);

        if (error) {
          console.error('❌ Function error:', error);
          throw error;
        }

        console.log('✅ Function returned data:', data);
        
        // Check for timer data
        if (data?.timer) {
          console.log('⏰ Timer data detected:', data.timer);
          // Force immediate refresh of timer data
          await queryClient.invalidateQueries({ queryKey: ['timers'] });
        }
        
        return data;
      } catch (serverError: any) {
        // Special handling for CORS errors
        if (
          (serverError instanceof TypeError && serverError.message === 'Failed to fetch') ||
          serverError.message?.includes('CORS') ||
          (serverError.cause instanceof TypeError && serverError.cause.message === 'Failed to fetch')
        ) {
          console.error('❌ CORS or network error detected:', serverError);
          throw new Error("The server is currently unavailable. Please try again later.");
        } else {
          console.error('❌ Error invoking function:', serverError);
          throw serverError;
        }
      }
    } catch (error) {
      if ((error as any)?.message?.includes('CORS')) {
        console.error('❌ CORS error processing message:', error);
        throw new Error("CORS policy prevented the request. This is a server configuration issue.");
      } else {
        console.error('❌ Error processing message:', error);
        throw error;
      }
    }
  };

  // Reset all chat messages
  const resetMessages = () => {
    setMessages([]);
  };

  return {
    message,
    messages,
    isLoading,
    setMessage,
    addUserMessage,
    addAIMessage,
    addLoadingMessage,
    removeLastMessage,
    processMessage,
    resetMessages,
    setMessages,
    setIsLoading,
    toast,
    queryClient
  };
}
