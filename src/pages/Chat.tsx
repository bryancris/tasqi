
import { useChat } from "@/hooks/use-chat";
import { useEffect, useState } from "react";
import { ChatMessages } from "@/components/chat/ChatMessages";
import { ChatInput } from "@/components/chat/ChatInput";
import { MobileHeader } from "@/components/layouts/MobileHeader";
import { MobileFooter } from "@/components/layouts/MobileFooter";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/components/notifications/NotificationsManager";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { playNotificationSound } from "@/utils/notifications/soundUtils";

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
  const { showNotification } = useNotifications();
  const queryClient = useQueryClient();

  useEffect(() => {
    try {
      fetchChatHistory();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch chat history'));
    }

    // Set up notification listener for timers
    const checkForNotifications = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Check for timer-related notifications
        const { data: timerNotifications, error: timerError } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .eq('type', 'timer_complete')
          .eq('read', false)
          .order('created_at', { ascending: false });

        if (timerError) {
          console.error('Error checking timer notifications:', timerError);
          return;
        }

        if (timerNotifications && timerNotifications.length > 0) {
          console.log('📱 Found timer notifications:', timerNotifications.length);
          
          // Show notifications and mark them as read
          for (const notification of timerNotifications) {
            showNotification({
              title: notification.title || "Timer Complete",
              message: notification.message || "Your timer has finished",
              type: 'info',
              persistent: true,
              action: {
                label: 'Dismiss',
                onClick: async () => {
                  // Mark as read
                  await supabase
                    .from('notifications')
                    .update({ read: true })
                    .eq('id', notification.id);
                }
              }
            });

            // Mark notification as read
            await supabase
              .from('notifications')
              .update({ read: true })
              .eq('id', notification.id);
          }

          // Play notification sound
          try {
            await playNotificationSound();
            console.log('🔊 Timer notification sound played via utils');
          } catch (soundError) {
            console.warn('Could not play sound:', soundError);
            // Fallback method
            try {
              const audio = new Audio('/notification-sound.mp3');
              audio.volume = 1.0;
              await audio.play();
            } catch (fallbackError) {
              console.error('Fallback sound also failed:', fallbackError);
            }
          }

          // Refresh notifications list if using that feature
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }

        // Also check task-related notifications
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .eq('type', 'task_reminder')
          .eq('read', false)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error checking task notifications:', error);
          return;
        }

        if (data && data.length > 0) {
          console.log('Found task notifications:', data.length);
          // Similar handling as timer notifications
        }
      } catch (err) {
        console.error('Error in notification check:', err);
      }
    };

    // Check immediately and then every 10 seconds (more frequent to ensure timers are caught)
    checkForNotifications();
    const intervalId = setInterval(checkForNotifications, 10000);

    return () => clearInterval(intervalId);
  }, [fetchChatHistory, showNotification, queryClient]);

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
