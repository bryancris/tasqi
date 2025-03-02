
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
        throw new Error("Authentication required");
      }

      const { data, error } = await supabase.functions.invoke('process-chat', {
        body: { message: userMessage.content, userId: user.id }
      });

      if (error) {
        console.error('Function error:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error processing message:', error);
      throw error;
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
