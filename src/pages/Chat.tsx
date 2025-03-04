
import { useChat } from "@/hooks/chat/use-chat";
import { useEffect, useState } from "react";
import { MobileChatView } from "@/components/chat/MobileChatView";
import { DesktopChatView } from "@/components/chat/DesktopChatView";
import { useNotifications } from "@/components/notifications/NotificationsManager";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNotificationChecker } from "@/hooks/notifications/use-notification-checker";

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
    
    window.addEventListener('ai-response', handleAiTaskEvents as EventListener);
    return () => window.removeEventListener('ai-response', handleAiTaskEvents as EventListener);
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

  // Render based on device type
  if (isMobile) {
    return (
      <MobileChatView
        error={error}
        message={message}
        messages={messages}
        isLoading={isLoading}
        onMessageChange={setMessage}
        onSubmit={handleSubmit}
        onRetry={handleRetry}
      />
    );
  }

  return (
    <DesktopChatView
      error={error}
      message={message}
      messages={messages}
      isLoading={isLoading}
      onMessageChange={setMessage}
      onSubmit={handleSubmit}
      onRetry={handleRetry}
    />
  );
}
