
import { useState, Dispatch, SetStateAction } from 'react';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChatDialog } from './components/ChatDialog';
import { useChat } from '@/hooks/chat/use-chat';

interface ChatBubbleProps {
  variant?: 'default' | 'sidebar';
  isOpen?: boolean;
  onOpenChange?: Dispatch<SetStateAction<boolean>>;
  hideFloatingButton?: boolean; // Added new prop
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
  
  // Don't render the button if hideFloatingButton is true
  if (hideFloatingButton && variant === 'default') {
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

  // If we're in default variant and hideFloatingButton is true, don't render anything
  if (variant === 'default' && hideFloatingButton) {
    return null;
  }

  return (
    <div className={`${variant === 'sidebar' ? '' : 'fixed bottom-6 right-6 z-50'}`}>
      <Button
        size="icon"
        className={`${variant === 'default' ? 'h-14 w-14 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700' : ''}`}
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
