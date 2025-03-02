
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Message } from "@/components/chat/types";
import { useQueryClient } from "@tanstack/react-query";
import { useNotifications } from "@/components/notifications/NotificationsManager";

export function useChat() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { showNotification } = useNotifications();

  const fetchChatHistory = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Error",
          description: "Please sign in to access chat history",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase
        .from('chat_messages')
        .select('content, is_ai')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      if (data) {
        setMessages(data.map(msg => ({
          content: msg.content,
          isUser: !msg.is_ai
        })));
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
      toast({
        title: "Error",
        description: "Failed to load chat history. Please try again.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const userMessage = { content: message, isUser: true };
    setMessages(prev => [...prev, userMessage]);
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
      const tempAiMessage = { content: "...", isUser: false };
      setMessages(prev => [...prev, tempAiMessage]);

      try {
        const { data, error } = await supabase.functions.invoke('process-chat', {
          body: { message: userMessage.content, userId: user.id }
        });

        // Remove the loading indicator message
        setMessages(prev => prev.slice(0, -1));

        if (error) {
          console.error('Function error:', error);
          
          // Add an error message
          setMessages(prev => [...prev, { 
            content: "Sorry, I'm having trouble processing your request right now. Please try again later.", 
            isUser: false 
          }]);
          
          toast({
            title: "Communication Error",
            description: "Failed to communicate with the AI. Please try again later.",
            variant: "destructive",
          });
          
          return;
        }

        const aiMessage = { 
          content: data?.response || "I'm sorry, I couldn't process that request.", 
          isUser: false 
        };
        setMessages(prev => [...prev, aiMessage]);
        
        // Show notification for timer-related responses
        if (data?.response && (
            data.response.includes("set a timer") || 
            data.response.includes("notify you at") ||
            data.response.includes("timer for") ||
            data.response.includes("timer is complete")
        )) {
          showNotification({
            title: "Timer Set",
            message: data.response,
            type: "info"
          });
        }
        
        // Refresh the tasks list after AI processes the message
        await queryClient.invalidateQueries({ queryKey: ['tasks'] });

        // Also refresh timer notifications
        await queryClient.invalidateQueries({ queryKey: ['notifications'] });
      } catch (invokeError) {
        console.error('Error invoking function:', invokeError);
        
        // Remove the loading indicator message if it exists
        if (messages.length > 0 && messages[messages.length - 1].content === "...") {
          setMessages(prev => prev.slice(0, -1));
        }
        
        // Add an error message
        setMessages(prev => [...prev, { 
          content: "Sorry, I'm having trouble connecting to the server. Please check your internet connection and try again.", 
          isUser: false 
        }]);
        
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
  };

  return {
    message,
    messages,
    isLoading,
    setMessage,
    handleSubmit,
    fetchChatHistory
  };
}
