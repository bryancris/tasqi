
import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Message } from "./types";
import { ErrorBoundary } from "@/components/ui/error-boundary";

interface DesktopChatViewProps {
  error: Error | null;
  message: string;
  messages: Message[];
  isLoading: boolean;
  onMessageChange: (message: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onRetry: () => void;
}

export function DesktopChatView({
  error,
  message,
  messages,
  isLoading,
  onMessageChange,
  onSubmit,
  onRetry
}: DesktopChatViewProps) {
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
                <Button variant="outline" onClick={onRetry}>Try Again</Button>
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
                  <Button variant="outline" onClick={onRetry}>Try Again</Button>
                </div>
              </div>
            ) : (
              <>
                <ChatMessages messages={messages} isLoading={isLoading} />
                <ChatInput 
                  message={message}
                  onMessageChange={onMessageChange}
                  onSubmit={onSubmit}
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
