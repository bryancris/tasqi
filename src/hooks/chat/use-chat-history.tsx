
import { useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Message } from "@/components/chat/types";

export function useChatHistory(setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void) {
  const { toast } = useToast();

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
  }, [toast, setMessages]);

  return {
    fetchChatHistory
  };
}
