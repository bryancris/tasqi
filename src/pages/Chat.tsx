
import { useChat } from "@/hooks/chat/use-chat";
import { useEffect, useState } from "react";
import { MobileChatView } from "@/components/chat/MobileChatView";
import { DesktopChatView } from "@/components/chat/DesktopChatView";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNotificationChecker } from "@/hooks/notifications/use-notification-checker";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function Chat() {
  const [error, setError] = useState<Error | null>(null);
  const [migrating, setMigrating] = useState(false);
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

  // New function to migrate embeddings
  const handleMigrateEmbeddings = async () => {
    try {
      setMigrating(true);
      toast.info("Starting embedding migration...");
      
      const { data, error } = await supabase.functions.invoke('migrate-embeddings', {});
      
      if (error) {
        console.error("Error migrating embeddings:", error);
        toast.error("Failed to migrate embeddings");
        return;
      }
      
      console.log("Migration results:", data);
      if (data.success) {
        toast.success(`Embedding migration complete! Processed ${data.processed} messages (${data.successful} successful, ${data.failed} failed)`);
      } else {
        toast.error("Migration encountered errors");
      }
    } catch (err) {
      console.error("Error running migration:", err);
      toast.error("Failed to run migration");
    } finally {
      setMigrating(false);
    }
  };

  // Add admin controls for development
  const AdminControls = () => (
    <div className="fixed bottom-24 right-4 z-40">
      <Button 
        size="sm" 
        variant="secondary"
        onClick={handleMigrateEmbeddings}
        disabled={migrating}
        className="text-xs opacity-70 hover:opacity-100"
      >
        {migrating ? "Migrating..." : "✨ Enhance Memory"}
      </Button>
    </div>
  );

  // Render based on device type
  if (isMobile) {
    return (
      <>
        <MobileChatView
          error={error}
          message={message}
          messages={messages}
          isLoading={isLoading}
          onMessageChange={setMessage}
          onSubmit={handleSubmitWithErrorHandling}
          onRetry={handleRetry}
        />
        <AdminControls />
      </>
    );
  }

  return (
    <>
      <DesktopChatView
        error={error}
        message={message}
        messages={messages}
        isLoading={isLoading}
        onMessageChange={setMessage}
        onSubmit={handleSubmitWithErrorHandling}
        onRetry={handleRetry}
      />
      <AdminControls />
    </>
  );
}
