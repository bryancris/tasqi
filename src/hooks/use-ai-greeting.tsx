
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTasks } from "./use-tasks";

export function useAiGreeting() {
  const [hasGreeted, setHasGreeted] = useState(false);
  const [showGreeting, setShowGreeting] = useState(false);
  const [greetingMessage, setGreetingMessage] = useState("");
  const { tasks } = useTasks();

  useEffect(() => {
    const checkAndShowGreeting = async () => {
      try {
        if (hasGreeted) return;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get user settings
        const { data: settings } = await supabase
          .from('user_settings')
          .select('last_greeting_at')
          .eq('user_id', user.id)
          .single();

        const now = new Date();
        const resetTime = new Date();
        resetTime.setHours(2, 0, 0, 0);

        // Check if we should show greeting (if last greeting was before 2 AM today)
        const shouldShowGreeting = !settings?.last_greeting_at || 
          new Date(settings.last_greeting_at) < resetTime;

        if (shouldShowGreeting) {
          // Count today's tasks
          const todayTasks = tasks.filter(task => 
            task.status === 'scheduled' && 
            task.date === format(now, 'yyyy-MM-dd')
          );

          // Generate greeting based on time of day
          const hour = now.getHours();
          let timeGreeting = "Hello";
          if (hour < 12) timeGreeting = "Good morning";
          else if (hour < 18) timeGreeting = "Good afternoon";
          else timeGreeting = "Good evening";

          // Construct greeting message
          let message = `${timeGreeting}! `;
          if (todayTasks.length > 0) {
            message += `You have ${todayTasks.length} task${todayTasks.length === 1 ? '' : 's'} scheduled for today.`;
          } else {
            message += "You don't have any tasks scheduled for today yet.";
          }

          // Update last greeting time in database
          await supabase
            .from('user_settings')
            .update({ 
              last_greeting_at: now.toISOString(),
              greeting_message: message
            })
            .eq('user_id', user.id);

          setGreetingMessage(message);
          setShowGreeting(true);
          setHasGreeted(true);
        }
      } catch (error) {
        console.error('Error showing greeting:', error);
      }
    };

    checkAndShowGreeting();
  }, [tasks, hasGreeted]);

  return (
    <Dialog open={showGreeting} onOpenChange={setShowGreeting}>
      <DialogContent className="bg-gradient-to-r from-violet-500 to-fuchsia-500">
        <DialogHeader>
          <DialogTitle className="text-white text-xl font-semibold">
            Daily Update
          </DialogTitle>
        </DialogHeader>
        <div className="text-white text-lg py-4">
          {greetingMessage}
        </div>
      </DialogContent>
    </Dialog>
  );
}
