
import { MobileChatHeader } from "../MobileChatHeader";
import { ChatMessages } from "../ChatMessages";
import { ChatInput } from "../ChatInput";
import { MobileChatViewProps } from "../types";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

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
  
  // Listen for the ai-response event specifically for task creation in mobile view
  useEffect(() => {
    const handleAiResponse = (e: CustomEvent<any>) => {
      if (e.detail?.task) {
        console.log('🔄 Mobile chat detected task creation, refreshing data');
        // Refresh tasks with a slight delay to ensure backend is updated
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ['tasks'] });
          queryClient.invalidateQueries({ queryKey: ['weekly-tasks'] });
        }, 500);
      }
    };

    window.addEventListener('ai-response', handleAiResponse as EventListener);
    return () => window.removeEventListener('ai-response', handleAiResponse as EventListener);
  }, [queryClient]);

  return (
    <div className="fixed left-0 right-0 pointer-events-none z-40" 
         style={{ top: '72px', bottom: '80px' }}>
      <div className="flex flex-col h-full bg-background pointer-events-auto">
        <MobileChatHeader onClose={onClose} />
        <ChatMessages messages={messages} isLoading={isLoading} />
        <ChatInput 
          message={message}
          onMessageChange={onMessageChange}
          onSubmit={onSubmit}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
