
import { MobileChatHeader } from "../MobileChatHeader";
import { ChatMessages } from "../ChatMessages";
import { ChatInput } from "../ChatInput";
import { MobileChatViewProps } from "../types";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function MobileChatView({
  onClose,
  message,
  messages,
  isLoading,
  onMessageChange,
  onSubmit
}: MobileChatViewProps) {
  // Add query client for refreshing tasks after creation
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Listen for the ai-response event specifically for task creation in mobile view
  useEffect(() => {
    const handleAiResponse = (e: CustomEvent<any>) => {
      if (e.detail?.task) {
        console.log('📱 Mobile chat detected task creation event:', e.detail.task);
        // Show success toast
        toast.success("Task created successfully!");
        
        // Refresh tasks with a slight delay to ensure backend is updated
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ['tasks'] });
          queryClient.invalidateQueries({ queryKey: ['weekly-tasks'] });
        }, 500);
      }
    };

    // Listen for any errors in the chat process
    const handleAiError = (e: CustomEvent<any>) => {
      if (e.detail?.error) {
        console.error('📱 Mobile chat error:', e.detail.error);
        setErrorMessage(e.detail.error);
        toast.error(e.detail.error);
      }
    };

    window.addEventListener('ai-response', handleAiResponse as EventListener);
    window.addEventListener('ai-error', handleAiError as EventListener);
    
    return () => {
      window.removeEventListener('ai-response', handleAiResponse as EventListener);
      window.removeEventListener('ai-error', handleAiError as EventListener);
    };
  }, [queryClient]);

  // Custom submit handler for mobile chat to better handle loading states
  const handleMobileSubmit = (e: React.FormEvent) => {
    setErrorMessage(null);
    try {
      console.log('📱 Mobile chat: submitting message');
      onSubmit(e);
    } catch (error) {
      console.error('📱 Mobile chat submission error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setErrorMessage(errorMessage);
      toast.error(errorMessage);
      
      // Dispatch a custom error event
      window.dispatchEvent(new CustomEvent('ai-error', { 
        detail: { error: errorMessage }
      }));
    }
  };

  return (
    <div className="fixed left-0 right-0 pointer-events-none z-40" 
         style={{ top: '72px', bottom: '80px' }}>
      <div className="flex flex-col h-full bg-background pointer-events-auto">
        <MobileChatHeader onClose={onClose} />
        {errorMessage && (
          <div className="bg-red-50 p-3 mx-3 mt-2 rounded-md text-red-600 text-sm">
            {errorMessage}
          </div>
        )}
        <ChatMessages messages={messages} isLoading={isLoading} />
        <ChatInput 
          message={message}
          onMessageChange={onMessageChange}
          onSubmit={handleMobileSubmit}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
