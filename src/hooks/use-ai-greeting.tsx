
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
        // Temporarily removed the hasGreeted check for testing
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // For testing, always show greeting
        const shouldShowGreeting = true;

        if (shouldShowGreeting) {
          const now = new Date();
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

          setGreetingMessage(message);
          setShowGreeting(true);
          setHasGreeted(true);
        }
      } catch (error) {
        console.error('Error showing greeting:', error);
      }
    };

    checkAndShowGreeting();
  }, [tasks]);

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
