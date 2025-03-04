
import { MobileChatHeader } from "../MobileChatHeader";
import { ChatMessages } from "../ChatMessages";
import { ChatInput } from "../ChatInput";
import { MobileChatViewProps } from "../types";
import { useEffect, useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ErrorBoundary } from "@/components/ui/error-boundary";

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
  const hasRespondedRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const requestTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Listen for the ai-response event specifically for task creation in mobile view
  useEffect(() => {
    const handleAiResponse = (e: CustomEvent<any>) => {
      console.log('📱 Mobile chat detected AI response event:', e.detail);
      
      // Clear any loading timeouts
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      if (requestTimeoutRef.current) {
        clearTimeout(requestTimeoutRef.current);
        requestTimeoutRef.current = null;
      }
      
      // Mark that we've received a response
      hasRespondedRef.current = true;
      
      // Handle task creation response
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
      
      // Clear any error message that might be showing
      setErrorMessage(null);
    };

    // Listen for any errors in the chat process
    const handleAiError = (e: CustomEvent<any>) => {
      console.error('📱 Mobile chat error:', e.detail?.error || 'Unknown error');
      
      // Clear any loading timeouts
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      if (requestTimeoutRef.current) {
        clearTimeout(requestTimeoutRef.current);
        requestTimeoutRef.current = null;
      }
      
      // Mark that we've received a response (even if it's an error)
      hasRespondedRef.current = true;
      
      if (e.detail?.error) {
        setErrorMessage(e.detail.error);
        toast.error(e.detail.error);
      } else {
        setErrorMessage("Failed to get a response. Please try again.");
        toast.error("Communication error. Please try again.");
      }
    };

    window.addEventListener('ai-response', handleAiResponse as EventListener);
    window.addEventListener('ai-error', handleAiError as EventListener);
    
    return () => {
      // Clear any pending timeouts on cleanup
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      if (requestTimeoutRef.current) {
        clearTimeout(requestTimeoutRef.current);
      }
      
      window.removeEventListener('ai-response', handleAiResponse as EventListener);
      window.removeEventListener('ai-error', handleAiError as EventListener);
    };
  }, [queryClient]);

  // Custom submit handler for mobile chat to better handle loading states
  const handleMobileSubmit = (e: React.FormEvent) => {
    // Reset state before submission
    setErrorMessage(null);
    hasRespondedRef.current = false;
    
    // Clear any existing timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    if (requestTimeoutRef.current) {
      clearTimeout(requestTimeoutRef.current);
    }
    
    try {
      console.log('📱 Mobile chat: submitting message');
      onSubmit(e);
      
      // Set a safety timeout to clear loading state if no response is received
      timeoutRef.current = setTimeout(() => {
        if (!hasRespondedRef.current) {
          console.error('📱 Mobile chat: No response received within timeout period');
          setErrorMessage("No response received. Please try again.");
          toast.error("Request timed out. Please try again.");
          
          // Dispatch a custom error event
          window.dispatchEvent(new CustomEvent('ai-error', { 
            detail: { error: "Request timed out" }
          }));
        }
      }, 25000); // 25-second timeout for the whole process
      
      // Set a second shorter timeout to check progress and provide feedback
      requestTimeoutRef.current = setTimeout(() => {
        if (!hasRespondedRef.current) {
          console.log('📱 Mobile chat: Request taking longer than usual, showing progress message');
          toast.info("Your request is taking longer than usual, but I'm still working on it.");
        }
      }, 10000); // 10-second timeout for progress update
      
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
      <ErrorBoundary fallback={
        <div className="flex flex-col h-full bg-background pointer-events-auto">
          <MobileChatHeader onClose={onClose} />
          <div className="flex-1 p-4 flex items-center justify-center">
            <div className="bg-red-50 p-4 rounded-lg text-center">
              <h3 className="font-medium text-red-800 mb-2">Something went wrong</h3>
              <p className="text-red-600">There was an error displaying the chat. Please try again.</p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-3 px-4 py-2 bg-red-100 text-red-800 rounded-md"
              >
                Reload App
              </button>
            </div>
          </div>
        </div>
      }>
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
      </ErrorBoundary>
    </div>
  );
}
