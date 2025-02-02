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
  }, [open, fetchChatHistory]);

  // Handle both controlled and uncontrolled states
  const isControlled = isOpen !== undefined;
  const isDialogOpen = isControlled ? isOpen : open;
  
  const handleOpenChange = (newOpen: boolean) => {
    if (!isControlled) {
      setOpen(newOpen);
    }
    onOpenChange?.(newOpen);
  };

  const renderChatButton = () => (
    <Button
      size="icon"
      className="h-12 w-12 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700"
      onClick={() => handleOpenChange(true)}
    >
      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
        <span className="text-blue-600 text-xl">AI</span>
      </div>
    </Button>
  );

  if (isMobile) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        {renderChatButton()}
        {isDialogOpen && (
          <div className="fixed inset-0 bg-background" style={{ top: '72px', bottom: '80px' }}>
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
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          {renderChatButton()}
        </DialogTrigger>
        <DialogContent 
          hideCloseButton
          className="p-0 fixed bottom-20 right-4 mb-0 sm:max-w-[440px] rounded-xl"
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
    </div>
  );
}