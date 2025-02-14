
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
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get user settings to check last greeting time
        const { data: settings } = await supabase
          .from('user_settings')
          .select('last_greeting_at')
          .eq('user_id', user.id)
          .single();

        const lastGreeting = settings?.last_greeting_at ? new Date(settings.last_greeting_at) : null;
        const now = new Date();
        const shouldShowGreeting = !lastGreeting || 
          format(lastGreeting, 'yyyy-MM-dd') !== format(now, 'yyyy-MM-dd');

        if (shouldShowGreeting) {
          // Generate new AI greeting
          const { data, error } = await supabase.functions.invoke('generate-greeting', {
            body: { tasks, userId: user.id }
          });

          if (error) throw error;

          setGreetingMessage(data.message);
          setShowGreeting(true);
          setHasGreeted(true);
        }
      } catch (error) {
        console.error('Error showing greeting:', error);
      }
    };

    if (!hasGreeted) {
      checkAndShowGreeting();
    }
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
