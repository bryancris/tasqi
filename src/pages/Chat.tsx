
import { useChat } from "@/hooks/use-chat";
import { useEffect, useState } from "react";
import { ChatMessages } from "@/components/chat/ChatMessages";
import { ChatInput } from "@/components/chat/ChatInput";
import { MobileHeader } from "@/components/layouts/MobileHeader";
import { MobileFooter } from "@/components/layouts/MobileFooter";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

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

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#F1F0FB] to-[#E5DEFF]">
      <MobileHeader />
      <main className="flex-1 overflow-hidden flex flex-col" style={{ marginTop: '72px', marginBottom: '80px' }}>
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
                onSubmit={handleSubmit}
                isLoading={isLoading}
              />
            </>
          )}
        </div>
      </main>
      <MobileFooter activePage="chat" />
    </div>
  );
}
