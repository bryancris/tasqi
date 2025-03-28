import { useState, Dispatch, SetStateAction } from 'react';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChatDialog } from './components/ChatDialog';
import { useChat } from '@/hooks/chat/use-chat';

interface ChatBubbleProps {
  variant?: 'default' | 'sidebar';
  isOpen?: boolean;
  onOpenChange?: Dispatch<SetStateAction<boolean>>;
  hideFloatingButton?: boolean;
}

export const ChatBubble = ({ 
  variant = 'default',
  isOpen: externalIsOpen,
  onOpenChange,
  hideFloatingButton = false
}: ChatBubbleProps) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  
  // Use external state if provided, otherwise use internal state
  const isOpen = onOpenChange ? externalIsOpen : internalIsOpen;
  const setIsOpen = onOpenChange || setInternalIsOpen;

  // Use the chat hook to get the messaging functions
  const { 
    message, 
    messages, 
    isLoading, 
    setMessage, 
    handleSubmit 
  } = useChat();
  
  // If variant is sidebar, render normally
  if (variant === 'sidebar') {
    return (
      <ChatDialog
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        message={message}
        messages={messages}
        isLoading={isLoading}
        onMessageChange={setMessage}
        onSubmit={handleSubmit}
      />
    );
  }

  // If hideFloatingButton is true or we're in default variant, don't render the floating button
  if (hideFloatingButton) {
    return null;
  }

  // Otherwise, render the floating button
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button
        size="icon"
        className="h-14 w-14 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700"
        onClick={() => setIsOpen(!isOpen)}
      >
        <MessageSquare className="h-6 w-6" />
      </Button>

      <ChatDialog
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        message={message}
        messages={messages}
        isLoading={isLoading}
        onMessageChange={setMessage}
        onSubmit={handleSubmit}
      />
    </div>
  );
};
