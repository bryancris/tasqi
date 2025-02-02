import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChatInput } from "./ChatInput";
import { ChatHeader } from "./ChatHeader";
import { MobileChatHeader } from "./MobileChatHeader";
import { ChatMessages } from "./ChatMessages";
import { useChat } from "@/hooks/use-chat";
import { useIsMobile } from "@/hooks/use-mobile";

interface ChatBubbleProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ChatBubble({ isOpen, onOpenChange }: ChatBubbleProps) {
  const [mounted, setMounted] = useState(false);
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
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (open) {
      fetchChatHistory();
    }
  }, [open, fetchChatHistory]);

  if (!mounted) return null;

  // Handle both controlled and uncontrolled states
  const isControlled = isOpen !== undefined;
  const isDialogOpen = isControlled ? isOpen : open;
  
  const handleOpenChange = (newOpen: boolean) => {
    if (!isControlled) {
      setOpen(newOpen);
    }
    onOpenChange?.(newOpen);
  };

  if (isMobile) {
    return (
      <>
        <Button
          size="icon"
          className="fixed bottom-20 right-4 h-12 w-12 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 z-[9999]"
          onClick={() => handleOpenChange(true)}
        >
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 text-xl">AI</span>
          </div>
        </Button>
        {isDialogOpen && (
          <div className="fixed inset-0 bg-background z-[9999]" style={{ top: '72px', bottom: '80px' }}>
            <div className="flex flex-col h-full">
              <MobileChatHeader onClose={() => handleOpenChange(false)} />
              <ChatMessages messages={messages} isLoading={isLoading} />
              <ChatInput 
                message={message}
                onMessageChange={setMessage}
                onSubmit={handleSubmit}
                isLoading={isLoading}
              />
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <Button
        size="icon"
        className="fixed bottom-4 right-4 h-12 w-12 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 z-[9999]"
        onClick={() => handleOpenChange(true)}
      >
        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
          <span className="text-blue-600 text-xl">AI</span>
        </div>
      </Button>
      <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
        <DialogContent 
          hideCloseButton
          className="p-0 fixed bottom-[4.5rem] right-4 mb-0 sm:max-w-[440px] rounded-xl z-[9999]
            data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 
            data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 
            origin-bottom-right"
        >
          <div className="flex flex-col h-[600px]">
            <ChatHeader onClose={() => handleOpenChange(false)} />
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
    </>
  );
}