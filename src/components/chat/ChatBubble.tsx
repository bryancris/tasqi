
import { useState, useEffect } from "react";
import { useChat } from "@/hooks/use-chat";
import { useIsMobile } from "@/hooks/use-mobile";
import { ChatDialog } from "./components/ChatDialog";
import { MobileChatView } from "./components/MobileChatView";
import { useNavigate } from "react-router-dom";

interface ChatBubbleProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  variant?: 'floating' | 'sidebar';
}

export function ChatBubble({ isOpen, onOpenChange, variant = 'floating' }: ChatBubbleProps) {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { 
    message, 
    messages, 
    isLoading, 
    setMessage, 
    handleSubmit,
    fetchChatHistory 
  } = useChat();

  const [keyBuffer, setKeyBuffer] = useState("");

  useEffect(() => {
    if (isMobile) return; // Only add keyboard shortcuts on desktop

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return; // Prevent multiple triggers from key being held down
      
      // Add the current key to the buffer
      setKeyBuffer(prev => {
        const newBuffer = prev + e.key;
        
        // Check if the buffer ends with one of our shortcuts
        if (newBuffer.endsWith("`a")) {
          // Open the chat window
          const newOpen = true;
          if (!isOpen) {
            onOpenChange?.(newOpen);
            setOpen(newOpen);
          }
          // Reset the buffer
          return "";
        }
        
        if (newBuffer.endsWith("`w")) {
          // Navigate to weekly view
          navigate("/dashboard/weekly");
          // Reset the buffer
          return "";
        }
        
        // Keep only the last 2 characters to avoid buffer growing too large
        return newBuffer.slice(-2);
      });
    };

    // Add event listener
    window.addEventListener("keydown", handleKeyDown);

    // Cleanup function
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMobile, isOpen, onOpenChange, navigate]);

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
    </div>
  );
}
