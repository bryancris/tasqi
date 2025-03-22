
import { useEffect, useRef } from "react";
import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Message } from "./types";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { MobileChatHeader } from "./MobileChatHeader";

interface MobileChatViewProps {
  error: Error | null;
  message: string;
  messages: Message[];
  isLoading: boolean;
  onMessageChange: (message: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onRetry: () => void;
}

export function MobileChatView({
  error,
  message,
  messages,
  isLoading,
  onMessageChange,
  onSubmit,
  onRetry
}: MobileChatViewProps) {
  // Create refs for the chat content and message input
  const contentRef = useRef<HTMLDivElement>(null);

  // Ensure the content fills available space but doesn't overflow
  useEffect(() => {
    const adjustContentHeight = () => {
      if (contentRef.current) {
        // Set a small timeout to ensure DOM is fully rendered
        setTimeout(() => {
          const viewportHeight = window.innerHeight;
          const headerElement = document.querySelector('.mobile-chat-header');
          const inputElement = document.querySelector('.mobile-chat-input');
          const footerElement = document.querySelector('.fixed.bottom-0'); // Mobile footer
          
          // Get heights of elements
          const headerHeight = headerElement ? headerElement.getBoundingClientRect().height : 0;
          const inputHeight = inputElement ? inputElement.getBoundingClientRect().height : 0;
          const footerHeight = footerElement ? footerElement.getBoundingClientRect().height : 56; // Default height
          
          // Calculate available height for content
          const availableHeight = viewportHeight - headerHeight - inputHeight - footerHeight;
          
          // Apply the height to content area
          contentRef.current.style.height = `${availableHeight}px`;
          contentRef.current.style.maxHeight = `${availableHeight}px`;
        }, 100);
      }
    };

    // Run on mount and when window resizes
    adjustContentHeight();
    window.addEventListener('resize', adjustContentHeight);
    
    return () => {
      window.removeEventListener('resize', adjustContentHeight);
    };
  }, []);

  return (
    <div className="flex flex-col h-full">
      <MobileChatHeader onClose={() => {}} className="mobile-chat-header" />
      
      <div 
        ref={contentRef}
        className="flex-1 overflow-hidden relative"
      >
        <ErrorBoundary fallback={
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
            <div className="bg-red-50 p-6 rounded-lg text-center max-w-md">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-red-700 mb-2">Chat Error</h3>
              <p className="text-red-600 mb-4">
                There was a problem with the chat. This could be due to network issues or the server being unavailable.
              </p>
              <Button variant="outline" onClick={onRetry}>Try Again</Button>
            </div>
          </div>
        }>
          {error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
              <div className="bg-red-50 p-6 rounded-lg text-center max-w-md">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-red-700 mb-2">Communication Error</h3>
                <p className="text-red-600 mb-4">
                  There was a problem connecting to the AI assistant. This could be due to network issues or the server being unavailable.
                </p>
                <Button variant="outline" onClick={onRetry}>Try Again</Button>
              </div>
            </div>
          ) : (
            <ChatMessages messages={messages} isLoading={isLoading} />
          )}
        </ErrorBoundary>
      </div>
      
      <div className="mobile-chat-input">
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
