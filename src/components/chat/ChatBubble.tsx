import { useState, useEffect } from "react";
import { useChat } from "@/hooks/use-chat";
import { useIsMobile } from "@/hooks/use-mobile";
import { ChatDialog } from "./components/ChatDialog";
import { ChatButton } from "./components/ChatButton";
import { MobileChatView } from "./components/MobileChatView";

interface ChatBubbleProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  variant?: 'floating' | 'sidebar';
}

export function ChatBubble({ isOpen, onOpenChange, variant = 'floating' }: ChatBubbleProps) {
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

  if (isMobile) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        {variant === 'floating' && <ChatButton onClick={() => handleOpenChange(true)} />}
        {isDialogOpen && (
          <MobileChatView
            onClose={() => handleOpenChange(false)}
            message={message}
            messages={messages}
            isLoading={isLoading}
            onMessageChange={setMessage}
            onSubmit={handleSubmit}
          />
        )}
      </div>
    );
  }

  if (variant === 'sidebar') {
    return (
      <ChatDialog
        isOpen={isDialogOpen}
        onOpenChange={handleOpenChange}
        message={message}
        messages={messages}
        isLoading={isLoading}
        onMessageChange={setMessage}
        onSubmit={handleSubmit}
      />
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <ChatDialog
        isOpen={isDialogOpen}
        onOpenChange={handleOpenChange}
        message={message}
        messages={messages}
        isLoading={isLoading}
        onMessageChange={setMessage}
        onSubmit={handleSubmit}
      />
      <ChatButton onClick={() => handleOpenChange(true)} />
    </div>
  );
}