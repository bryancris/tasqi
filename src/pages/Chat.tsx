
import { useChat } from "@/hooks/chat/use-chat";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNotificationChecker } from "@/hooks/notifications/use-notification-checker";
import { ChatMessages } from "@/components/chat/ChatMessages";
import { ChatInput } from "@/components/chat/ChatInput";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileChatView } from "@/components/chat/MobileChatView";

export default function Chat() {
  const [error, setError] = useState<Error | null>(null);
  const { 
    message, 
    messages, 
    isLoading, 
    setMessage, 
    handleSubmit,
    fetchChatHistory 
  } = useChat();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  
  // Use our new notification checker hook
  useNotificationChecker();
  
  // Listen for AI task events in both mobile and desktop views
  useEffect(() => {
    const handleAiTaskEvents = (e: CustomEvent<any>) => {
      if (e.detail?.task) {
        console.log('📱 Chat page detected task creation event:', e.detail.task);
        // Refresh tasks after AI created a task
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ['tasks'] });
          queryClient.invalidateQueries({ queryKey: ['weekly-tasks'] });
        }, 500);
      }
    };
    
    const handleAiErrors = (e: CustomEvent<any>) => {
      if (e.detail?.error) {
        console.error('📱 Chat page detected error event:', e.detail.error);
        setError(new Error(e.detail.error));
      }
    };
    
    window.addEventListener('ai-response', handleAiTaskEvents as EventListener);
    window.addEventListener('ai-error', handleAiErrors as EventListener);
    
    return () => {
      window.removeEventListener('ai-response', handleAiTaskEvents as EventListener);
      window.removeEventListener('ai-error', handleAiErrors as EventListener);
    };
  }, [queryClient]);

  useEffect(() => {
    try {
      fetchChatHistory();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch chat history'));
    }
  }, [fetchChatHistory]);

  const handleRetry = () => {
    setError(null);
    fetchChatHistory();
  };

  // Custom error handler wrapper for submit
  const handleSubmitWithErrorHandling = async (e: React.FormEvent) => {
    try {
      await handleSubmit(e);
    } catch (err) {
      console.error('Error in chat submission:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  };

  // Use the specialized mobile view component for mobile devices
  if (isMobile) {
    return (
      <MobileChatView
        error={error}
        message={message}
        messages={messages}
        isLoading={isLoading}
        onMessageChange={setMessage}
        onSubmit={handleSubmitWithErrorHandling}
        onRetry={handleRetry}
      />
    );
  }

  // Desktop view
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#F1F0FB] to-[#E5DEFF]">
      <main className="flex-1 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b bg-white shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 text-xl">AI</span>
            </div>
            <div>
              <h2 className="text-base font-medium">AI Assistant</h2>
              <p className="text-sm text-muted-foreground">Here to help manage your tasks</p>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-hidden flex flex-col">
          <ErrorBoundary fallback={
            <div className="flex-1 flex flex-col items-center justify-center p-6">
              <div className="bg-red-50 p-6 rounded-lg text-center max-w-md">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-red-700 mb-2">Chat Error</h3>
                <p className="text-red-600 mb-4">
                  There was a problem with the chat. This could be due to network issues or the server being unavailable.
                </p>
                <Button variant="outline" onClick={handleRetry}>Try Again</Button>
              </div>
            </div>
          }>
            {error ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6">
                <div className="bg-red-50 p-6 rounded-lg text-center max-w-md">
                  <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-red-700 mb-2">Communication Error</h3>
                  <p className="text-red-600 mb-4">
                    There was a problem connecting to the AI assistant. This could be due to network issues or the server being unavailable.
                  </p>
                  <Button variant="outline" onClick={handleRetry}>Try Again</Button>
                </div>
              </div>
            ) : (
              <>
                <ChatMessages messages={messages} isLoading={isLoading} />
                <ChatInput 
                  message={message}
                  onMessageChange={setMessage}
                  onSubmit={handleSubmitWithErrorHandling}
                  isLoading={isLoading}
                />
              </>
            )}
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
}
