
import { useChat } from "@/hooks/chat/use-chat";
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
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import { ErrorBoundary } from "@/components/ui/error-boundary";

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
  const [lastNotificationCheck, setLastNotificationCheck] = useState(0);
  const isMobile = useIsMobile();
  
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

    // Set up notification checker function with better logging
    const checkForNotifications = async () => {
      console.log('🔍 Checking for new notifications...');
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.log('⚠️ No authenticated user found');
          return;
        }

        // Check for timer-related notifications
        const { data: timerNotifications, error: timerError } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .eq('type', 'timer_complete')
          .eq('read', false)
          .order('created_at', { ascending: false });

        if (timerError) {
          console.error('❌ Error checking timer notifications:', timerError);
          return;
        }

        if (timerNotifications && timerNotifications.length > 0) {
          console.log('📱 Found timer notifications:', timerNotifications.length, timerNotifications);
          
          // Play notification sound once for all notifications
          try {
            const soundResult = await playNotificationSound();
            console.log('🔊 Notification sound played result:', soundResult);
          } catch (soundError) {
            console.error('❌ Failed to play notification sound:', soundError);
            // Try emergency fallback for sound
            try {
              const audio = new Audio('/notification-sound.mp3');
              audio.volume = 1.0;
              await audio.play();
              console.log('🔊 Emergency fallback sound played');
            } catch (emergencyError) {
              console.error('❌ Emergency sound also failed:', emergencyError);
            }
          }
          
          // Show notifications and mark them as read
          for (const notification of timerNotifications) {
            try {
              showNotification({
                title: notification.title || "Timer Complete",
                message: notification.message || "Your timer has finished",
                type: 'info',
                persistent: true,
                action: {
                  label: 'Dismiss',
                  onClick: async () => {
                    // Mark as read
                    try {
                      await supabase
                        .from('notifications')
                        .update({ read: true })
                        .eq('id', notification.id);
                      console.log('✅ Notification marked as read:', notification.id);
                    } catch (markError) {
                      console.error('❌ Failed to mark notification as read:', markError);
                    }
                  }
                }
              });
              console.log('✅ Notification shown for:', notification.title);
              
              // Mark notification as read
              await supabase
                .from('notifications')
                .update({ read: true })
                .eq('id', notification.id);
              console.log('✅ Notification marked as read after showing:', notification.id);
            } catch (notificationError) {
              console.error('❌ Error showing notification:', notificationError);
            }
          }

          // Refresh notifications list
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
          queryClient.invalidateQueries({ queryKey: ['timers'] });
        } else {
          console.log('ℹ️ No new timer notifications found');
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
          console.error('❌ Error checking task notifications:', error);
          return;
        }

        if (data && data.length > 0) {
          console.log('📱 Found task notifications:', data.length);
          // Similar handling as timer notifications
        }
        
        // Update last check timestamp
        setLastNotificationCheck(Date.now());
      } catch (err) {
        console.error('❌ Error in notification check:', err);
      }
    };

    // Check immediately and then at short intervals to ensure timers are caught
    checkForNotifications();
    
    // Check every 5 seconds - more frequent to ensure we catch timer notifications
    const intervalId = setInterval(checkForNotifications, 5000);

    return () => clearInterval(intervalId);
  }, [fetchChatHistory, showNotification, queryClient]);

  // Force a notification check when the component gets focus
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && 
          Date.now() - lastNotificationCheck > 5000) {
        console.log('👁️ Document became visible, checking for notifications');
        setLastNotificationCheck(Date.now());
        
        // Check for notifications when tab becomes visible
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        const { data: notifications } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .eq('read', false)
          .or('type.eq.timer_complete,type.eq.task_reminder')
          .order('created_at', { ascending: false });
          
        if (notifications && notifications.length > 0) {
          console.log('📱 Found notifications on visibility change:', notifications.length);
          
          // Play sound for notifications found
          try {
            await playNotificationSound();
            console.log('🔊 Notification sound played on visibility change');
          } catch (soundError) {
            console.error('❌ Sound error on visibility change:', soundError);
          }
          
          // Display notifications
          notifications.forEach(notification => {
            try {
              showNotification({
                title: notification.title || "Notification",
                message: notification.message || "You have a new notification",
                type: 'info',
                persistent: true
              });
            } catch (notificationError) {
              console.error('❌ Failed to show notification on visibility change:', notificationError);
            }
          });
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [lastNotificationCheck, showNotification]);

  const handleRetry = () => {
    setError(null);
    fetchChatHistory();
  };

  // Common chat component content used by both mobile and desktop
  const ChatContent = () => (
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
            onSubmit={handleSubmit}
            isLoading={isLoading}
          />
        </>
      )}
    </ErrorBoundary>
  );

  // Render different layouts for mobile and desktop
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#F1F0FB] to-[#E5DEFF]">
      {isMobile && <MobileHeader />}
      <main className="flex-1 overflow-hidden flex flex-col" style={{ 
        marginTop: isMobile ? '72px' : '0', 
        marginBottom: isMobile ? '80px' : '0' 
      }}>
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
          <ChatContent />
        </div>
      </main>
      {isMobile && <MobileFooter activePage="chat" />}
    </div>
  );
}
