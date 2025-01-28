import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChatInput } from "./ChatInput";
import { ChatHeader } from "./ChatHeader";
import { ChatMessages } from "./ChatMessages";
import { useChat } from "@/hooks/use-chat";
import { useIsMobile } from "@/hooks/use-mobile";

export function ChatBubble() {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  const { 
    message, 
    messages, 
    isLoading, 
    setMessage, 
    handleSubmit,
    fetchChatHistory 
  } = useChat();

  useEffect(() => {
    if (open) {
      fetchChatHistory();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {!isMobile && (
          <Button
            size="icon"
            className="fixed bottom-4 right-4 h-12 w-12 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700"
          >
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 text-xl">AI</span>
            </div>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent 
        className={`p-0 ${isMobile 
          ? 'fixed inset-0 w-full h-full rounded-none' 
          : 'fixed bottom-[4.5rem] right-4 mb-0 sm:max-w-[440px] rounded-xl'} 
          data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 
          data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 
          ${!isMobile ? 'origin-bottom-right' : ''}`}
      >
        <div className={`flex flex-col ${isMobile ? 'h-full' : 'h-[600px]'}`}>
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