
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

  useEffect(() => {
    if (isMobile) return; // Only add keyboard shortcuts on desktop

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '`') {
        const handleNextKey = (nextE: KeyboardEvent) => {
          if (nextE.key === 'a') {
            // Open the chat window
            const newOpen = true;
            if (!isOpen) {
              onOpenChange?.(newOpen);
              setOpen(newOpen);
            }
          } else if (nextE.key === 'w') {
            // Navigate to weekly view
            navigate("/dashboard/weekly");
          }
          // Remove the event listener after handling the second key
          window.removeEventListener('keydown', handleNextKey);
        };

        // Add event listener for the next key
        window.addEventListener('keydown', handleNextKey, { once: true });
      }
    };

    // Add event listener for the backtick key
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
      <div className="fixed bottom-4 right-4 z-40">
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
