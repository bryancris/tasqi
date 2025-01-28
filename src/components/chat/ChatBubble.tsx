import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ChatInput } from "./ChatInput";
import { ChatHeader } from "./ChatHeader";
import { ChatMessages } from "./ChatMessages";
import { Message } from "./types";
import { useQueryClient } from "@tanstack/react-query";

export function ChatBubble() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (open) {
      fetchChatHistory();
    }
  }, [open]);

  const fetchChatHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user logged in");

      const { data, error } = await supabase
        .from('chat_messages')
        .select('content, is_ai')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

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
        description: "Failed to load chat history",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const userMessage = { content: message, isUser: true };
    setMessages(prev => [...prev, userMessage]);
    setMessage("");
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user logged in");

      const { data, error } = await supabase.functions.invoke('process-chat', {
        body: { message, userId: user.id }
      });

      if (error) throw error;

      const aiMessage = { 
        content: data.response || "I'm sorry, I couldn't process that request.", 
        isUser: false 
      };
      setMessages(prev => [...prev, aiMessage]);
      
      // Refresh the tasks list after AI processes the message
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
      
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="icon"
          className="fixed bottom-4 right-4 h-12 w-12 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700"
        >
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 text-xl">AI</span>
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent className="fixed bottom-[4.5rem] right-4 mb-0 p-0 sm:max-w-[440px] rounded-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 origin-bottom-right">
        <div className="flex h-[600px] flex-col">
          <ChatHeader onClose={() => setOpen(false)} />
          <ChatMessages messages={messages} isLoading={isLoading} />
          <ChatInput 
            message={message}
            onMessageChange={setMessage}
            onSubmit={handleSubmit}
            isLoading={isLoading}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}