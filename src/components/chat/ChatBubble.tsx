import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
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
    const timer = setTimeout(() => {
      console.log("ChatBubble mounting with delay...");
      setMounted(true);
    }, 100);

    return () => {
      console.log("ChatBubble cleanup...");
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (open) {
      fetchChatHistory();
    }
  }, [open, fetchChatHistory]);

  console.log("ChatBubble render - mounted:", mounted, "isMobile:", isMobile);

  // Handle both controlled and uncontrolled states
  const isControlled = isOpen !== undefined;
  const isDialogOpen = isControlled ? isOpen : open;
  
  const handleOpenChange = (newOpen: boolean) => {
    console.log("Dialog open state changing to:", newOpen);
    if (!isControlled) {
      setOpen(newOpen);
    }
    onOpenChange?.(newOpen);
  };

  if (!mounted) {
    console.log("ChatBubble not mounted yet, returning null");
    return null;
  }

  const renderChatButton = () => (
    <Button
      size="icon"
      className="fixed bottom-4 right-4 h-12 w-12 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 z-[9999]"
      onClick={() => !isControlled && handleOpenChange(true)}
    >
      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
        <span className="text-blue-600 text-xl">AI</span>
      </div>
    </Button>
  );

  if (isMobile) {
    console.log("Rendering mobile chat bubble");
    return (
      <>
        {renderChatButton()}
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

  console.log("Rendering desktop chat bubble");
  return (
    <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {renderChatButton()}
      </DialogTrigger>
      <DialogContent 
        hideCloseButton
        className="p-0 fixed bottom-[4.5rem] right-4 mb-0 sm:max-w-[440px] rounded-xl z-[9999]"
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
  );
}